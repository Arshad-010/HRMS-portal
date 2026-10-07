import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      unique: true,
    },
    employeeCode: {
      type: String,
      required: [true, 'Employee code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    profilePicture: {
      type: String, // Will store base64 data URI
      default: null,
    },
    gender: {
      type: String,
      enum: {
        values: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
        message: 'Invalid gender value',
      },
      default: 'PREFER_NOT_TO_SAY',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
      default: Date.now,
    },
    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'],
      default: 'FULL_TIME',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ON_LEAVE', 'PROBATION', 'TERMINATED', 'RESIGNED'],
      default: 'ACTIVE',
    },
    reportingManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    salary: {
      type: Number,
      default: 0,
    },
    // Annual leave quotas (configurable per employee / policy)
    leaveBalances: {
      casual: { type: Number, default: 12, min: 0 },
      sick: { type: Number, default: 10, min: 0 },
      earned: { type: Number, default: 12, min: 0 },
      paid: { type: Number, default: 12, min: 0 },
      unpaid: { type: Number, default: 0 },
      other: { type: Number, default: 5, min: 0 },
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.index({ departmentId: 1 });
employeeSchema.index({ reportingManagerId: 1 });
employeeSchema.index({ status: 1 });

/**
 * Filters sensitive fields (like salary) based on requesting user role
 * Salary is exclusively visible to ADMIN and HR
 */
employeeSchema.methods.filterForRole = function (viewerRole) {
  const obj = this.toObject();

  if (viewerRole !== 'ADMIN' && viewerRole !== 'HR') {
    delete obj.salary;
  }

  return obj;
};

export const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
