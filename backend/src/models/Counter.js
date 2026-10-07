import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 1000,
    },
  },
  {
    versionKey: false,
  }
);

export const Counter = mongoose.model('Counter', counterSchema);

/**
 * Safely generates next atomic sequential employee code starting from EMP-1001
 * Guarantees EMP-1001, EMP-1002, EMP-1003 format under concurrent execution
 */
export const getNextEmployeeCode = async () => {
  // Ensure sequence base starts at 1000 on insert
  await Counter.findByIdAndUpdate(
    'employeeCode',
    { $setOnInsert: { seq: 1000 } },
    { upsert: true }
  );

  const counter = await Counter.findByIdAndUpdate(
    'employeeCode',
    { $inc: { seq: 1 } },
    { new: true }
  );

  return `EMP-${counter.seq}`;
};
