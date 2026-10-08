import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getIO } from '../socket.js';

// @desc    Get user's conversations
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'email role employee')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'email role' }
      })
      .sort('-lastMessageAt')
      .exec();

    // Populate employee details for participants for naming
    await User.populate(conversations, {
      path: 'participants.employee',
      select: 'firstName lastName designation profileImage'
    });

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or get direct conversation
// @route   POST /api/chat/conversations
// @access  Private
export const createOrGetDirectConversation = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Check if direct conversation already exists
    let conversation = await Conversation.findOne({
      type: 'DIRECT',
      participants: { $all: [req.user._id, userId], $size: 2 }
    }).populate('participants', 'email role employee')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'email role' }
      });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
        type: 'DIRECT'
      });
      conversation = await conversation.populate('participants', 'email role employee');
      
      // Notify the other user via socket
      const io = getIO();
      io.to(userId.toString()).emit('conversation:new', conversation);
    }

    await User.populate(conversation, {
      path: 'participants.employee',
      select: 'firstName lastName designation profileImage'
    });

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const conversationId = req.params.id;

    // Verify participation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'email role employee')
      .populate('taskId')
      .sort('createdAt')
      .exec();

    await User.populate(messages, {
      path: 'sender.employee',
      select: 'firstName lastName designation profileImage'
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const { text, type, fileUrl, fileName, fileType, fileSize, taskId, meetingDetails } = req.body;

    // Verify participation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Not authorized to post in this conversation' });
    }

    // Role-based checks
    if ((type === 'TASK' || type === 'MEETING') && req.user.role === 'EMPLOYEE') {
      return res.status(403).json({ success: false, message: 'Employees are not authorized to create Task or Meeting events in chat' });
    }

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      text,
      type: type || 'TEXT',
      fileUrl,
      fileName,
      fileType,
      fileSize,
      taskId,
      meetingDetails,
      readBy: [{ user: req.user._id }]
    });

    // Update conversation last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    await message.populate('sender', 'email role employee');
    await message.populate('taskId');
    await User.populate(message, {
      path: 'sender.employee',
      select: 'firstName lastName designation profileImage'
    });

    // Broadcast message via Socket.IO
    const io = getIO();
    io.to(`conversation:${conversationId}`).emit('message:new', message);

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark conversation as read
// @route   PUT /api/chat/conversations/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    
    // Find messages in this conversation not sent by the user and not already read by the user
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: { readBy: { user: req.user._id, readAt: new Date() } }
      }
    );

    res.json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    next(error);
  }
};
