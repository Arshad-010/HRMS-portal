import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Leave, { normalizeToMidnightUTC } from '../models/Leave.js';
import Attendance from '../models/Attendance.js';
import { generateToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const runLeaveTests = async () => {
  logger.info('Starting Full Leave Management Test Suite (21 Test Cases)...');

  let server;
  const testPort = 5097;

  try {
    await connectDB();
    server = app.listen(testPort);
    const baseUrl = `http://localhost:${testPort}/api`;

    // 1. Setup Test Department
    let dept = await Department.findOne({ code: 'LEAVEDEPT' });
    if (!dept) {
      dept = await Department.create({
        name: 'Leave Test Dept',
        code: 'LEAVEDEPT',
        description: 'Testing Leave Workflows',
      });
    }

    // 2. Setup Admin User
    let adminUser = await User.findOne({ email: 'leaveadmin@hrms.portal' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'leaveadmin@hrms.portal',
        password: 'AdminPassword123!',
        role: 'ADMIN',
      });
    }
    let adminEmp = await Employee.findOne({ userId: adminUser._id });
    if (!adminEmp) {
      adminEmp = await Employee.create({
        userId: adminUser._id,
        employeeCode: 'EMP-8001',
        firstName: 'Leave',
        lastName: 'Admin',
        departmentId: dept._id,
        designation: 'VP of HR',
        salary: 150000,
        leaveBalances: { casual: 15, sick: 10, earned: 15, paid: 15, unpaid: 0, other: 5 },
      });
      adminUser.employeeId = adminEmp._id;
      await adminUser.save();
    }

    // 3. Setup HR User
    let hrUser = await User.findOne({ email: 'leavehr@hrms.portal' });
    if (!hrUser) {
      hrUser = await User.create({
        email: 'leavehr@hrms.portal',
        password: 'HrPassword123!',
        role: 'HR',
      });
    }
    let hrEmp = await Employee.findOne({ userId: hrUser._id });
    if (!hrEmp) {
      hrEmp = await Employee.create({
        userId: hrUser._id,
        employeeCode: 'EMP-8002',
        firstName: 'Leave',
        lastName: 'HR Specialist',
        departmentId: dept._id,
        designation: 'HR Specialist',
        salary: 95000,
        leaveBalances: { casual: 12, sick: 10, earned: 12, paid: 12, unpaid: 0, other: 5 },
      });
      hrUser.employeeId = hrEmp._id;
      await hrUser.save();
    }

    // 4. Setup Manager User
    let mgrUser = await User.findOne({ email: 'leavemgr@hrms.portal' });
    if (!mgrUser) {
      mgrUser = await User.create({
        email: 'leavemgr@hrms.portal',
        password: 'MgrPassword123!',
        role: 'MANAGER',
      });
    }
    let mgrEmp = await Employee.findOne({ userId: mgrUser._id });
    if (!mgrEmp) {
      mgrEmp = await Employee.create({
        userId: mgrUser._id,
        employeeCode: 'EMP-8003',
        firstName: 'Leave',
        lastName: 'Manager',
        departmentId: dept._id,
        designation: 'Team Lead',
        salary: 110000,
        leaveBalances: { casual: 12, sick: 10, earned: 12, paid: 12, unpaid: 0, other: 5 },
      });
      mgrUser.employeeId = mgrEmp._id;
      await mgrUser.save();
    }

    // 5. Setup Employee 1 (Reports to Manager)
    let emp1User = await User.findOne({ email: 'leaveemp1@hrms.portal' });
    if (!emp1User) {
      emp1User = await User.create({
        email: 'leaveemp1@hrms.portal',
        password: 'EmpPassword123!',
        role: 'EMPLOYEE',
      });
    }
    let emp1 = await Employee.findOne({ userId: emp1User._id });
    if (!emp1) {
      emp1 = await Employee.create({
        userId: emp1User._id,
        employeeCode: 'EMP-8004',
        firstName: 'Sarah',
        lastName: 'Developer',
        departmentId: dept._id,
        designation: 'Backend Developer',
        reportingManagerId: mgrEmp._id,
        salary: 85000,
        leaveBalances: { casual: 10, sick: 8, earned: 12, paid: 12, unpaid: 0, other: 5 },
      });
      emp1User.employeeId = emp1._id;
      await emp1User.save();
    }

    // 6. Setup Inactive Employee
    let inactUser = await User.findOne({ email: 'leaveinact@hrms.portal' });
    if (!inactUser) {
      inactUser = await User.create({
        email: 'leaveinact@hrms.portal',
        password: 'InactPassword123!',
        role: 'EMPLOYEE',
      });
    }
    let inactEmp = await Employee.findOne({ userId: inactUser._id });
    if (!inactEmp) {
      inactEmp = await Employee.create({
        userId: inactUser._id,
        employeeCode: 'EMP-8005',
        firstName: 'Inactive',
        lastName: 'Employee',
        departmentId: dept._id,
        designation: 'Former Staff',
        status: 'TERMINATED',
        salary: 50000,
        leaveBalances: { casual: 5, sick: 5, earned: 5, paid: 5, unpaid: 0, other: 5 },
      });
      inactUser.employeeId = inactEmp._id;
      await inactUser.save();
    }

    // Reset previous leave test records for clean test run
    await Leave.deleteMany({ employee: { $in: [emp1._id, inactEmp._id, mgrEmp._id] } });

    // Generate tokens
    const adminToken = generateToken({ id: adminUser._id, role: adminUser.role, email: adminUser.email });
    const hrToken = generateToken({ id: hrUser._id, role: hrUser.role, email: hrUser.email });
    const mgrToken = generateToken({ id: mgrUser._id, role: mgrUser.role, email: mgrUser.email });
    const emp1Token = generateToken({ id: emp1User._id, role: emp1User.role, email: emp1User.email });
    const inactToken = generateToken({ id: inactUser._id, role: inactUser.role, email: inactUser.email });

    // ==========================================
    // TEST 1: Employee applies for leave
    // ==========================================
    const applyRes = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${emp1Token}`,
      },
      body: JSON.stringify({
        leaveType: 'CASUAL',
        startDate: '2026-11-10',
        endDate: '2026-11-12',
        reason: 'Family vacation and personal errands',
      }),
    });
    const applyData = await applyRes.json();
    if (applyRes.status === 201 && applyData.data?._id) {
      console.log('✅ TEST 1 PASSED: Employee applied for leave (201 Created)');
    } else {
      throw new Error(`TEST 1 FAILED: Status ${applyRes.status} — ${applyData.message}`);
    }

    const testLeaveId = applyData.data._id;

    // ==========================================
    // TEST 2: Leave request created as PENDING
    // ==========================================
    if (applyData.data.status === 'PENDING') {
      console.log('✅ TEST 2 PASSED: Leave request initialized with status PENDING');
    } else {
      throw new Error(`TEST 2 FAILED: Expected status PENDING, got ${applyData.data.status}`);
    }

    // ==========================================
    // TEST 3: numberOfDays calculated correctly on backend
    // ==========================================
    // 2026-11-10 to 2026-11-12 inclusive = 3 days
    if (applyData.data.numberOfDays === 3) {
      console.log('✅ TEST 3 PASSED: numberOfDays calculated accurately on server (3 days)');
    } else {
      throw new Error(`TEST 3 FAILED: Expected 3 days, got ${applyData.data.numberOfDays}`);
    }

    // ==========================================
    // TEST 4: Employee can view own leaves
    // ==========================================
    const myLeavesRes = await fetch(`${baseUrl}/leaves/my`, {
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    const myLeavesData = await myLeavesRes.json();
    if (myLeavesRes.status === 200 && myLeavesData.data?.leaves.length >= 1) {
      console.log('✅ TEST 4 PASSED: Employee retrieved own leave requests');
    } else {
      throw new Error('TEST 4 FAILED: Could not retrieve own leaves');
    }

    // ==========================================
    // TEST 5: Employee query strictly scoped (cannot view other employees)
    // ==========================================
    const allLeavesRes = await fetch(`${baseUrl}/leaves`, {
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    const allLeavesData = await allLeavesRes.json();
    const onlyOwn = allLeavesData.data.leaves.every(
      (l) => l.employee._id.toString() === emp1._id.toString()
    );
    if (allLeavesRes.status === 200 && onlyOwn) {
      console.log('✅ TEST 5 PASSED: Employee queries strictly scoped to own records');
    } else {
      throw new Error('TEST 5 FAILED: Employee was able to access other employees leaves');
    }

    // ==========================================
    // TEST 6: Overlapping leave rejection
    // ==========================================
    const overlapRes = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${emp1Token}`,
      },
      body: JSON.stringify({
        leaveType: 'SICK',
        startDate: '2026-11-11',
        endDate: '2026-11-13',
        reason: 'Overlapping leave request',
      }),
    });
    if (overlapRes.status === 400) {
      console.log('✅ TEST 6 PASSED: Overlapping leave rejected with 400 Bad Request');
    } else {
      throw new Error(`TEST 6 FAILED: Overlap was allowed with status ${overlapRes.status}`);
    }

    // ==========================================
    // TEST 7: Insufficient balance rejection
    // ==========================================
    // Employee has casual balance of 10. Attempting to apply for 15 days
    const excessRes = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${emp1Token}`,
      },
      body: JSON.stringify({
        leaveType: 'CASUAL',
        startDate: '2026-12-01',
        endDate: '2026-12-20', // 20 days
        reason: 'Long trip exceeding quota',
      }),
    });
    if (excessRes.status === 400) {
      console.log('✅ TEST 7 PASSED: Insufficient balance rejected with 400 Bad Request');
    } else {
      throw new Error('TEST 7 FAILED: Excess leave allowed without quota');
    }

    // ==========================================
    // TEST 8: Manager approval
    // ==========================================
    const mgrApproveRes = await fetch(`${baseUrl}/leaves/${testLeaveId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mgrToken}`,
      },
      body: JSON.stringify({ reviewerComment: 'Approved by Team Lead' }),
    });
    const mgrApproveData = await mgrApproveRes.json();
    if (mgrApproveRes.status === 200 && mgrApproveData.data?.status === 'APPROVED') {
      console.log('✅ TEST 8 PASSED: Direct reporting Manager approved leave request');
    } else {
      throw new Error(`TEST 8 FAILED: Manager approval failed: ${mgrApproveData.message}`);
    }

    // ==========================================
    // TEST 9: Duplicate approval protection
    // ==========================================
    const dupApproveRes = await fetch(`${baseUrl}/leaves/${testLeaveId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    if (dupApproveRes.status === 400) {
      console.log('✅ TEST 9 PASSED: Duplicate approval rejected with 400 Bad Request');
    } else {
      throw new Error('TEST 9 FAILED: Duplicate approval allowed');
    }

    // ==========================================
    // TEST 10: Reviewer comment stored & verified
    // ==========================================
    if (mgrApproveData.data.reviewerComment === 'Approved by Team Lead') {
      console.log('✅ TEST 10 PASSED: Reviewer comment stored and verified');
    } else {
      throw new Error('TEST 10 FAILED: Reviewer comment was not saved');
    }

    // ==========================================
    // TEST 11: Balance deduction after approval
    // ==========================================
    const refreshedEmp = await Employee.findById(emp1._id);
    // Initial casual was 10. 3 days approved -> should be 7
    if (refreshedEmp.leaveBalances.casual === 7) {
      console.log(`✅ TEST 11 PASSED: Balance deducted atomically (Casual: 10 -> ${refreshedEmp.leaveBalances.casual})`);
    } else {
      throw new Error(`TEST 11 FAILED: Expected balance 7, got ${refreshedEmp.leaveBalances.casual}`);
    }

    // ==========================================
    // TEST 12: Leave / Attendance integration
    // ==========================================
    const attOnLeave = await Attendance.findOne({
      employee: emp1._id,
      date: normalizeToMidnightUTC('2026-11-10'),
    });
    if (attOnLeave && attOnLeave.status === 'ON_LEAVE') {
      console.log('✅ TEST 12 PASSED: Approved leave synchronized with Attendance (status: ON_LEAVE)');
    } else {
      throw new Error('TEST 12 FAILED: Attendance record ON_LEAVE was not created');
    }

    // ==========================================
    // TEST 13: Balance restoration after cancellation
    // ==========================================
    const cancelRes = await fetch(`${baseUrl}/leaves/${testLeaveId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    const cancelData = await cancelRes.json();
    const restoredEmp = await Employee.findById(emp1._id);
    if (cancelRes.status === 200 && restoredEmp.leaveBalances.casual === 10) {
      console.log('✅ TEST 13 PASSED: Balance restored after cancellation (Casual: 7 -> 10)');
    } else {
      throw new Error(`TEST 13 FAILED: Restoration failed: ${cancelData.message}`);
    }

    // ==========================================
    // TEST 14: Cancelling already cancelled leave rejected
    // ==========================================
    const dupCancelRes = await fetch(`${baseUrl}/leaves/${testLeaveId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    if (dupCancelRes.status === 400) {
      console.log('✅ TEST 14 PASSED: Cancelling already cancelled leave rejected with 400');
    } else {
      throw new Error('TEST 14 FAILED: Duplicate cancellation allowed');
    }

    // ==========================================
    // TEST 15: Leave Rejection workflow
    // ==========================================
    // Create new leave to test rejection
    const newLeaveRes = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${emp1Token}`,
      },
      body: JSON.stringify({
        leaveType: 'SICK',
        startDate: '2026-11-20',
        endDate: '2026-11-21',
        reason: 'Medical checkup',
      }),
    });
    const newLeaveData = await newLeaveRes.json();
    const rejectLeaveId = newLeaveData.data._id;

    const rejectRes = await fetch(`${baseUrl}/leaves/${rejectLeaveId}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mgrToken}`,
      },
      body: JSON.stringify({ reviewerComment: 'Critical release dates scheduled' }),
    });
    const rejectData = await rejectRes.json();
    if (rejectRes.status === 200 && rejectData.data?.status === 'REJECTED') {
      console.log('✅ TEST 15 PASSED: Leave request rejected successfully');
    } else {
      throw new Error(`TEST 15 FAILED: Rejection failed: ${rejectData.message}`);
    }

    // ==========================================
    // TEST 16: Unauthorized approval protection (Employee cannot approve)
    // ==========================================
    const unauthApproveRes = await fetch(`${baseUrl}/leaves/${rejectLeaveId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    if (unauthApproveRes.status === 403) {
      console.log('✅ TEST 16 PASSED: Regular Employee forbidden from approving leave (403)');
    } else {
      throw new Error('TEST 16 FAILED: Employee was able to approve leave');
    }

    // ==========================================
    // TEST 17: HR approval on company leave
    // ==========================================
    const hrLeaveRes = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${emp1Token}`,
      },
      body: JSON.stringify({
        leaveType: 'EARNED',
        startDate: '2026-12-10',
        endDate: '2026-12-12',
        reason: 'Annual vacation',
      }),
    });
    const hrLeaveData = await hrLeaveRes.json();
    const hrApproveRes = await fetch(`${baseUrl}/leaves/${hrLeaveData.data._id}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`,
      },
      body: JSON.stringify({ reviewerComment: 'Approved by HR Department' }),
    });
    if (hrApproveRes.status === 200) {
      console.log('✅ TEST 17 PASSED: HR successfully approved leave request');
    } else {
      throw new Error('TEST 17 FAILED: HR approval failed');
    }

    // ==========================================
    // TEST 18: Admin approval
    // ==========================================
    const adminApproveRes = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${emp1Token}`,
      },
      body: JSON.stringify({
        leaveType: 'OTHER',
        startDate: '2026-12-25',
        endDate: '2026-12-26',
        reason: 'Festive leave',
      }),
    });
    const adminApproveData = await adminApproveRes.json();
    const adminPatchRes = await fetch(`${baseUrl}/leaves/${adminApproveData.data._id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminPatchRes.status === 200) {
      console.log('✅ TEST 18 PASSED: Admin successfully approved leave request');
    } else {
      throw new Error('TEST 18 FAILED: Admin approval failed');
    }

    // ==========================================
    // TEST 19: Filtering & Pagination
    // ==========================================
    const filterRes = await fetch(
      `${baseUrl}/leaves?status=APPROVED&leaveType=EARNED&department=${dept._id}&page=1&limit=5`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const filterData = await filterRes.json();
    if (filterRes.status === 200 && filterData.data?.leaves.length >= 1) {
      console.log(`✅ TEST 19 PASSED: Filter & pagination returned ${filterData.data.leaves.length} records`);
    } else {
      throw new Error('TEST 19 FAILED: Leave filtering failed');
    }

    // ==========================================
    // TEST 20: Invalid date sequence rejection
    // ==========================================
    const invalidDateRes = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${emp1Token}`,
      },
      body: JSON.stringify({
        leaveType: 'CASUAL',
        startDate: '2026-11-15',
        endDate: '2026-11-10', // End date earlier than start date
        reason: 'Invalid sequence',
      }),
    });
    if (invalidDateRes.status === 400) {
      console.log('✅ TEST 20 PASSED: End date earlier than start date rejected with 400');
    } else {
      throw new Error('TEST 20 FAILED: Invalid dates allowed');
    }

    // ==========================================
    // TEST 21: Inactive / Terminated employee application rejected
    // ==========================================
    const inactApplyRes = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inactToken}`,
      },
      body: JSON.stringify({
        leaveType: 'CASUAL',
        startDate: '2026-11-20',
        endDate: '2026-11-21',
        reason: 'Application by terminated employee',
      }),
    });
    if (inactApplyRes.status === 400) {
      console.log('✅ TEST 21 PASSED: Inactive employee leave application rejected with 400');
    } else {
      throw new Error('TEST 21 FAILED: Inactive employee was allowed to apply for leave');
    }

    console.log('\n🎉 ALL 21 LEAVE MANAGEMENT BACKEND TESTS PASSED SUCCESSFULLY!\n');
  } catch (error) {
    logger.error(`Leave Test Suite Execution Failed: ${error.message}`);
    throw error;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }
};

runLeaveTests().catch(() => process.exit(1));
