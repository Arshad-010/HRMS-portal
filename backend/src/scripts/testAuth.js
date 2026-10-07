import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import { getNextEmployeeCode } from '../models/Counter.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const runTests = async () => {
  logger.info('Starting Automated Authentication & Authorization Backend Tests...');

  let server;
  let testPort = 5099;

  try {
    await connectDB();

    // Start a temporary test server
    server = app.listen(testPort);
    const baseUrl = `http://localhost:${testPort}/api`;

    // 1. Prepare test users
    // Ensure test department
    let testDept = await Department.findOne({ code: 'ENG' });
    if (!testDept) {
      testDept = await Department.create({
        name: 'Engineering',
        code: 'ENG',
        description: 'Software and systems engineering',
      });
    }

    // Create Admin User
    const adminEmail = 'testadmin@hrms.portal';
    const adminPassword = 'AdminPassword123!';
    await User.deleteMany({ email: { $in: [adminEmail, 'testemp@hrms.portal'] } });

    const adminEmpCode = await getNextEmployeeCode();
    const adminUser = new User({
      email: adminEmail,
      password: adminPassword,
      role: 'ADMIN',
    });
    const adminEmployee = await Employee.create({
      userId: adminUser._id,
      employeeCode: adminEmpCode,
      firstName: 'Admin',
      lastName: 'Tester',
      departmentId: testDept._id,
      designation: 'VP of Tech',
      salary: 150000,
    });
    adminUser.employeeId = adminEmployee._id;
    await adminUser.save();

    // Create Regular Employee User
    const empEmail = 'testemp@hrms.portal';
    const empPassword = 'EmployeePassword123!';
    const empCode = await getNextEmployeeCode();
    const empUser = new User({
      email: empEmail,
      password: empPassword,
      role: 'EMPLOYEE',
    });
    const regularEmployee = await Employee.create({
      userId: empUser._id,
      employeeCode: empCode,
      firstName: 'Jane',
      lastName: 'Doe',
      departmentId: testDept._id,
      designation: 'Software Developer',
      salary: 95000,
    });
    empUser.employeeId = regularEmployee._id;
    await empUser.save();

    logger.info(`Generated Test Accounts: ${adminEmpCode} (ADMIN), ${empCode} (EMPLOYEE)`);

    // TEST 1: Login with invalid password
    const failedLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'WrongPassword' }),
    });
    const failedLoginData = await failedLoginRes.json();
    if (failedLoginRes.status === 401 && !failedLoginData.success) {
      console.log('✅ TEST 1 PASSED: Invalid password rejected with 401 Unauthorized');
    } else {
      throw new Error(`TEST 1 FAILED: Expected 401, got ${failedLoginRes.status}`);
    }

    // TEST 2: Successful Admin Login & token check
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status === 200 && adminLoginData.data.token) {
      console.log('✅ TEST 2 PASSED: Admin login successful with JWT issued');
    } else {
      throw new Error(`TEST 2 FAILED: Expected 200 with token, got ${adminLoginRes.status}`);
    }
    const adminToken = adminLoginData.data.token;

    // Verify password is never returned
    if (adminLoginData.data.user.password === undefined) {
      console.log('✅ TEST 3 PASSED: Password hash is omitted from login payload');
    } else {
      throw new Error('TEST 3 FAILED: Password hash was leaked in response!');
    }

    // TEST 4: Get Current User (GET /api/auth/me) with valid token
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meData = await meRes.json();
    if (meRes.status === 200 && meData.data.email === adminEmail) {
      console.log('✅ TEST 4 PASSED: GET /api/auth/me retrieved authenticated admin session');
    } else {
      throw new Error(`TEST 4 FAILED: Expected 200, got ${meRes.status}`);
    }

    // TEST 5: GET /api/auth/me without token (must return 401)
    const unauthorizedRes = await fetch(`${baseUrl}/auth/me`, { method: 'GET' });
    if (unauthorizedRes.status === 401) {
      console.log('✅ TEST 5 PASSED: Protected route rejected unauthenticated request with 401');
    } else {
      throw new Error(`TEST 5 FAILED: Expected 401, got ${unauthorizedRes.status}`);
    }

    // TEST 6: Employee login and role-based salary field stripping
    const empLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: empEmail, password: empPassword }),
    });
    const empLoginData = await empLoginRes.json();
    const empToken = empLoginData.data.token;

    const empMeRes = await fetch(`${baseUrl}/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${empToken}` },
    });
    const empMeData = await empMeRes.json();
    if (empMeData.data.employee.salary === undefined) {
      console.log('✅ TEST 6 PASSED: Salary field is stripped for regular EMPLOYEE role');
    } else {
      throw new Error('TEST 6 FAILED: Employee salary was exposed to regular employee!');
    }

    // TEST 7: Change Password
    const newPassword = 'NewSecretPassword2026!';
    const changePassRes = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${empToken}`,
      },
      body: JSON.stringify({
        currentPassword: empPassword,
        newPassword: newPassword,
      }),
    });
    const changePassData = await changePassRes.json();
    if (changePassRes.status === 200 && changePassData.success) {
      console.log('✅ TEST 7 PASSED: Password changed successfully');
    } else {
      throw new Error(`TEST 7 FAILED: Password change failed with status ${changePassRes.status}`);
    }

    // Verify login with new password
    const newLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: empEmail, password: newPassword }),
    });
    if (newLoginRes.status === 200) {
      console.log('✅ TEST 8 PASSED: Login with new password succeeded');
    } else {
      throw new Error(`TEST 8 FAILED: Could not login with newly changed password`);
    }

    console.log('\n🎉 ALL 8 BACKEND AUTHENTICATION & RBAC TESTS PASSED SUCCESSFULLY!\n');

    server.close();
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error(`Test execution failed: ${error.message}`);
    if (server) server.close();
    await disconnectDB();
    process.exit(1);
  }
};

runTests();
