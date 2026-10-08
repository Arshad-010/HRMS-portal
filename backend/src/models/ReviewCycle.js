import mongoose from 'mongoose';

const reviewCycleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Cycle title is required'],
      trim: true,
    },
    cycleType: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'ANNUAL'],
      default: 'QUARTERLY',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'IN_REVIEW', 'COMPLETED'],
      default: 'ACTIVE',
    },
    scorecardTemplate: [
      {
        criterion: { type: String, required: true },
        weight: { type: Number, required: true, min: 0, max: 100 },
        isSystemCalculated: { type: Boolean, default: false },
        metricType: {
          type: String,
          enum: ['NONE', 'ATTENDANCE_PCT', 'TASK_COMPLETION_PCT'],
          default: 'NONE',
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

reviewCycleSchema.index({ status: 1 });
reviewCycleSchema.index({ startDate: -1 });

export const ReviewCycle = mongoose.model('ReviewCycle', reviewCycleSchema);
export default ReviewCycle;
