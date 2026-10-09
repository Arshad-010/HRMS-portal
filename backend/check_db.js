import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrms';

async function checkDB() {
  await mongoose.connect(MONGO_URI);
  const users = await mongoose.connection.collection('users').find({}).toArray();
  const employees = await mongoose.connection.collection('employees').find({}).toArray();

  console.log('--- USERS ---');
  users.forEach(u => console.log(`User: ${u.email}, Role: ${u.role}, EmployeeId: ${u.employeeId}, _id: ${u._id}`));

  console.log('\n--- EMPLOYEES ---');
  employees.forEach(e => console.log(`Employee: ${e.firstName} ${e.lastName}, UserID: ${e.userId}, _id: ${e._id}`));

  mongoose.disconnect();
}

checkDB().catch(console.error);
