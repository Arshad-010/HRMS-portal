import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import { getNextEmployeeCode } from '../models/Counter.js';
import { logger } from '../utils/logger.js';

/**
 * Idempotently seeds initial ADMIN account from environment variables
 * Safe to run multiple times, never duplicates accounts, never logs passwords
 */
export const seedInitialAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not configured; skipping automatic admin bootstrap.');
    return;
  }

  if (adminPassword.length < 8) {
    logger.error('ADMIN_PASSWORD must be at least 8 characters long.');
    return;
  }

  try {
    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail.toLowerCase() }, { role: 'ADMIN' }],
    });

    if (existingAdmin) {
      logger.info(`Admin account verified (${existingAdmin.email}). Ready for authentication.`);
      return;
    }

    // Ensure default Executive Department
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

    // Generate atomic sequential employee code (EMP-1001)
    const employeeCode = await getNextEmployeeCode();

    // Create Admin User
    const adminUser = new User({
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    });

    // Create Linked Employee Record
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

    // Link Employee to User
    adminUser.employeeId = adminEmployee._id;
    await adminUser.save();

    // Assign department head
    executiveDept.managerId = adminEmployee._id;
    await executiveDept.save();

    logger.info(`Admin bootstrap complete: ${adminUser.email} [${adminEmployee.employeeCode}]`);
  } catch (error) {
    logger.error(`Automatic admin seeding encountered error: ${error.message}`);
  }
};
