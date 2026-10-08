import mongoose from 'mongoose';

const performanceReviewSchema = new mongoose.Schema(
  {
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReviewCycle',
      required: [true, 'Cycle reference is required'],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SELF_REVIEW', 'MANAGER_REVIEW', 'HR_REVIEW', 'COMPLETED'],
      default: 'PENDING',
    },
    scores: [
      {
        criterion: { type: String, required: true },
        weight: { type: Number, required: true, default: 20 },
        isSystemCalculated: { type: Boolean, default: false },
        systemValue: { type: Number, default: 0 }, // e.g. 95% attendance
        rating: { type: Number, min: 1, max: 5, default: 4 }, // 1-5 stars
        weightedScore: { type: Number, default: 0 },
        comments: { type: String, default: '' },
      },
    ],
    finalScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
    },
    ratingBand: {
      type: String,
      enum: ['OUTSTANDING', 'EXCEEDS', 'MEETS', 'NEEDS_IMPROVEMENT'],
      default: 'MEETS',
    },
    potentialRating: {
      type: Number,
      min: 1,
      max: 3, // Low (1), Medium (2), High (3) for 9-box grid
      default: 2,
    },
    performanceRatingLevel: {
      type: Number,
      min: 1,
      max: 3, // Low (1), Medium (2), High (3)
      default: 2,
    },
    nineBoxCategory: {
      type: String,
      default: 'Core Player', // e.g. Star, High Potential, Core Player, Solid Performer, At Risk
    },
    goals: [
      {
        title: { type: String, required: true },
        metric: { type: String, default: '' },
        progress: { type: Number, min: 0, max: 100, default: 0 },
      },
    ],
    selfComments: { type: String, default: '' },
    managerComments: { type: String, default: '' },
    hrComments: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

performanceReviewSchema.index({ cycleId: 1, employeeId: 1 }, { unique: true });
performanceReviewSchema.index({ employeeId: 1 });
performanceReviewSchema.index({ reviewerId: 1 });
performanceReviewSchema.index({ finalScore: -1 });
performanceReviewSchema.index({ status: 1 });

export const PerformanceReview = mongoose.model('PerformanceReview', performanceReviewSchema);
export default PerformanceReview;
