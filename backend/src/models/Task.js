import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Assigned employee is required'],
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned by user reference is required'],
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        message: '{VALUE} is not a valid task priority',
      },
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'],
        message: '{VALUE} is not a valid task status',
      },
      default: 'TODO',
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: [0, 'Estimated hours cannot be negative'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for computing overdue status dynamically without database staleness
taskSchema.virtual('isOverdue').get(function () {
  if (this.status === 'COMPLETED' || this.status === 'CANCELLED') {
    return false;
  }
  return this.dueDate ? new Date(this.dueDate) < new Date() : false;
});

// Compound indexes for optimal multi-filter performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ department: 1, status: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });
taskSchema.index({ department: 1, dueDate: 1 });

export const Task = mongoose.model('Task', taskSchema);
export default Task;
