import dotenv from 'dotenv';
dotenv.config();
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

const run = async () => {
  await connectDB();
  const user = await User.findOne({ email: 'admin@example.com' }).select('+password');
  console.log('User found:', !!user);
  if (user) {
    const match = await user.matchPassword('lohith2605');
    console.log('Password match:', match);
  }
  await disconnectDB();
  process.exit(0);
};
run();
