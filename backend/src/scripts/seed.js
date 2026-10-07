import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import { getNextEmployeeCode } from '../models/Counter.js';
import { logger } from '../utils/logger.js';

dotenv.config();

/**
 * Seed script to bootstrap initial administrator account
 * Reads credentials from environment variables (ADMIN_EMAIL, ADMIN_PASSWORD)
 * Idempotent: checks for existing admin before creation
 */
const seedAdmin = async () => {
  logger.info('Starting HRMS Portal database seed...');

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    logger.error('Missing required environment variables: ADMIN_EMAIL and ADMIN_PASSWORD must be defined.');
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    logger.error('ADMIN_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    await connectDB();

    // Check if an ADMIN user already exists
    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail.toLowerCase() }, { role: 'ADMIN' }],
    });

    if (existingAdmin) {
      logger.info(`Admin account already exists (${existingAdmin.email}). No duplicate created.`);
      await disconnectDB();
      process.exit(0);
    }

    // 1. Ensure root Executive Department exists
    let executiveDept = await Department.findOne({ code: 'EXC' });
    if (!executiveDept) {
      executiveDept = await Department.create({
        name: 'Executive Management',
        code: 'EXC',
        description: 'Executive leadership and company administration',
        isActive: true,
      });
      logger.info(`Created default department: ${executiveDept.name} (${executiveDept.code})`);
    }

    // 2. Generate sequential employee code safely
    const employeeCode = await getNextEmployeeCode();

    // 3. Create dummy user placeholder to satisfy required User link or create user first
    const adminUser = new User({
      email: adminEmail.toLowerCase(),
      password: adminPassword, // Will be hashed by User pre-save hook
      role: 'ADMIN',
      isActive: true,
    });

    // 4. Create Employee record referencing User ID
    const adminEmployee = await Employee.create({
      userId: adminUser._id,
      employeeCode,
      firstName: 'System',
      lastName: 'Administrator',
      departmentId: executiveDept._id,
      designation: 'Chief Administrator',
      joiningDate: new Date(),
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      salary: 0,
      leaveBalances: {
        casual: 12,
        sick: 10,
        paid: 12,
        unpaid: 0,
      },
    });

    // 5. Link employee record back to User and save
    adminUser.employeeId = adminEmployee._id;
    await adminUser.save();

    // 6. Set executive department head to admin employee
    executiveDept.managerId = adminEmployee._id;
    await executiveDept.save();

    logger.info(`Bootstrap completed successfully!`);
    logger.info(`Created ADMIN User: ${adminUser.email} (Role: ${adminUser.role})`);
    logger.info(`Created Linked Employee: ${adminEmployee.firstName} ${adminEmployee.lastName} (${adminEmployee.employeeCode})`);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed with error: ${error.message}`);
    await disconnectDB();
    process.exit(1);
  }
};

seedAdmin();
