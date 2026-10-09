import fs from 'fs';
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
    } else {
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
        leaveBalances: { casual: 12, sick: 10, paid: 12, unpaid: 0 },
      });

      // Link Employee to User
      adminUser.employeeId = adminEmployee._id;
      await adminUser.save();

      // Assign department head
      executiveDept.managerId = adminEmployee._id;
      await executiveDept.save();

      logger.info(`Admin bootstrap complete: ${adminUser.email} [${adminEmployee.employeeCode}]`);
    }
  } catch (error) {
    logger.error(`Automatic admin seeding encountered error: ${error.message}`);
  }

  // --- Seed Test Accounts ---
  try {
    const hrEmail = 'hr.dashboard.test@example.com';
    const managerEmail = 'manager.dashboard.test@example.com';
    const oldHrUser = await User.findOne({ email: hrEmail });
    if (oldHrUser) await Employee.deleteOne({ userId: oldHrUser._id });
    
    const oldManagerUser = await User.findOne({ email: managerEmail });
    if (oldManagerUser) await Employee.deleteOne({ userId: oldManagerUser._id });

    // Force delete existing to reset their state
    await User.deleteOne({ email: hrEmail });
    await User.deleteOne({ email: managerEmail });

    // Seed 10 Departments to ensure they are available
    const DEPARTMENTS = [
      { name: 'Engineering & Development', code: 'ENG', isActive: true },
      { name: 'Quality Assurance (QA)', code: 'QA', isActive: true },
      { name: 'Human Resources (HR)', code: 'HR', isActive: true },
      { name: 'Finance & Accounting', code: 'FIN', isActive: true },
      { name: 'Sales & Marketing', code: 'SALES', isActive: true },
      { name: 'IT & Infrastructure', code: 'IT', isActive: true },
      { name: 'Product Management', code: 'PROD', isActive: true },
      { name: 'Operations & Administration', code: 'OPS', isActive: true },
      { name: 'Customer Support', code: 'CS', isActive: true },
      { name: 'Research & Development (R&D)', code: 'RND', isActive: true },
    ];
    for (const d of DEPARTMENTS) {
      await Department.updateOne(
        { code: d.code },
        { $setOnInsert: d },
        { upsert: true }
      );
    }

    let defaultDept = await Department.findOne({ isActive: true });
    if (!defaultDept) {
      defaultDept = await Department.create({ name: 'General Operations', code: 'GEN', description: 'General Ops', isActive: true });
    }

    const hrUser = new User({ email: hrEmail, password: 'Password@123', role: 'HR', isActive: true });
    const hrEmpCode = await getNextEmployeeCode();
    const hrEmployee = await Employee.create({
      userId: hrUser._id, employeeCode: hrEmpCode, firstName: 'HR', lastName: 'Dashboard Test',
      departmentId: defaultDept._id, designation: 'HR Executive', joiningDate: new Date(), status: 'ACTIVE'
    });
    hrUser.employeeId = hrEmployee._id;
    await hrUser.save();
    logger.info(`Test HR Account forcibly recreated: ${hrEmail}`);

    const managerUser = new User({ email: managerEmail, password: 'Password@123', role: 'MANAGER', isActive: true });
    const mgrEmpCode = await getNextEmployeeCode();
    const managerEmployee = await Employee.create({
      userId: managerUser._id, employeeCode: mgrEmpCode, firstName: 'Manager', lastName: 'Dashboard Test',
      departmentId: defaultDept._id, designation: 'Engineering Manager', joiningDate: new Date(), status: 'ACTIVE'
    });
    managerUser.employeeId = managerEmployee._id;
    await managerUser.save();
    logger.info(`Test Manager Account forcibly recreated: ${managerEmail}`);

  } catch (error) {
    fs.writeFileSync('seed-error.log', error.stack || error.message);
    logger.error(`Automatic test account seeding error: ${error.message}`);
  }
};

