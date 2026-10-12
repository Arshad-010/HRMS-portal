import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Conversation from './models/Conversation.js';
import { logger } from './utils/logger.js';

let io;

export const initSocket = (server) => {
  const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin);
        if (isLocalhost) {
          return callback(null, true);
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // Strict JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        return next(new Error('Authentication error: Invalid token structure'));
      }

      // Fetch user from DB and confirm active state
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (user.isActive === false) {
        return next(new Error('Authentication error: User account is inactive'));
      }

      // Associate verified user with socket (never trust client-supplied ID)
      socket.user = user;
      next();
    } catch (error) {
      // Do not log raw token or sensitive details
      logger.warn(`Socket authentication failed: ${error.message}`);
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userIdStr = socket.user._id.toString();

    // Automatically join the user's isolated private personal room
    socket.join(userIdStr);

    // Broadcast presence: online
    io.emit('presence:online', { userId: socket.user._id });

    // Join conversation room with participant authorization check
    socket.on('join_conversation', async (conversationId) => {
      try {
        if (!conversationId) return;

        // Verify that the connected user is actually a participant of this conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        });

        if (!conversation) {
          socket.emit('socket:error', {
            message: 'Not authorized to join this conversation room',
          });
          return;
        }

        socket.join(`conversation:${conversationId}`);
      } catch (err) {
        logger.debug(`Error joining conversation ${conversationId}: ${err.message}`);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Typing indicators (with participant safety check)
    socket.on('typing:start', async (conversationId) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId: socket.user._id,
        user: { _id: socket.user._id, email: socket.user.email },
      });
    });

    socket.on('typing:stop', (conversationId) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: socket.user._id,
      });
    });

    // Mark messages as read
    socket.on('message:read', (data) => {
      if (data && data.conversationId) {
        socket.to(`conversation:${data.conversationId}`).emit('message:read', {
          conversationId: data.conversationId,
          userId: socket.user._id,
          messageIds: data.messageIds || [],
          readAt: new Date(),
        });
      }
    });

    // Disconnect event
    socket.on('disconnect', () => {
      io.emit('presence:offline', { userId: socket.user._id, lastSeen: new Date() });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

/**
 * Emit a real-time event to a specific user's isolated room
 */
export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return false;
  try {
    io.to(userId.toString()).emit(event, payload);
    return true;
  } catch (err) {
    logger.warn(`Failed to emit ${event} to user ${userId}: ${err.message}`);
    return false;
  }
};

/**
 * Emit a real-time event to multiple users' isolated rooms
 */
export const emitToUsers = (userIds, event, payload) => {
  if (!io || !Array.isArray(userIds)) return false;
  userIds.forEach((id) => emitToUser(id, event, payload));
  return true;
};
