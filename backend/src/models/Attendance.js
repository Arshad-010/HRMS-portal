import mongoose from 'mongoose';

/**
 * Normalizes a JavaScript Date object to UTC midnight (00:00:00.000Z)
 * Ensures consistent day-level indexing and queries
 */
export const normalizeToMidnightUTC = (inputDate = new Date()) => {
  const d = new Date(inputDate);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      set: normalizeToMidnightUTC,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'WEEKEND', 'HOLIDAY'],
        message: 'Invalid attendance status',
      },
      default: 'PRESENT',
      required: true,
    },
    workHours: {
      type: Number,
      default: 0,
      min: [0, 'Work hours cannot be negative'],
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique attendance record per employee per calendar date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

/**
 * Calculate work hours safely from checkIn and checkOut timestamps
 */
attendanceSchema.methods.calculateWorkHours = function () {
  if (this.checkIn && this.checkOut && this.checkOut > this.checkIn) {
    const diffMs = new Date(this.checkOut) - new Date(this.checkIn);
    const hours = diffMs / (1000 * 60 * 60);
    this.workHours = Number(hours.toFixed(2));

    // Automatically flag half-day if less than standard full workday threshold (e.g. 4.5 hours)
    if (this.workHours > 0 && this.workHours < 4.5 && this.status === 'PRESENT') {
      this.status = 'HALF_DAY';
    }
  } else {
    this.workHours = 0;
  }
  return this.workHours;
};

export const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
