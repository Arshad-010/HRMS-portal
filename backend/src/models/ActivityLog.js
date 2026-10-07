import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Activity actor reference is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Activity action is required'],
      trim: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: {
        values: ['EMPLOYEE', 'DEPARTMENT', 'LEAVE', 'TASK', 'ATTENDANCE', 'USER', 'SYSTEM'],
        message: '{VALUE} is not a valid entity type',
      },
      required: [true, 'Entity type is required'],
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Activity description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high performance audit queries & filtering
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
