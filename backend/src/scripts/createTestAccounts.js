import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const createTestAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected.');

    const hrEmail = 'hr.dashboard.test@example.com';
    const managerEmail = 'manager.dashboard.test@example.com';

    // Find any department
    const department = await Department.findOne({ status: 'ACTIVE' });
    if (!department) {
      console.log('No active department found. Please seed departments first.');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('Test@1234', salt); // We manually hash here because pre-save hook might be bypassed by create or we just let pre-save hook do it.
    // Actually, User.create triggers pre-save hook. So we should NOT hash it beforehand.

    // Check HR Account
    let hrUser = await User.findOne({ email: hrEmail });
    if (hrUser) {
      console.log(`HR Account ${hrEmail} already exists.`);
    } else {
      console.log('Creating HR Account...');
      hrUser = await User.create({
        email: hrEmail,
        password: 'Password@123',
        role: 'HR',
        isActive: true,
      });

      const hrEmployee = await Employee.create({
        userId: hrUser._id,
        employeeCode: 'HR-TEST-001',
        firstName: 'HR',
        lastName: 'Dashboard Test',
        departmentId: department._id,
        designation: 'HR Executive',
      });

      hrUser.employeeId = hrEmployee._id;
      await hrUser.save();
      console.log('HR Account created successfully.');
    }

    // Check Manager Account
    let managerUser = await User.findOne({ email: managerEmail });
    if (managerUser) {
      console.log(`Manager Account ${managerEmail} already exists.`);
    } else {
      console.log('Creating Manager Account...');
      managerUser = await User.create({
        email: managerEmail,
        password: 'Password@123',
        role: 'MANAGER',
        isActive: true,
      });

      const managerEmployee = await Employee.create({
        userId: managerUser._id,
        employeeCode: 'MGR-TEST-001',
        firstName: 'Manager',
        lastName: 'Dashboard Test',
        departmentId: department._id,
        designation: 'Engineering Manager',
      });

      managerUser.employeeId = managerEmployee._id;
      await managerUser.save();
      
      // Assign some employees to this manager to test team views
      const employees = await Employee.find({ reportingManagerId: null, _id: { $ne: managerEmployee._id } }).limit(3);
      for (let emp of employees) {
        emp.reportingManagerId = managerEmployee._id;
        await emp.save();
      }

      console.log(`Manager Account created successfully and assigned ${employees.length} direct reports.`);
    }

    console.log('Test Accounts:');
    console.log('HR Login:', hrEmail, '/ Password@123');
    console.log('Manager Login:', managerEmail, '/ Password@123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test accounts:', error);
    process.exit(1);
  }
};

createTestAccounts();
