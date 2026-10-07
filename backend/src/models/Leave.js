import mongoose from 'mongoose';

/**
 * Normalizes any Date or Date string to UTC Midnight
 */
export const normalizeToMidnightUTC = (d) => {
  const date = new Date(d);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

/**
 * Calculates inclusive calendar days between two dates
 */
export const calculateLeaveDays = (startDate, endDate) => {
  const start = normalizeToMidnightUTC(startDate);
  const end = normalizeToMidnightUTC(endDate);
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return 0;
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    leaveType: {
      type: String,
      enum: {
        values: ['CASUAL', 'SICK', 'EARNED', 'UNPAID', 'OTHER'],
        message: '{VALUE} is not a valid leave type',
      },
      required: [true, 'Leave type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      set: normalizeToMidnightUTC,
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      set: normalizeToMidnightUTC,
      index: true,
    },
    numberOfDays: {
      type: Number,
      required: [true, 'Number of days is required'],
      min: [0.5, 'Number of days must be at least 0.5'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
        message: '{VALUE} is not a valid leave status',
      },
      default: 'PENDING',
      index: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    reviewerComment: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Reviewer comment cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high performance querying
leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ employee: 1, startDate: 1, endDate: 1 });

const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;
