import dotenv from 'dotenv';
dotenv.config();
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

const run = async () => {
  await connectDB();
  const admins = await User.find({ role: 'ADMIN' }).select('email');
  console.log('Admins found:', admins);
  await disconnectDB();
  process.exit(0);
};
run();
