import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getIO } from '../socket.js';
import { notifyChatMessage } from '../services/notificationService.js';

// @desc    Get current user's authorized conversations with unread counts
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
  try {
    // Strictly find conversations where current authenticated user is a participant
    const filter = { participants: req.user._id };
    if (req.query.type && ['DIRECT', 'GROUP'].includes(req.query.type.toUpperCase())) {
      filter.type = req.query.type.toUpperCase();
    }

    const conversations = await Conversation.find(filter)
      .populate('participants', 'email role employeeId')
      .populate('creator', 'email role employeeId')
      .populate('admins', 'email role employeeId')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'email role employeeId' },
      })
      .sort('-lastMessageAt')
      .lean();

    // Populate employee details for participants, sender, creator, and admins
    await User.populate(conversations, {
      path: 'participants.employeeId',
      select: 'firstName lastName designation profileImage employeeCode departmentId',
    });
    await User.populate(conversations, {
      path: 'creator.employeeId',
      select: 'firstName lastName designation profileImage',
    });
    await User.populate(conversations, {
      path: 'admins.employeeId',
      select: 'firstName lastName designation profileImage',
    });
    await User.populate(conversations, {
      path: 'lastMessage.sender.employeeId',
      select: 'firstName lastName designation profileImage',
    });

    // Compute unread message counts for current user in each conversation
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id },
        });

        const participants = (conv.participants || []).map((p) => ({
          ...p,
          employee: p.employeeId || p.employee,
        }));

        const creator = conv.creator
          ? {
              ...conv.creator,
              employee: conv.creator.employeeId || conv.creator.employee,
            }
          : null;

        const admins = (conv.admins || []).map((a) => ({
          ...a,
          employee: a.employeeId || a.employee,
        }));

        const lastMessage = conv.lastMessage
          ? {
              ...conv.lastMessage,
              sender: conv.lastMessage.sender
                ? {
                    ...conv.lastMessage.sender,
                    employee: conv.lastMessage.sender.employeeId || conv.lastMessage.sender.employee,
                  }
                : conv.lastMessage.sender,
            }
          : null;

        return {
          ...conv,
          participants,
          creator,
          admins,
          lastMessage,
          unreadCount,
        };
      })
    );

    res.json({
      success: true,
      data: enrichedConversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or get direct conversation with an eligible employee
// @route   POST /api/chat/conversations
// @access  Private
export const createOrGetDirectConversation = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Recipient User ID is required' });
    }

    if (userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create a direct conversation with yourself' });
    }

    // Verify recipient user exists and is active
    const recipientUser = await User.findById(userId);
    if (!recipientUser || !recipientUser.isActive) {
      return res.status(404).json({ success: false, message: 'Recipient user not found or inactive' });
    }

    // Check if direct conversation already exists between the two users
    let conversation = await Conversation.findOne({
      type: 'DIRECT',
      participants: { $all: [req.user._id, userId], $size: 2 },
    })
      .populate('participants', 'email role employeeId')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'email role employeeId' },
      });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
        type: 'DIRECT',
      });
      conversation = await conversation.populate('participants', 'email role employeeId');

      // Notify the recipient in real time via their private room
      try {
        const io = getIO();
        io.to(userId.toString()).emit('conversation:new', conversation);
      } catch (_) {}
    }

    await User.populate(conversation, {
      path: 'participants.employeeId',
      select: 'firstName lastName designation profileImage employeeCode departmentId',
    });

    const convObj = conversation.toObject ? conversation.toObject() : conversation;
    convObj.participants = (convObj.participants || []).map((p) => ({
      ...p,
      employee: p.employeeId || p.employee,
    }));

    res.status(200).json({
      success: true,
      data: convObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation with pagination
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const conversationId = req.params.id;

    // Security: Verify that the requesting user is a participant of this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this conversation' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const before = req.query.before;
    const page = parseInt(req.query.page, 10) || 1;

    const query = { conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const skip = before ? 0 : (page - 1) * limit;

    const [totalMessages, messages] = await Promise.all([
      Message.countDocuments({ conversationId }),
      Message.find(query)
        .populate('sender', 'email role employeeId')
        .populate('taskId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    await User.populate(messages, {
      path: 'sender.employeeId',
      select: 'firstName lastName designation profileImage',
    });

    // Format sender object with employee profile and reverse to chronological order
    const formattedMessages = messages
      .map((m) => ({
        ...m,
        sender: m.sender
          ? {
              ...m.sender,
              employee: m.sender.employeeId || m.sender.employee,
            }
          : m.sender,
      }))
      .reverse();

    res.json({
      success: true,
      data: formattedMessages,
      pagination: {
        total: totalMessages,
        count: formattedMessages.length,
        hasMore: totalMessages > skip + formattedMessages.length,
        page,
        limit,
      },
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
    const { text, type, taskId, meetingDetails } = req.body;

    // Security: Verify conversation membership
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Not authorized to post in this conversation' });
    }

    // Validate payload
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const cleanText = text.trim();
    if (cleanText.length > 5000) {
      return res.status(400).json({ success: false, message: 'Message text exceeds 5000 characters limit' });
    }

    // Role-based restrictions for task/meeting attachments
    if ((type === 'TASK' || type === 'MEETING') && req.user.role === 'EMPLOYEE') {
      return res.status(403).json({ success: false, message: 'Employees are not authorized to create Task or Meeting events in chat' });
    }

    // Persist message before broadcasting (Requirement: Persist messages before broadcasting)
    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      text: cleanText,
      type: type || 'TEXT',
      taskId,
      meetingDetails,
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    // Update conversation last message and timestamp
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    await message.populate('sender', 'email role employeeId');
    await message.populate('taskId');
    await User.populate(message, {
      path: 'sender.employeeId',
      select: 'firstName lastName designation profileImage',
    });

    const formattedMessage = {
      ...message.toObject(),
      sender: {
        ...message.sender.toObject(),
        employee: message.sender.employeeId,
      },
    };

    // Broadcast message via Socket.IO to the verified conversation room
    try {
      const io = getIO();
      io.to(`conversation:${conversationId}`).emit('message:new', formattedMessage);

      // Emit unread update to other participants in their private rooms
      const otherParticipants = conversation.participants.filter(
        (p) => p.toString() !== req.user._id.toString()
      );

      otherParticipants.forEach((pId) => {
        io.to(pId.toString()).emit('chat:unread_update', { conversationId });
      });
    } catch (_) {}

    // Asynchronously create and emit notification to other participants
    notifyChatMessage({
      message: formattedMessage,
      conversation,
      senderUser: req.user,
    }).catch((err) => console.error('Failed to dispatch chat notifications:', err.message));

    res.status(201).json({
      success: true,
      data: formattedMessage,
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

    // Verify membership
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Find messages in this conversation not sent by current user and not read by current user
    const messagesToUpdate = await Message.find({
      conversationId,
      sender: { $ne: req.user._id },
      'readBy.user': { $ne: req.user._id },
    });

    if (messagesToUpdate.length > 0) {
      const messageIds = messagesToUpdate.map((m) => m._id);

      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
      );

      try {
        const io = getIO();
        io.to(`conversation:${conversationId}`).emit('message:read', {
          conversationId,
          userId: req.user._id,
          messageIds,
          readAt: new Date(),
        });
      } catch (_) {}
    }

    res.json({
      success: true,
      message: 'Conversation marked as read',
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

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
    }

    const message = await Message.findOne({ _id: msgId, conversationId: id });
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this message' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ success: false, message: 'Cannot edit a deleted message' });
    }

    message.text = text.trim();
    message.isEdited = true;
    await message.save();

    await message.populate('sender', 'email role employeeId');
    await message.populate('taskId');
    await User.populate(message, {
      path: 'sender.employeeId',
      select: 'firstName lastName designation profileImage',
    });

    const formattedMessage = {
      ...message.toObject(),
      sender: {
        ...message.sender.toObject(),
        employee: message.sender.employeeId,
      },
    };

    try {
      const io = getIO();
      io.to(`conversation:${id}`).emit('message:update', formattedMessage);
    } catch (_) {}

    res.json({ success: true, data: formattedMessage });
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
    await message.save();

    try {
      const io = getIO();
      io.to(`conversation:${id}`).emit('message:delete', { messageId: msgId, conversationId: id });
    } catch (_) {}

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
      (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReactionIndex !== -1) {
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }
    await message.save();

    await message.populate('sender', 'email role employeeId');
    await message.populate('taskId');
    await User.populate(message, {
      path: 'sender.employeeId',
      select: 'firstName lastName designation profileImage',
    });

    const formattedMessage = {
      ...message.toObject(),
      sender: {
        ...message.sender.toObject(),
        employee: message.sender.employeeId,
      },
    };

    try {
      const io = getIO();
      io.to(`conversation:${id}`).emit('message:update', formattedMessage);
    } catch (_) {}

    res.json({ success: true, data: formattedMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Get eligible employees for chat directory
// @route   GET /api/chat/users
// @access  Private
export const getChatUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      isActive: true,
      _id: { $ne: req.user._id },
    })
      .select('email role employeeId isActive createdAt')
      .populate({
        path: 'employeeId',
        select: 'firstName lastName designation profileImage employeeCode departmentId',
      })
      .lean();

    const formattedUsers = users.map((u) => ({
      ...u,
      employee: u.employeeId,
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new group conversation
// @route   POST /api/chat/groups
// @access  Private (Admin, HR, Manager)
export const createGroupConversation = async (req, res, next) => {
  try {
    const { name, description, avatar, groupType, memberIds } = req.body;

    // RBAC: Employees are prohibited from creating groups
    if (req.user.role === 'EMPLOYEE') {
      return res.status(403).json({
        success: false,
        message: 'Employees are not authorized to create groups',
      });
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required and must be between 2 and 100 characters',
      });
    }

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one member for the group',
      });
    }

    // Role check for MANAGER: can only invite direct reports or department members
    if (req.user.role === 'MANAGER') {
      const Employee = (await import('../models/Employee.js')).default;
      const managerEmp = req.user.employeeId ? await Employee.findById(req.user.employeeId) : null;

      const authorizedEmployees = await Employee.find({
        $or: [
          ...(req.user.employeeId ? [{ reportingManagerId: req.user.employeeId }] : []),
          ...(managerEmp?.departmentId ? [{ departmentId: managerEmp.departmentId }] : []),
          ...(req.user.employeeId ? [{ _id: req.user.employeeId }] : []),
        ],
      }).select('userId');

      const authorizedUserIds = new Set(
        authorizedEmployees.map((e) => e.userId?.toString()).filter(Boolean)
      );

      const invalidMembers = memberIds.filter(
        (id) => !authorizedUserIds.has(id.toString()) && id.toString() !== req.user._id.toString()
      );

      if (invalidMembers.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Managers can only create groups for their authorized team or department',
        });
      }
    }

    // Verify all specified members exist and are active
    const activeUsers = await User.find({
      _id: { $in: memberIds },
      isActive: true,
    }).select('_id');

    if (activeUsers.length !== memberIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected members are invalid or inactive',
      });
    }

    // Build deduplicated participant array with creator included
    const participantSet = new Set([
      req.user._id.toString(),
      ...memberIds.map((id) => id.toString()),
    ]);
    const participants = Array.from(participantSet);

    let conversation = await Conversation.create({
      type: 'GROUP',
      name: name.trim(),
      description: (description || '').trim(),
      avatar: avatar || '',
      groupType: groupType || 'GENERAL',
      creator: req.user._id,
      admins: [req.user._id],
      participants,
      lastMessageAt: new Date(),
    });

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'email role employeeId')
      .populate('creator', 'email role employeeId')
      .populate('admins', 'email role employeeId');

    await User.populate(conversation, {
      path: 'participants.employeeId',
      select: 'firstName lastName designation profileImage employeeCode departmentId',
    });
    await User.populate(conversation, {
      path: 'creator.employeeId',
      select: 'firstName lastName designation profileImage',
    });
    await User.populate(conversation, {
      path: 'admins.employeeId',
      select: 'firstName lastName designation profileImage',
    });

    const convObj = conversation.toObject ? conversation.toObject() : conversation;
    convObj.participants = (convObj.participants || []).map((p) => ({
      ...p,
      employee: p.employeeId || p.employee,
    }));
    if (convObj.creator) {
      convObj.creator.employee = convObj.creator.employeeId || convObj.creator.employee;
    }
    convObj.admins = (convObj.admins || []).map((a) => ({
      ...a,
      employee: a.employeeId || a.employee,
    }));
    convObj.unreadCount = 0;

    // Real-time broadcast to all group members' private socket rooms
    try {
      const io = getIO();
      participants.forEach((pId) => {
        io.to(pId.toString()).emit('conversation:new', convObj);
      });
    } catch (_) {}

    res.status(201).json({
      success: true,
      data: convObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single group details
// @route   GET /api/chat/groups/:id
// @access  Private (Group member)
export const getGroupDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      _id: id,
      type: 'GROUP',
      participants: req.user._id,
    })
      .populate('participants', 'email role employeeId')
      .populate('creator', 'email role employeeId')
      .populate('admins', 'email role employeeId')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'email role employeeId' },
      });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this group or group not found',
      });
    }

    await User.populate(conversation, {
      path: 'participants.employeeId',
      select: 'firstName lastName designation profileImage employeeCode departmentId',
    });
    await User.populate(conversation, {
      path: 'creator.employeeId',
      select: 'firstName lastName designation profileImage',
    });
    await User.populate(conversation, {
      path: 'admins.employeeId',
      select: 'firstName lastName designation profileImage',
    });

    const convObj = conversation.toObject ? conversation.toObject() : conversation;
    convObj.participants = (convObj.participants || []).map((p) => ({
      ...p,
      employee: p.employeeId || p.employee,
    }));
    if (convObj.creator) {
      convObj.creator.employee = convObj.creator.employeeId || convObj.creator.employee;
    }
    convObj.admins = (convObj.admins || []).map((a) => ({
      ...a,
      employee: a.employeeId || a.employee,
    }));

    res.status(200).json({
      success: true,
      data: convObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update group details (name, description, avatar)
// @route   PUT /api/chat/groups/:id
// @access  Private (Group Admin, Admin, HR)
export const updateGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, avatar, groupType } = req.body;

    const conversation = await Conversation.findOne({ _id: id, type: 'GROUP' });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Group conversation not found' });
    }

    // Verify authorization
    const isOrgAdmin = req.user.role === 'ADMIN' || req.user.role === 'HR';
    const isMember = conversation.participants.some((p) => p.toString() === req.user._id.toString());
    if (!isOrgAdmin && !isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this group' });
    }

    // Permissions check
    const isGroupAdmin = conversation.admins.some((a) => a.toString() === req.user._id.toString()) ||
      (conversation.creator && conversation.creator.toString() === req.user._id.toString());

    if (!isOrgAdmin && !isGroupAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group administrators can modify group settings',
      });
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Group name must be between 2 and 100 characters',
        });
      }
      conversation.name = name.trim();
    }

    if (description !== undefined) {
      conversation.description = (description || '').trim();
    }

    if (avatar !== undefined) {
      conversation.avatar = avatar || '';
    }

    if (groupType && ['GENERAL', 'DEPARTMENT', 'PROJECT'].includes(groupType)) {
      conversation.groupType = groupType;
    }

    await conversation.save();

    await conversation.populate('participants', 'email role employeeId');
    await conversation.populate('creator', 'email role employeeId');
    await conversation.populate('admins', 'email role employeeId');

    await User.populate(conversation, {
      path: 'participants.employeeId',
      select: 'firstName lastName designation profileImage employeeCode departmentId',
    });
    await User.populate(conversation, {
      path: 'creator.employeeId',
      select: 'firstName lastName designation profileImage',
    });
    await User.populate(conversation, {
      path: 'admins.employeeId',
      select: 'firstName lastName designation profileImage',
    });

    const convObj = conversation.toObject ? conversation.toObject() : conversation;
    convObj.participants = (convObj.participants || []).map((p) => ({
      ...p,
      employee: p.employeeId || p.employee,
    }));
    if (convObj.creator) {
      convObj.creator.employee = convObj.creator.employeeId || convObj.creator.employee;
    }
    convObj.admins = (convObj.admins || []).map((a) => ({
      ...a,
      employee: a.employeeId || a.employee,
    }));

    try {
      const io = getIO();
      io.to(`conversation:${id}`).emit('group:updated', convObj);
    } catch (_) {}

    res.status(200).json({
      success: true,
      data: convObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add members to a group
// @route   POST /api/chat/groups/:id/members
// @access  Private (Group Admin, Admin, HR, Manager)
export const addGroupMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please specify members to add' });
    }

    const conversation = await Conversation.findOne({ _id: id, type: 'GROUP' });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isOrgAdmin = req.user.role === 'ADMIN' || req.user.role === 'HR';
    const isMember = conversation.participants.some((p) => p.toString() === req.user._id.toString());
    if (!isOrgAdmin && !isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this group' });
    }

    const isGroupAdmin = conversation.admins.some((a) => a.toString() === req.user._id.toString()) ||
      (conversation.creator && conversation.creator.toString() === req.user._id.toString());

    if (!isOrgAdmin && !isGroupAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group administrators can add members',
      });
    }

    // Role check for MANAGER: can only add eligible members
    if (req.user.role === 'MANAGER' && !isOrgAdmin) {
      const Employee = (await import('../models/Employee.js')).default;
      const managerEmp = req.user.employeeId ? await Employee.findById(req.user.employeeId) : null;

      const authorizedEmployees = await Employee.find({
        $or: [
          ...(req.user.employeeId ? [{ reportingManagerId: req.user.employeeId }] : []),
          ...(managerEmp?.departmentId ? [{ departmentId: managerEmp.departmentId }] : []),
          ...(req.user.employeeId ? [{ _id: req.user.employeeId }] : []),
        ],
      }).select('userId');

      const authorizedUserIds = new Set(
        authorizedEmployees.map((e) => e.userId?.toString()).filter(Boolean)
      );

      const invalidMembers = memberIds.filter((mId) => !authorizedUserIds.has(mId.toString()));
      if (invalidMembers.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Managers can only add members from their authorized team or department',
        });
      }
    }

    // Verify all specified members exist and are active
    const activeUsers = await User.find({
      _id: { $in: memberIds },
      isActive: true,
    }).select('_id');

    if (activeUsers.length !== memberIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more users to add are invalid or inactive',
      });
    }

    const existingSet = new Set(conversation.participants.map((p) => p.toString()));
    const newMembers = memberIds.filter((mId) => !existingSet.has(mId.toString()));

    if (newMembers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All specified users are already members of this group',
      });
    }

    conversation.participants.push(...newMembers);
    await conversation.save();

    await conversation.populate('participants', 'email role employeeId');
    await conversation.populate('creator', 'email role employeeId');
    await conversation.populate('admins', 'email role employeeId');

    await User.populate(conversation, {
      path: 'participants.employeeId',
      select: 'firstName lastName designation profileImage employeeCode departmentId',
    });
    await User.populate(conversation, {
      path: 'creator.employeeId',
      select: 'firstName lastName designation profileImage',
    });
    await User.populate(conversation, {
      path: 'admins.employeeId',
      select: 'firstName lastName designation profileImage',
    });

    const convObj = conversation.toObject ? conversation.toObject() : conversation;
    convObj.participants = (convObj.participants || []).map((p) => ({
      ...p,
      employee: p.employeeId || p.employee,
    }));
    if (convObj.creator) {
      convObj.creator.employee = convObj.creator.employeeId || convObj.creator.employee;
    }
    convObj.admins = (convObj.admins || []).map((a) => ({
      ...a,
      employee: a.employeeId || a.employee,
    }));

    try {
      const io = getIO();
      // Notify current room
      io.to(`conversation:${id}`).emit('group:members_added', {
        conversationId: id,
        newMemberIds: newMembers,
        conversation: convObj,
      });

      // Notify newly added members so the group appears on their sidebar
      newMembers.forEach((mId) => {
        io.to(mId.toString()).emit('conversation:new', convObj);
      });
    } catch (_) {}

    res.status(200).json({
      success: true,
      data: convObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a member from a group
// @route   DELETE /api/chat/groups/:id/members/:userId
// @access  Private (Group Admin, Admin, HR)
export const removeGroupMember = async (req, res, next) => {
  try {
    const { id, userId: targetUserId } = req.params;

    const conversation = await Conversation.findOne({ _id: id, type: 'GROUP' });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isOrgAdmin = req.user.role === 'ADMIN' || req.user.role === 'HR';
    const isCallerMember = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isOrgAdmin && !isCallerMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this group' });
    }

    const isGroupAdmin = conversation.admins.some((a) => a.toString() === req.user._id.toString()) ||
      (conversation.creator && conversation.creator.toString() === req.user._id.toString());

    if (!isOrgAdmin && !isGroupAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group administrators can remove members',
      });
    }

    const isTargetInGroup = conversation.participants.some(
      (p) => p.toString() === targetUserId.toString()
    );
    if (!isTargetInGroup) {
      return res.status(404).json({ success: false, message: 'User is not a member of this group' });
    }

    // Protection: Creator cannot be removed unless by an ADMIN or self
    if (
      conversation.creator &&
      conversation.creator.toString() === targetUserId.toString() &&
      req.user.role !== 'ADMIN' &&
      req.user._id.toString() !== targetUserId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'The group creator cannot be removed from the group',
      });
    }

    // Remove target user from participants and admins
    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== targetUserId.toString()
    );
    conversation.admins = conversation.admins.filter(
      (a) => a.toString() !== targetUserId.toString()
    );
    await conversation.save();

    await conversation.populate('participants', 'email role employeeId');
    await conversation.populate('creator', 'email role employeeId');
    await conversation.populate('admins', 'email role employeeId');

    await User.populate(conversation, {
      path: 'participants.employeeId',
      select: 'firstName lastName designation profileImage employeeCode departmentId',
    });
    await User.populate(conversation, {
      path: 'creator.employeeId',
      select: 'firstName lastName designation profileImage',
    });
    await User.populate(conversation, {
      path: 'admins.employeeId',
      select: 'firstName lastName designation profileImage',
    });

    const convObj = conversation.toObject ? conversation.toObject() : conversation;
    convObj.participants = (convObj.participants || []).map((p) => ({
      ...p,
      employee: p.employeeId || p.employee,
    }));
    if (convObj.creator) {
      convObj.creator.employee = convObj.creator.employeeId || convObj.creator.employee;
    }
    convObj.admins = (convObj.admins || []).map((a) => ({
      ...a,
      employee: a.employeeId || a.employee,
    }));

    // Real-Time Security: Immediately revoke room access and notify sockets
    try {
      const io = getIO();
      // Force all sockets of the removed user to leave the conversation room
      const targetSockets = await io.in(targetUserId.toString()).fetchSockets();
      for (const s of targetSockets) {
        s.leave(`conversation:${id}`);
      }

      // Notify the removed user's client to clear active chat
      io.to(targetUserId.toString()).emit('group:removed_you', { conversationId: id });

      // Notify remaining group members
      io.to(`conversation:${id}`).emit('group:member_removed', {
        conversationId: id,
        userId: targetUserId,
        conversation: convObj,
      });
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: convObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Voluntarily leave a group conversation
// @route   POST /api/chat/groups/:id/leave
// @access  Private (Group member)
export const leaveGroup = async (req, res, next) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      _id: id,
      type: 'GROUP',
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
      });
    }

    // Remove user from participants and admins
    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== req.user._id.toString()
    );
    conversation.admins = conversation.admins.filter(
      (a) => a.toString() !== req.user._id.toString()
    );

    // If leaving user was the only admin and members remain, promote the first member
    if (conversation.admins.length === 0 && conversation.participants.length > 0) {
      conversation.admins.push(conversation.participants[0]);
    }

    await conversation.save();

    // Revoke caller's sockets from conversation room
    try {
      const io = getIO();
      const callerSockets = await io.in(req.user._id.toString()).fetchSockets();
      for (const s of callerSockets) {
        s.leave(`conversation:${id}`);
      }

      io.to(`conversation:${id}`).emit('group:member_left', {
        conversationId: id,
        userId: req.user._id,
      });
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: 'You have left the group successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getConversations,
  createOrGetDirectConversation,
  getMessages,
  sendMessage,
  markAsRead,
  editMessage,
  deleteMessage,
  reactToMessage,
  getChatUsers,
  createGroupConversation,
  getGroupDetails,
  updateGroup,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
};
