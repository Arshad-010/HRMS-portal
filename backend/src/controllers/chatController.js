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
    const messagesToUpdate = await Message.find({
      conversationId,
      sender: { $ne: req.user._id },
      'readBy.user': { $ne: req.user._id }
    });

    if (messagesToUpdate.length > 0) {
      const messageIds = messagesToUpdate.map(m => m._id);
      
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
      );
      
      const io = getIO();
      io.to(`conversation:${conversationId}`).emit('message:read', {
        conversationId,
        userId: req.user._id,
        messageIds,
        readAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a message
// @route   PUT /api/chat/conversations/:id/messages/:msgId
// @access  Private
export const editMessage = async (req, res, next) => {
  try {
    const { id, msgId } = req.params;
    const { text } = req.body;

    const message = await Message.findOne({ _id: msgId, conversationId: id });
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this message' });
    }
    if (message.isDeleted) {
       return res.status(400).json({ success: false, message: 'Cannot edit a deleted message' });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    await message.populate('sender', 'email role employee');
    await message.populate('taskId');
    await User.populate(message, {
      path: 'sender.employee',
      select: 'firstName lastName designation profileImage'
    });

    const io = getIO();
    io.to(`conversation:${id}`).emit('message:update', message);

    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message
// @route   DELETE /api/chat/conversations/:id/messages/:msgId
// @access  Private
export const deleteMessage = async (req, res, next) => {
  try {
    const { id, msgId } = req.params;

    const message = await Message.findOne({ _id: msgId, conversationId: id });
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    message.isDeleted = true;
    message.text = 'This message was deleted';
    message.fileUrl = null;
    await message.save();

    const io = getIO();
    io.to(`conversation:${id}`).emit('message:delete', { messageId: msgId, conversationId: id });

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    React to a message
// @route   POST /api/chat/conversations/:id/messages/:msgId/react
// @access  Private
export const reactToMessage = async (req, res, next) => {
  try {
    const { id, msgId } = req.params;
    const { emoji } = req.body;

    const conversation = await Conversation.findOne({ _id: id, participants: req.user._id });
    if (!conversation) return res.status(403).json({ success: false, message: 'Not authorized' });

    const message = await Message.findOne({ _id: msgId, conversationId: id });
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    if (message.isDeleted) return res.status(400).json({ success: false, message: 'Message is deleted' });

    const existingReactionIndex = message.reactions.findIndex(
      r => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReactionIndex !== -1) {
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }
    await message.save();

    await message.populate('sender', 'email role employee');
    await message.populate('taskId');
    await User.populate(message, {
      path: 'sender.employee',
      select: 'firstName lastName designation profileImage'
    });

    const io = getIO();
    io.to(`conversation:${id}`).emit('message:update', message);

    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// @desc    Get users for chat directory (RBAC enforced)
// @route   GET /api/chat/users
// @access  Private
export const getChatUsers = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).populate('employeeId');
    const role = currentUser.role;
    
    let query = { isActive: true, _id: { $ne: req.user._id } };

    if (role === 'EMPLOYEE') {
      const deptId = currentUser.employeeId?.departmentId;
      const managerId = currentUser.employeeId?.reportingManagerId;
      const allowedRoles = ['ADMIN', 'HR'];
      const allowedUsersQuery = { $or: [{ role: { $in: allowedRoles } }] };
      const employeeQuery = { $or: [] };
      if (deptId) employeeQuery.$or.push({ departmentId: deptId });
      if (managerId) employeeQuery.$or.push({ _id: managerId });
      if (employeeQuery.$or.length > 0) {
        const Employee = (await import('../models/Employee.js')).default;
        const allowedEmployees = await Employee.find(employeeQuery).select('userId');
        const allowedUserIds = allowedEmployees.map(emp => emp.userId).filter(Boolean);
        allowedUsersQuery.$or.push({ _id: { $in: allowedUserIds } });
      }
      query = { $and: [query, allowedUsersQuery] };
    } else if (role === 'MANAGER') {
      const deptId = currentUser.employeeId?.departmentId;
      const myEmpId = currentUser.employeeId?._id;
      const allowedRoles = ['ADMIN', 'HR', 'MANAGER'];
      const allowedUsersQuery = { $or: [{ role: { $in: allowedRoles } }] };
      const employeeQuery = { $or: [] };
      if (myEmpId) employeeQuery.$or.push({ reportingManagerId: myEmpId });
      if (deptId) employeeQuery.$or.push({ departmentId: deptId });
      if (employeeQuery.$or.length > 0) {
        const Employee = (await import('../models/Employee.js')).default;
        const allowedEmployees = await Employee.find(employeeQuery).select('userId');
        const allowedUserIds = allowedEmployees.map(emp => emp.userId).filter(Boolean);
        allowedUsersQuery.$or.push({ _id: { $in: allowedUserIds } });
      }
      query = { $and: [query, allowedUsersQuery] };
    }

    const users = await User.find(query)
      .select('email role employeeId isActive')
      .populate({
        path: 'employeeId',
        select: 'firstName lastName designation profileImage departmentId reportingManagerId',
      })
      .exec();

    const validUsers = users.filter(u => u.role === 'ADMIN' || u.employeeId);

    res.status(200).json({
      success: true,
      data: validUsers
    });
  } catch (error) {
    next(error);
  }
};
