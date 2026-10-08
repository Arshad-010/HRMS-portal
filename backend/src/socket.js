import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected to chat socket: ${socket.user.email} (${socket.user._id})`);

    // Join a personal room for direct user-targeted events (like new conversation invites)
    socket.join(socket.user._id.toString());

    // Broadcast presence: online
    io.emit('presence:online', { userId: socket.user._id });

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      // In a production app, you'd verify if socket.user is a participant of conversationId here
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.user.email} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing indicators
    socket.on('typing:start', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId: socket.user._id,
        user: { _id: socket.user._id, email: socket.user.email } // Add name if populated
      });
    });

    socket.on('typing:stop', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: socket.user._id
      });
    });

    // Mark messages as read
    socket.on('message:read', (data) => {
      // data = { conversationId, messageIds: [] }
      // This could also be a REST API, but handling over socket is fast
      socket.to(`conversation:${data.conversationId}`).emit('message:read', {
        conversationId: data.conversationId,
        userId: socket.user._id,
        messageIds: data.messageIds,
        readAt: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected from chat socket: ${socket.user.email}`);
      // Broadcast presence: offline
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
