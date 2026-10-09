import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Leave, { normalizeToMidnightUTC } from '../models/Leave.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import { createNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';
import { generateToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const runPhase7Tests = async () => {
  logger.info('Starting Full Notifications & Activity Management Test Suite...');

  let server;
  const testPort = 5099;

  try {
    await connectDB();
    server = app.listen(testPort);
    const baseUrl = `http://localhost:${testPort}/api`;

    // 1. Setup Department
    let dept = await Department.findOne({ code: 'NOTIF_DEPT' });
    if (!dept) {
      dept = await Department.create({
        name: 'Notification Test Department',
        code: 'NOTIF_DEPT',
        description: 'Department for testing notifications & audit logs',
        isActive: true,
      });
    }

    // 2. Setup Admin User & Employee
    let adminUser = await User.findOne({ email: 'notifadmin@hrms.portal' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'notifadmin@hrms.portal',
        password: 'AdminPassword123!',
        role: 'ADMIN',
      });
    }
    let adminEmp = await Employee.findOne({ userId: adminUser._id });
    if (!adminEmp) {
      adminEmp = await Employee.create({
        userId: adminUser._id,
        employeeCode: 'EMP-7001',
        firstName: 'Notif',
        lastName: 'Admin',
        departmentId: dept._id,
        designation: 'System Administrator',
        salary: 150000,
        status: 'ACTIVE',
      });
      adminUser.employeeId = adminEmp._id;
      await adminUser.save();
    }

    // 3. Setup Manager User & Employee
    let managerUser = await User.findOne({ email: 'notifmanager@hrms.portal' });
    if (!managerUser) {
      managerUser = await User.create({
        email: 'notifmanager@hrms.portal',
        password: 'ManagerPassword123!',
        role: 'MANAGER',
      });
    }
    let managerEmp = await Employee.findOne({ userId: managerUser._id });
    if (!managerEmp) {
      managerEmp = await Employee.create({
        userId: managerUser._id,
        employeeCode: 'EMP-7002',
        firstName: 'Nancy',
        lastName: 'Manager',
        departmentId: dept._id,
        designation: 'Engineering Manager',
        salary: 125000,
        status: 'ACTIVE',
      });
      managerUser.employeeId = managerEmp._id;
      await managerUser.save();
    }

    // 4. Setup Employee 1 (reports to Nancy)
    let emp1User = await User.findOne({ email: 'notifemp1@hrms.portal' });
    if (!emp1User) {
      emp1User = await User.create({
        email: 'notifemp1@hrms.portal',
        password: 'EmpPassword123!',
        role: 'EMPLOYEE',
      });
    }
    let emp1Doc = await Employee.findOne({ userId: emp1User._id });
    if (!emp1Doc) {
      emp1Doc = await Employee.create({
        userId: emp1User._id,
        employeeCode: 'EMP-7003',
        firstName: 'Edward',
        lastName: 'Engineer',
        departmentId: dept._id,
        designation: 'Senior Developer',
        reportingManagerId: managerEmp._id,
        salary: 95000,
        status: 'ACTIVE',
        leaveBalances: { casual: 10, sick: 10, earned: 12, paid: 12, unpaid: 0, other: 5 },
      });
      emp1User.employeeId = emp1Doc._id;
      await emp1User.save();
    }

    // 5. Setup Employee 2 (unrelated employee)
    let emp2User = await User.findOne({ email: 'notifemp2@hrms.portal' });
    if (!emp2User) {
      emp2User = await User.create({
        email: 'notifemp2@hrms.portal',
        password: 'EmpPassword123!',
        role: 'EMPLOYEE',
      });
    }
    let emp2Doc = await Employee.findOne({ userId: emp2User._id });
    if (!emp2Doc) {
      emp2Doc = await Employee.create({
        userId: emp2User._id,
        employeeCode: 'EMP-7004',
        firstName: 'Fiona',
        lastName: 'Finance',
        departmentId: dept._id,
        designation: 'Financial Analyst',
        salary: 80000,
        status: 'ACTIVE',
      });
      emp2User.employeeId = emp2Doc._id;
      await emp2User.save();
    }

    // Generate tokens
    const adminToken = generateToken({ id: adminUser._id, role: adminUser.role, email: adminUser.email });
    const managerToken = generateToken({ id: managerUser._id, role: managerUser.role, email: managerUser.email });
    const emp1Token = generateToken({ id: emp1User._id, role: emp1User.role, email: emp1User.email });
    const emp2Token = generateToken({ id: emp2User._id, role: emp2User.role, email: emp2User.email });

    // Clean previous test data
    await Notification.deleteMany({ recipient: { $in: [adminUser._id, managerUser._id, emp1User._id, emp2User._id] } });
    await ActivityLog.deleteMany({ actor: { $in: [adminUser._id, managerUser._id, emp1User._id, emp2User._id] } });

    // --- TEST 1: Direct notification creation via notificationService ---
    const directNotif = await createNotification({
      recipient: emp1User._id,
      type: 'SYSTEM',
      title: 'Welcome to HRMS Notifications',
      message: 'Your notification inbox is active and ready.',
    });
    if (!directNotif || !directNotif._id) {
      throw new Error('TEST 1 FAILED: Direct notification creation failed');
    }
    console.log('✅ TEST 1 PASSED: Direct notification creation via service verified');

    // --- TEST 2: Leave application triggers notification to Manager ---
    const leaveRes = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp1Token}` },
      body: JSON.stringify({
        leaveType: 'CASUAL',
        startDate: '2026-11-10',
        endDate: '2026-11-11',
        reason: 'Personal vacation',
      }),
    });
    const leaveData = await leaveRes.json();
    if (leaveRes.status !== 201 || !leaveData.data?._id) {
      throw new Error(`TEST 2 FAILED: Leave application failed: ${leaveData.message}`);
    }
    const createdLeaveId = leaveData.data._id;

    // Check that Nancy (manager) received LEAVE_APPLIED notification
    const managerNotifs = await Notification.find({ recipient: managerUser._id, type: 'LEAVE_APPLIED' });
    if (managerNotifs.length === 0) {
      throw new Error('TEST 2 FAILED: Manager did not receive LEAVE_APPLIED notification');
    }
    console.log('✅ TEST 2 PASSED: Leave application triggered manager notification');

    // --- TEST 3: Leave approval triggers notification to Employee ---
    const approveRes = await fetch(`${baseUrl}/leaves/${createdLeaveId}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ reviewerComment: 'Enjoy your time off!' }),
    });
    if (approveRes.status !== 200) {
      throw new Error('TEST 3 FAILED: Leave approval request failed');
    }
    const emp1ApproveNotif = await Notification.findOne({
      recipient: emp1User._id,
      type: 'LEAVE_APPROVED',
      relatedEntityId: createdLeaveId,
    });
    if (!emp1ApproveNotif) {
      throw new Error('TEST 3 FAILED: Employee did not receive LEAVE_APPROVED notification');
    }
    console.log('✅ TEST 3 PASSED: Leave approval triggered employee notification');

    // --- TEST 4: Leave rejection triggers notification to Employee ---
    // Apply another leave to reject
    const leave2Res = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp1Token}` },
      body: JSON.stringify({
        leaveType: 'SICK',
        startDate: '2026-12-01',
        endDate: '2026-12-02',
        reason: 'Dentist visit',
      }),
    });
    const leave2Data = await leave2Res.json();
    const createdLeave2Id = leave2Data.data._id;

    const rejectRes = await fetch(`${baseUrl}/leaves/${createdLeave2Id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ reviewerComment: 'Team coverage insufficient on that week' }),
    });
    if (rejectRes.status !== 200) {
      throw new Error('TEST 4 FAILED: Leave rejection request failed');
    }
    const emp1RejectNotif = await Notification.findOne({
      recipient: emp1User._id,
      type: 'LEAVE_REJECTED',
      relatedEntityId: createdLeave2Id,
    });
    if (!emp1RejectNotif) {
      throw new Error('TEST 4 FAILED: Employee did not receive LEAVE_REJECTED notification');
    }
    console.log('✅ TEST 4 PASSED: Leave rejection triggered employee notification with comment');

    // --- TEST 5: Task assignment triggers notification to Employee ---
    const taskRes = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        title: 'Upgrade Payment Gateway',
        description: 'Migrate to v3 API endpoints',
        assignedTo: emp1Doc._id,
        department: dept._id,
        priority: 'HIGH',
        dueDate: '2026-11-20',
        estimatedHours: 12,
      }),
    });
    const taskData = await taskRes.json();
    if (taskRes.status !== 201 || !taskData.data?._id) {
      throw new Error(`TEST 5 FAILED: Task creation failed: ${taskData.message}`);
    }
    const createdTaskId = taskData.data._id;

    const emp1TaskNotif = await Notification.findOne({
      recipient: emp1User._id,
      type: 'TASK_ASSIGNED',
      relatedEntityId: createdTaskId,
    });
    if (!emp1TaskNotif) {
      throw new Error('TEST 5 FAILED: Employee did not receive TASK_ASSIGNED notification');
    }
    console.log('✅ TEST 5 PASSED: Task assignment triggered employee notification');

    // --- TEST 6: Task completion triggers notification to Assigner ---
    const completeRes = await fetch(`${baseUrl}/tasks/${createdTaskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp1Token}` },
      body: JSON.stringify({ status: 'REVIEW', submissionNote: 'Done' }),
    });
    if (completeRes.status !== 200) {
      throw new Error(`TEST 6 FAILED: Task status update failed with status ${completeRes.status}`);
    }
    const managerTaskNotif = await Notification.findOne({
      recipient: managerUser._id,
      type: 'TASK_STATUS_CHANGED',
      relatedEntityId: createdTaskId,
    });
    if (!managerTaskNotif) {
      throw new Error('TEST 6 FAILED: Assigner did not receive TASK_STATUS_CHANGED notification');
    }
    console.log('✅ TEST 6 PASSED: Task completion triggered assigner notification');

    // --- TEST 7: Notification listing (GET /api/notifications) ---
    const listRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    const listData = await listRes.json();
    if (listRes.status !== 200 || !listData.data?.notifications || listData.data.notifications.length === 0) {
      throw new Error('TEST 7 FAILED: Notification listing returned invalid payload');
    }
    console.log(`✅ TEST 7 PASSED: GET /api/notifications returned ${listData.data.notifications.length} notifications`);

    // --- TEST 8: Unread notification count (GET /api/notifications/unread) ---
    const unreadRes = await fetch(`${baseUrl}/notifications/unread`, {
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    const unreadData = await unreadRes.json();
    if (unreadRes.status !== 200 || typeof unreadData.data?.unreadCount !== 'number') {
      throw new Error('TEST 8 FAILED: Unread notification count endpoint returned invalid data');
    }
    const initialUnreadCount = unreadData.data.unreadCount;
    console.log(`✅ TEST 8 PASSED: GET /api/notifications/unread returned count (${initialUnreadCount})`);

    // --- TEST 9: Mark notification as read (PATCH /api/notifications/:id/read) ---
    const notifToRead = listData.data.notifications[0];
    const markReadRes = await fetch(`${baseUrl}/notifications/${notifToRead._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    const markReadData = await markReadRes.json();
    if (markReadRes.status !== 200 || !markReadData.data?.isRead || !markReadData.data?.readAt) {
      throw new Error('TEST 9 FAILED: Mark notification as read failed');
    }
    console.log('✅ TEST 9 PASSED: Single notification marked as read (isRead: true, readAt recorded)');

    // --- TEST 10: Mark all notifications as read (PATCH /api/notifications/read-all) ---
    const markAllRes = await fetch(`${baseUrl}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    const markAllData = await markAllRes.json();
    if (markAllRes.status !== 200) {
      throw new Error('TEST 10 FAILED: Mark all notifications as read failed');
    }
    const postUnreadRes = await fetch(`${baseUrl}/notifications/unread`, {
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    const postUnreadData = await postUnreadRes.json();
    if (postUnreadData.data.unreadCount !== 0) {
      throw new Error('TEST 10 FAILED: Unread count did not drop to 0 after mark-all-read');
    }
    console.log('✅ TEST 10 PASSED: Mark all as read cleared all unread notifications');

    // --- TEST 11: Delete notification (DELETE /api/notifications/:id) ---
    const deleteNotifRes = await fetch(`${baseUrl}/notifications/${notifToRead._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    if (deleteNotifRes.status !== 200) {
      throw new Error('TEST 11 FAILED: Notification deletion failed');
    }
    const checkDeleted = await Notification.findById(notifToRead._id);
    if (checkDeleted) {
      throw new Error('TEST 11 FAILED: Notification still exists in DB after delete');
    }
    console.log('✅ TEST 11 PASSED: Notification deleted successfully');

    // --- TEST 12: Notification pagination ---
    const pageRes = await fetch(`${baseUrl}/notifications?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    const pageData = await pageRes.json();
    if (pageRes.status !== 200 || pageData.data.notifications.length !== 1 || pageData.data.limit !== 1) {
      throw new Error('TEST 12 FAILED: Notification pagination did not enforce limit 1');
    }
    console.log('✅ TEST 12 PASSED: Notification pagination returned exactly 1 record');

    // --- TEST 13: User ownership protection (User B cannot mark User A's notification) ---
    // Create a new notification for emp1
    const emp1SpecialNotif = await createNotification({
      recipient: emp1User._id,
      type: 'SYSTEM',
      title: 'Private Alert for Edward',
      message: 'Sensitive message',
    });
    const forbiddenMarkRes = await fetch(`${baseUrl}/notifications/${emp1SpecialNotif._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${emp2Token}` }, // Fiona tries to modify Edward's notification
    });
    if (forbiddenMarkRes.status !== 403) {
      throw new Error(`TEST 13 FAILED: Expected 403 Forbidden for cross-user modification, got ${forbiddenMarkRes.status}`);
    }
    console.log("✅ TEST 13 PASSED: Cross-user notification modification blocked (403 Forbidden)");

    // --- TEST 14: Unauthorized notification deletion attempt (User B cannot delete User A's notification) ---
    const forbiddenDelRes = await fetch(`${baseUrl}/notifications/${emp1SpecialNotif._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${emp2Token}` },
    });
    if (forbiddenDelRes.status !== 403) {
      throw new Error(`TEST 14 FAILED: Expected 403 Forbidden for cross-user deletion, got ${forbiddenDelRes.status}`);
    }
    console.log("✅ TEST 14 PASSED: Cross-user notification deletion blocked (403 Forbidden)");

    // --- TEST 15: Employee creation logged in ActivityLog ---
    const empActivity = await ActivityLog.findOne({
      action: 'EMPLOYEE_CREATED',
      entityId: emp1Doc._id,
    });
    // Let's create an explicit employee via API to verify full controller audit log
    const newEmpRes = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        firstName: 'Audit',
        lastName: 'Tester',
        email: 'audittester@hrms.portal',
        password: 'Password123!',
        departmentId: dept._id,
        designation: 'QA Engineer',
      }),
    });
    const newEmpData = await newEmpRes.json();
    if (newEmpRes.status !== 201) {
      throw new Error(`Employee creation failed: ${newEmpData.message}`);
    }
    const auditEmpLog = await ActivityLog.findOne({
      action: 'EMPLOYEE_CREATED',
      entityId: newEmpData.data._id,
    });
    if (!auditEmpLog) {
      throw new Error('TEST 15 FAILED: EMPLOYEE_CREATED activity was not recorded');
    }
    console.log('✅ TEST 15 PASSED: EMPLOYEE_CREATED activity automatically logged in ActivityLog');

    // --- TEST 16: Department creation logged in ActivityLog ---
    const newDeptRes = await fetch(`${baseUrl}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Audit Security Dept',
        code: 'AUD_SEC',
        description: 'Security & compliance department',
      }),
    });
    const newDeptData = await newDeptRes.json();
    if (newDeptRes.status !== 201) {
      throw new Error(`Department creation failed: ${newDeptData.message}`);
    }
    const auditDeptLog = await ActivityLog.findOne({
      action: 'DEPARTMENT_CREATED',
      entityId: newDeptData.data._id,
    });
    if (!auditDeptLog) {
      throw new Error('TEST 16 FAILED: DEPARTMENT_CREATED activity was not recorded');
    }
    console.log('✅ TEST 16 PASSED: DEPARTMENT_CREATED activity automatically logged in ActivityLog');

    // --- TEST 17: Leave approval & rejection activities logged ---
    const leaveApproveLog = await ActivityLog.findOne({
      action: 'LEAVE_APPROVED',
      entityId: createdLeaveId,
    });
    const leaveRejectLog = await ActivityLog.findOne({
      action: 'LEAVE_REJECTED',
      entityId: createdLeave2Id,
    });
    if (!leaveApproveLog || !leaveRejectLog) {
      throw new Error('TEST 17 FAILED: Leave approval/rejection activity logs missing');
    }
    console.log('✅ TEST 17 PASSED: LEAVE_APPROVED and LEAVE_REJECTED audit entries verified');

    // --- TEST 18: Task activity logged ---
    const taskLog = await ActivityLog.findOne({
      action: 'TASK_CREATED',
      entityId: createdTaskId,
    });
    if (!taskLog) {
      throw new Error('TEST 18 FAILED: TASK_CREATED activity was not recorded');
    }
    console.log('✅ TEST 18 PASSED: TASK_CREATED audit entry verified');

    // --- TEST 19: Activity listing (GET /api/activity) ---
    const activityListRes = await fetch(`${baseUrl}/activity`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const activityListData = await activityListRes.json();
    if (
      activityListRes.status !== 200 ||
      !activityListData.data?.logs ||
      activityListData.data.logs.length === 0
    ) {
      throw new Error('TEST 19 FAILED: Activity log listing returned empty or error');
    }
    console.log(`✅ TEST 19 PASSED: GET /api/activity returned ${activityListData.data.logs.length} audit logs`);

    // --- TEST 20: Activity filtering (by action & entityType) ---
    const filterRes = await fetch(`${baseUrl}/activity?action=LEAVE_APPROVED&entityType=LEAVE`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const filterData = await filterRes.json();
    const allLeaveApproved = filterData.data.logs.every(
      (l) => l.action === 'LEAVE_APPROVED' && l.entityType === 'LEAVE'
    );
    if (filterRes.status !== 200 || !allLeaveApproved || filterData.data.logs.length === 0) {
      throw new Error('TEST 20 FAILED: Activity filtering failed');
    }
    console.log('✅ TEST 20 PASSED: Activity filtering by action & entityType verified');

    // --- TEST 21: Activity pagination ---
    const actPageRes = await fetch(`${baseUrl}/activity?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const actPageData = await actPageRes.json();
    if (actPageRes.status !== 200 || actPageData.data.logs.length !== 2 || actPageData.data.limit !== 2) {
      throw new Error('TEST 21 FAILED: Activity pagination did not enforce limit 2');
    }
    console.log('✅ TEST 21 PASSED: Activity pagination correctly limited items to 2');

    // --- TEST 22: Activity RBAC scoping (Employee cannot view admin organization-wide logs) ---
    const empActivityRes = await fetch(`${baseUrl}/activity`, {
      headers: { Authorization: `Bearer ${emp2Token}` }, // Fiona checks her activity
    });
    const empActivityData = await empActivityRes.json();
    // Fiona must not see department creation or other users' actions
    const hasUnrelatedLogs = empActivityData.data.logs.some(
      (l) => l.action === 'DEPARTMENT_CREATED' || (l.actor?._id && l.actor._id.toString() !== emp2User._id.toString() && l.entityId.toString() !== emp2Doc._id.toString())
    );
    if (hasUnrelatedLogs) {
      throw new Error('TEST 22 FAILED: Employee was able to view organization-wide department logs');
    }
    console.log('✅ TEST 22 PASSED: Regular Employee strictly scoped to own activity records');

    // --- TEST 23: Sensitive information protection in ActivityLog metadata ---
    // Verify no password, token, or secret is ever present in any activity metadata
    const allLogs = await ActivityLog.find().lean();
    for (const log of allLogs) {
      const metaString = JSON.stringify(log.metadata || {});
      if (
        metaString.includes('password') ||
        metaString.includes('token') ||
        metaString.includes('secret') ||
        metaString.includes('hash')
      ) {
        throw new Error(`TEST 23 FAILED: Security breach - sensitive string detected in log ${log._id}`);
      }
    }
    console.log('✅ TEST 23 PASSED: Sensitive information protection verified (zero passwords/tokens in logs)');

    console.log('\n🎉 ALL 23 BACKEND NOTIFICATION & ACTIVITY TESTS PASSED SUCCESSFULLY!\n');
  } catch (error) {
    logger.error(`Phase 7 Test Suite Failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
};

runPhase7Tests();
