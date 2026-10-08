import dotenv from 'dotenv';
dotenv.config();
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

const run = async () => {
  await connectDB();
  
  const admin = await User.findOne({ email: 'admin@example.com' });
  if (admin) {
    admin.password = 'lohith2605';
    await admin.save();
    console.log('Password forcefully reset to lohith2605');
  } else {
    console.log('Admin not found');
  }
  
  await disconnectDB();
  process.exit(0);
};
run();
