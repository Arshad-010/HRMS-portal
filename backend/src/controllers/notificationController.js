import Notification from '../models/Notification.js';

/**
 * Get current user's notifications with pagination and unread filter
 * @route   GET /api/notifications
 * @access  Private (Current Authenticated User)
 */
export const getNotifications = async (req, res, next) => {
  try {
    const pageNum = parseInt(req.query.page, 10) || 1;
    const limitNum = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    const { isRead, type } = req.query;

    // Strict ownership: user can only see their own notifications
    const query = { recipient: req.user._id };

    if (isRead !== undefined && isRead !== '') {
      query.isRead = isRead === 'true';
    }

    if (type) {
      query.type = type;
    }

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count for badge display
 * @route   GET /api/notifications/unread
 * @access  Private
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private (Owner Only)
 */
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Ownership verification
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this notification',
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read for current user
 * @route   PATCH /api/notifications/read-all
 * @access  Private (Owner Only)
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        updatedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (Owner Only)
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Ownership verification
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this notification',
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};
