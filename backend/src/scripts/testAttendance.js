import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Attendance, { normalizeToMidnightUTC } from '../models/Attendance.js';
import { generateToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const runAttendanceTests = async () => {
  logger.info('Starting Full Attendance Management Test Suite (15 Test Cases)...');

  let server;
  const testPort = 5096;

  try {
    await connectDB();
    server = app.listen(testPort);
    const baseUrl = `http://localhost:${testPort}/api`;

    // 1. Setup Test Department
    let dept = await Department.findOne({ code: 'ATTDEPT' });
    if (!dept) {
      dept = await Department.create({
        name: 'Attendance Test Dept',
        code: 'ATTDEPT',
        description: 'Testing Attendance Workflow',
      });
    }

    // 2. Setup Admin User
    let adminUser = await User.findOne({ email: 'attadmin@hrms.portal' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'attadmin@hrms.portal',
        password: 'AdminPassword123!',
        role: 'ADMIN',
      });
    }
    let adminEmp = await Employee.findOne({ userId: adminUser._id });
    if (!adminEmp) {
      adminEmp = await Employee.create({
        userId: adminUser._id,
        employeeCode: 'EMP-7001',
        firstName: 'Att',
        lastName: 'Admin',
        departmentId: dept._id,
        designation: 'HR Director',
        salary: 140000,
      });
      adminUser.employeeId = adminEmp._id;
      await adminUser.save();
    }

    // 3. Setup Manager User
    let mgrUser = await User.findOne({ email: 'attmgr@hrms.portal' });
    if (!mgrUser) {
      mgrUser = await User.create({
        email: 'attmgr@hrms.portal',
        password: 'MgrPassword123!',
        role: 'MANAGER',
      });
    }
    let mgrEmp = await Employee.findOne({ userId: mgrUser._id });
    if (!mgrEmp) {
      mgrEmp = await Employee.create({
        userId: mgrUser._id,
        employeeCode: 'EMP-7002',
        firstName: 'Team',
        lastName: 'Manager',
        departmentId: dept._id,
        designation: 'Engineering Manager',
        salary: 110000,
      });
      mgrUser.employeeId = mgrEmp._id;
      await mgrUser.save();
    }

    // 4. Setup Managed Employee (Reports to mgrEmp)
    let emp1User = await User.findOne({ email: 'attemp1@hrms.portal' });
    if (!emp1User) {
      emp1User = await User.create({
        email: 'attemp1@hrms.portal',
        password: 'Emp1Password123!',
        role: 'EMPLOYEE',
      });
    }
    let emp1 = await Employee.findOne({ userId: emp1User._id });
    if (!emp1) {
      emp1 = await Employee.create({
        userId: emp1User._id,
        employeeCode: 'EMP-7003',
        firstName: 'Direct',
        lastName: 'Report',
        departmentId: dept._id,
        designation: 'Software Engineer',
        reportingManagerId: mgrEmp._id,
        salary: 85000,
      });
      emp1User.employeeId = emp1._id;
      await emp1User.save();
    }

    // 5. Setup Unrelated Employee (Does NOT report to mgrEmp)
    let emp2User = await User.findOne({ email: 'attemp2@hrms.portal' });
    if (!emp2User) {
      emp2User = await User.create({
        email: 'attemp2@hrms.portal',
        password: 'Emp2Password123!',
        role: 'EMPLOYEE',
      });
    }
    let emp2 = await Employee.findOne({ userId: emp2User._id });
    if (!emp2) {
      emp2 = await Employee.create({
        userId: emp2User._id,
        employeeCode: 'EMP-7004',
        firstName: 'Other',
        lastName: 'Colleague',
        departmentId: dept._id,
        designation: 'QA Engineer',
        reportingManagerId: null,
        salary: 75000,
      });
      emp2User.employeeId = emp2._id;
      await emp2User.save();
    }

    // Clean any prior today attendance for test accounts
    const today = normalizeToMidnightUTC(new Date());
    await Attendance.deleteMany({
      employee: { $in: [emp1._id, emp2._id, adminEmp._id, mgrEmp._id] },
    });

    const adminToken = generateToken({ id: adminUser._id, role: adminUser.role, email: adminUser.email });
    const mgrToken = generateToken({ id: mgrUser._id, role: mgrUser.role, email: mgrUser.email });
    const emp1Token = generateToken({ id: emp1User._id, role: emp1User.role, email: emp1User.email });
    const emp2Token = generateToken({ id: emp2User._id, role: emp2User.role, email: emp2User.email });

    // TEST 1: Check-out before check-in must fail (400)
    const earlyCheckOutRes = await fetch(`${baseUrl}/attendance/check-out`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    if (earlyCheckOutRes.status === 400) {
      console.log('✅ TEST 1 PASSED: Check-out without active check-in rejected with 400');
    } else {
      throw new Error(`TEST 1 FAILED: Expected 400, got ${earlyCheckOutRes.status}`);
    }

    // TEST 2: Employee Check-in for today
    const checkInRes = await fetch(`${baseUrl}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${emp1Token}`,
      },
      body: JSON.stringify({ remarks: 'Working from home' }),
    });
    const checkInData = await checkInRes.json();
    if (checkInRes.status === 201 && checkInData.data.checkIn && checkInData.data.status === 'PRESENT') {
      console.log('✅ TEST 2 PASSED: Employee check-in successful (status: PRESENT, timestamp stored)');
    } else {
      throw new Error(`TEST 2 FAILED: Check-in returned status ${checkInRes.status}`);
    }

    // TEST 3: Duplicate check-in on same day rejected (400)
    const dupCheckInRes = await fetch(`${baseUrl}/attendance/check-in`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    if (dupCheckInRes.status === 400) {
      console.log('✅ TEST 3 PASSED: Duplicate check-in on same day rejected with 400');
    } else {
      throw new Error(`TEST 3 FAILED: Duplicate check-in was allowed!`);
    }

    // Artificially backdate checkIn by 8.5 hours to test work hours calculation
    const recordToBackdate = await Attendance.findOne({ employee: emp1._id, date: today });
    recordToBackdate.checkIn = new Date(Date.now() - 8.5 * 60 * 60 * 1000);
    await recordToBackdate.save();

    // TEST 4: Employee Check-out and automatic work duration calculation
    const checkOutRes = await fetch(`${baseUrl}/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${emp1Token}`,
      },
      body: JSON.stringify({ remarks: 'Daily tasks complete' }),
    });
    const checkOutData = await checkOutRes.json();
    if (checkOutRes.status === 200 && checkOutData.data.checkOut && checkOutData.data.workHours >= 8.4) {
      console.log(`✅ TEST 4 PASSED: Check-out recorded and workHours calculated automatically (${checkOutData.data.workHours} hrs)`);
    } else {
      throw new Error(`TEST 4 FAILED: Check-out returned ${checkOutRes.status} with hours: ${checkOutData.data?.workHours}`);
    }

    // TEST 5: Duplicate check-out rejected (400)
    const dupCheckOutRes = await fetch(`${baseUrl}/attendance/check-out`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    if (dupCheckOutRes.status === 400) {
      console.log('✅ TEST 5 PASSED: Duplicate check-out rejected with 400');
    } else {
      throw new Error('TEST 5 FAILED: Duplicate check-out allowed');
    }

    // TEST 6: GET /api/attendance/my
    const myAttRes = await fetch(`${baseUrl}/attendance/my`, {
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    const myAttData = await myAttRes.json();
    if (myAttRes.status === 200 && myAttData.data.todayRecord && myAttData.data.records.length >= 1) {
      console.log('✅ TEST 6 PASSED: GET /api/attendance/my retrieved user history & today status');
    } else {
      throw new Error('TEST 6 FAILED: Failed to retrieve user attendance');
    }

    // TEST 7: GET /api/attendance/summary
    const summaryRes = await fetch(`${baseUrl}/attendance/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const summaryData = await summaryRes.json();
    if (summaryRes.status === 200 && summaryData.data.present >= 1) {
      console.log(`✅ TEST 7 PASSED: Attendance summary metrics calculated (Present: ${summaryData.data.present})`);
    } else {
      throw new Error('TEST 7 FAILED: Attendance summary calculation failed');
    }

    // TEST 8: GET /api/attendance general listing with date & status filters
    const listRes = await fetch(`${baseUrl}/attendance?status=PRESENT&department=${dept._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    if (listRes.status === 200 && Array.isArray(listData.data.records) && listData.data.records.length >= 1) {
      console.log(`✅ TEST 8 PASSED: GET /api/attendance listed ${listData.data.records.length} records matching filters`);
    } else {
      throw new Error('TEST 8 FAILED: Attendance listing failed');
    }

    // TEST 9: Regular employee scoping (cannot see arbitrary employees' attendance)
    const empListRes = await fetch(`${baseUrl}/attendance`, {
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    const empListData = await empListRes.json();
    // Employee must only see their own records
    const hasOnlyOwn = empListData.data.records.every(
      (r) => r.employee._id.toString() === emp1._id.toString()
    );
    if (empListRes.status === 200 && hasOnlyOwn) {
      console.log('✅ TEST 9 PASSED: Employee query strictly scoped to own records only');
    } else {
      throw new Error('TEST 9 FAILED: Employee was able to view other employees attendance');
    }

    // TEST 10: Manager scoping (Manager can view direct report, but NOT unrelated employee)
    const mgrCanViewDirect = await fetch(`${baseUrl}/attendance?employee=${emp1._id}`, {
      headers: { Authorization: `Bearer ${mgrToken}` },
    });
    const mgrUnrelatedRes = await fetch(`${baseUrl}/attendance?employee=${emp2._id}`, {
      headers: { Authorization: `Bearer ${mgrToken}` },
    });
    if (mgrCanViewDirect.status === 200 && mgrUnrelatedRes.status === 403) {
      console.log('✅ TEST 10 PASSED: Manager scoping verified (authorized for direct report, 403 for unrelated employee)');
    } else {
      throw new Error(`TEST 10 FAILED: Manager scoping failed. Statuses: direct=${mgrCanViewDirect.status}, unrelated=${mgrUnrelatedRes.status}`);
    }

    // TEST 11: Manual attendance entry by Admin (POST /api/attendance)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const manualCreateRes = await fetch(`${baseUrl}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        employeeId: emp2._id,
        date: yesterday.toISOString(),
        checkIn: new Date(yesterday.setHours(9, 0, 0, 0)).toISOString(),
        checkOut: new Date(yesterday.setHours(17, 30, 0, 0)).toISOString(),
        status: 'PRESENT',
        remarks: 'Office Attendance Logged by Admin',
      }),
    });
    const manualCreateData = await manualCreateRes.json();
    if (manualCreateRes.status === 201 && manualCreateData.data.workHours === 8.5) {
      console.log('✅ TEST 11 PASSED: Manual attendance entry by Admin with automatic 8.5 work hours');
    } else {
      throw new Error(`TEST 11 FAILED: Expected 201 with 8.5h, got status ${manualCreateRes.status}`);
    }
    const manualRecordId = manualCreateData.data._id;

    // TEST 12: Duplicate attendance record for same employee on same date rejected (409)
    const dupManualRes = await fetch(`${baseUrl}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        employeeId: emp2._id,
        date: yesterday.toISOString(),
        status: 'ABSENT',
      }),
    });
    if (dupManualRes.status === 409) {
      console.log('✅ TEST 12 PASSED: Duplicate attendance on same date rejected with 409 Conflict');
    } else {
      throw new Error(`TEST 12 FAILED: Expected 409, got ${dupManualRes.status}`);
    }

    // TEST 13: Attendance modification (PUT /api/attendance/:id)
    const updateRes = await fetch(`${baseUrl}/attendance/${manualRecordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'HALF_DAY',
        remarks: 'Left early for appointment',
      }),
    });
    const updateData = await updateRes.json();
    if (updateRes.status === 200 && updateData.data.status === 'HALF_DAY') {
      console.log('✅ TEST 13 PASSED: Attendance record updated successfully by Admin');
    } else {
      throw new Error('TEST 13 FAILED: Attendance update failed');
    }

    // TEST 14: Employee cannot modify attendance records (403 Forbidden)
    const unauthModifyRes = await fetch(`${baseUrl}/attendance/${manualRecordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${emp1Token}`,
      },
      body: JSON.stringify({ status: 'PRESENT' }),
    });
    if (unauthModifyRes.status === 403) {
      console.log('✅ TEST 14 PASSED: Regular employee restricted from updating attendance (403 Forbidden)');
    } else {
      throw new Error(`TEST 14 FAILED: Expected 403, got ${unauthModifyRes.status}`);
    }

    // TEST 15: Attendance deletion by Admin
    const deleteRes = await fetch(`${baseUrl}/attendance/${manualRecordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (deleteRes.status === 200) {
      console.log('✅ TEST 15 PASSED: Attendance deletion by Admin successful (200 OK)');
    } else {
      throw new Error('TEST 15 FAILED: Attendance deletion failed');
    }

    console.log('\n🎉 ALL 15 ATTENDANCE BACKEND TESTS PASSED SUCCESSFULLY!\n');

    server.close();
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error(`Attendance test failed: ${error.message}`);
    if (server) server.close();
    await disconnectDB();
    process.exit(1);
  }
};

runAttendanceTests();
