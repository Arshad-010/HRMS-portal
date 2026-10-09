import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrms';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
async function checkData() {
  await mongoose.connect(MONGO_URI);
  const users = await mongoose.connection.collection('users').find({ role: { $in: ['HR', 'MANAGER'] } }).toArray();
  for (let u of users) {
    if (!u.employeeId) {
      console.log(`User ${u.email} missing employeeId`);
      continue;
    }
    const emp = await mongoose.connection.collection('employees').findOne({ _id: u.employeeId });
    if (!emp) {
      console.log(`User ${u.email} points to missing Employee ${u.employeeId}`);
    } else if (!emp.userId || emp.userId.toString() !== u._id.toString()) {
      console.log(`User ${u.email} points to Employee ${u.employeeId} but Employee points to userId ${emp.userId}`);
    } else {
      console.log(`User ${u.email} bidirectionally linked correctly to Employee ${emp.employeeCode}`);
    }
  }
  process.exit(0);
}
checkData();
