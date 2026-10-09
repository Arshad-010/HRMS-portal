import { google } from 'googleapis';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { getIO } from '../socket.js';

const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
    process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
    `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/meet/callback`
  );
};

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export const getAuthUrl = (req, res) => {
  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: req.user._id.toString()
  });
  res.json({ success: true, url });
};

export const googleCallback = async (req, res) => {
  const { code, state } = req.query;
  const oauth2Client = getOAuthClient();
  try {
    const { tokens } = await oauth2Client.getToken(code);
    const userId = state;
    await User.findByIdAndUpdate(userId, { googleTokens: tokens });
    res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}/chat?google_auth=success`);
  } catch (error) {
    console.error('Error during Google Auth Callback:', error);
    res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}/chat?google_auth=error`);
  }
};

export const createMeeting = async (req, res, next) => {
  try {
    const { conversationId, meetingTitle, meetingText } = req.body;
    
    // Check conversation access
    const conversation = await Conversation.findOne({ _id: conversationId, participants: req.user._id });
    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findById(req.user._id);
    if (!user.googleTokens) {
      return res.status(401).json({ success: false, requiresGoogleAuth: true });
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(user.googleTokens);
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: meetingTitle || 'Quick Sync',
      start: {
        dateTime: new Date().toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(Date.now() + 30 * 60000).toISOString(),
        timeZone: 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: `hrms-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    let eventResponse;
    try {
      eventResponse = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
      });
    } catch (apiError) {
      console.error('Google API Error:', apiError);
      if (apiError.code === 401 || (apiError.response && apiError.response.status === 401)) {
        await User.findByIdAndUpdate(req.user._id, { $unset: { googleTokens: 1 } });
        return res.status(401).json({ success: false, requiresGoogleAuth: true, message: 'Google credentials expired. Please reconnect.' });
      }
      return res.status(500).json({ success: false, message: 'Google Calendar API failed.' });
    }

    const meetUrl = eventResponse.data.hangoutLink;
    if (!meetUrl) {
      return res.status(500).json({ success: false, message: 'Failed to generate Meet link' });
    }

    const textToSave = meetingText || meetingTitle || 'Can we join for a quick meeting?';

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      text: textToSave,
      type: 'MEETING',
      meetingDetails: {
        title: meetingTitle || 'Quick Sync',
        url: meetUrl,
        date: new Date(),
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      readBy: [{ user: req.user._id }]
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    await message.populate('sender', 'email role employee');
    await User.populate(message, {
      path: 'sender.employee',
      select: 'firstName lastName designation profileImage'
    });

    const io = getIO();
    io.to(`conversation:${conversationId}`).emit('message:new', message);

    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};
