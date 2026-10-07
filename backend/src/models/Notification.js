import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient (User) is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: [
          'LEAVE_APPLIED',
          'LEAVE_APPROVED',
          'LEAVE_REJECTED',
          'LEAVE_CANCELLED',
          'TASK_ASSIGNED',
          'TASK_STATUS_CHANGED',
          'TASK_COMPLETED',
          'ATTENDANCE_REMINDER',
          'SYSTEM',
        ],
        message: '{VALUE} is not a recognized notification type',
      },
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    relatedEntityType: {
      type: String,
      enum: ['LEAVE', 'TASK', 'ATTENDANCE', 'EMPLOYEE', 'DEPARTMENT', 'SYSTEM', null],
      default: null,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal performance in user notifications inbox & unread badge count
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
