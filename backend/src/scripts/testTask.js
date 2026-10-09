import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Task from '../models/Task.js';
import { generateToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const runTaskTests = async () => {
  logger.info('Starting Full Task Management Test Suite (21 Test Cases)...');

  let server;
  const testPort = 5098;

  try {
    await connectDB();
    server = app.listen(testPort);
    const baseUrl = `http://localhost:${testPort}/api`;

    // 1. Setup Test Department A & B
    let deptA = await Department.findOne({ code: 'ENG_TEST' });
    if (!deptA) {
      deptA = await Department.create({
        name: 'Engineering Test',
        code: 'ENG_TEST',
        description: 'Engineering Dept for Task Testing',
        isActive: true,
      });
    }

    let deptB = await Department.findOne({ code: 'MKT_TEST' });
    if (!deptB) {
      deptB = await Department.create({
        name: 'Marketing Test',
        code: 'MKT_TEST',
        description: 'Marketing Dept for Task Testing',
        isActive: true,
      });
    }

    // 2. Setup Admin User & Employee
    let adminUser = await User.findOne({ email: 'taskadmin@hrms.portal' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'taskadmin@hrms.portal',
        password: 'AdminPassword123!',
        role: 'ADMIN',
      });
    }
    let adminEmp = await Employee.findOne({ userId: adminUser._id });
    if (!adminEmp) {
      adminEmp = await Employee.create({
        userId: adminUser._id,
        employeeCode: 'EMP-9001',
        firstName: 'Admin',
        lastName: 'Director',
        departmentId: deptA._id,
        designation: 'Director of Ops',
        salary: 160000,
        status: 'ACTIVE',
      });
      adminUser.employeeId = adminEmp._id;
      await adminUser.save();
    }

    // 3. Setup HR User & Employee
    let hrUser = await User.findOne({ email: 'taskhr@hrms.portal' });
    if (!hrUser) {
      hrUser = await User.create({
        email: 'taskhr@hrms.portal',
        password: 'HrPassword123!',
        role: 'HR',
      });
    }
    let hrEmp = await Employee.findOne({ userId: hrUser._id });
    if (!hrEmp) {
      hrEmp = await Employee.create({
        userId: hrUser._id,
        employeeCode: 'EMP-9002',
        firstName: 'Helen',
        lastName: 'Recruiter',
        departmentId: deptA._id,
        designation: 'HR Lead',
        salary: 85000,
        status: 'ACTIVE',
      });
      hrUser.employeeId = hrEmp._id;
      await hrUser.save();
    }

    // 4. Setup Manager User & Employee
    let managerUser = await User.findOne({ email: 'taskmanager@hrms.portal' });
    if (!managerUser) {
      managerUser = await User.create({
        email: 'taskmanager@hrms.portal',
        password: 'ManagerPassword123!',
        role: 'MANAGER',
      });
    }
    let managerEmp = await Employee.findOne({ userId: managerUser._id });
    if (!managerEmp) {
      managerEmp = await Employee.create({
        userId: managerUser._id,
        employeeCode: 'EMP-9003',
        firstName: 'Marcus',
        lastName: 'Manager',
        departmentId: deptA._id,
        designation: 'Engineering Lead',
        salary: 120000,
        status: 'ACTIVE',
      });
      managerUser.employeeId = managerEmp._id;
      await managerUser.save();
    }

    // Update deptA managerId
    deptA.managerId = managerEmp._id;
    await deptA.save();

    // 5. Setup Employee 1 (Direct report to Marcus in deptA)
    let emp1User = await User.findOne({ email: 'taskemp1@hrms.portal' });
    if (!emp1User) {
      emp1User = await User.create({
        email: 'taskemp1@hrms.portal',
        password: 'EmpPassword123!',
        role: 'EMPLOYEE',
      });
    }
    let emp1Doc = await Employee.findOne({ userId: emp1User._id });
    if (!emp1Doc) {
      emp1Doc = await Employee.create({
        userId: emp1User._id,
        employeeCode: 'EMP-9004',
        firstName: 'Alice',
        lastName: 'Developer',
        departmentId: deptA._id,
        designation: 'Software Engineer',
        reportingManagerId: managerEmp._id,
        salary: 90000,
        status: 'ACTIVE',
      });
      emp1User.employeeId = emp1Doc._id;
      await emp1User.save();
    }

    // 6. Setup Employee 2 (Bob in deptB, not reporting to Marcus)
    let emp2User = await User.findOne({ email: 'taskemp2@hrms.portal' });
    if (!emp2User) {
      emp2User = await User.create({
        email: 'taskemp2@hrms.portal',
        password: 'EmpPassword123!',
        role: 'EMPLOYEE',
      });
    }
    let emp2Doc = await Employee.findOne({ userId: emp2User._id });
    if (!emp2Doc) {
      emp2Doc = await Employee.create({
        userId: emp2User._id,
        employeeCode: 'EMP-9005',
        firstName: 'Bob',
        lastName: 'Marketer',
        departmentId: deptB._id,
        designation: 'Marketing Associate',
        salary: 70000,
        status: 'ACTIVE',
      });
      emp2User.employeeId = emp2Doc._id;
      await emp2User.save();
    }

    // 7. Setup Inactive Employee
    let inactiveUser = await User.findOne({ email: 'taskinactive@hrms.portal' });
    if (!inactiveUser) {
      inactiveUser = await User.create({
        email: 'taskinactive@hrms.portal',
        password: 'Password123!',
        role: 'EMPLOYEE',
      });
    }
    let inactiveEmp = await Employee.findOne({ userId: inactiveUser._id });
    if (!inactiveEmp) {
      inactiveEmp = await Employee.create({
        userId: inactiveUser._id,
        employeeCode: 'EMP-9006',
        firstName: 'Ian',
        lastName: 'Inactive',
        departmentId: deptA._id,
        designation: 'Former Dev',
        salary: 70000,
        status: 'TERMINATED',
      });
      inactiveUser.employeeId = inactiveEmp._id;
      await inactiveUser.save();
    }

    // Generate JWT tokens
    const adminToken = generateToken({ id: adminUser._id, role: adminUser.role, email: adminUser.email });
    const hrToken = generateToken({ id: hrUser._id, role: hrUser.role, email: hrUser.email });
    const managerToken = generateToken({ id: managerUser._id, role: managerUser.role, email: managerUser.email });
    const emp1Token = generateToken({ id: emp1User._id, role: emp1User.role, email: emp1User.email });
    const emp2Token = generateToken({ id: emp2User._id, role: emp2User.role, email: emp2User.email });

    // Clean up test tasks created previously
    await Task.deleteMany({
      $or: [
        { assignedTo: { $in: [emp1Doc._id, emp2Doc._id, adminEmp._id, managerEmp._id] } },
        { assignedBy: { $in: [adminUser._id, hrUser._id, managerUser._id] } },
      ],
    });

    let createdTask1Id;
    let createdTask2Id;

    // --- TEST 1: Task creation by Manager for direct report ---
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const res1 = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        title: 'Build API Gateway Authentication',
        description: 'Implement JWT verification and rate limiting on gateway endpoints',
        assignedTo: emp1Doc._id,
        department: deptA._id,
        priority: 'HIGH',
        dueDate: futureDate,
        estimatedHours: 16,
      }),
    });
    const data1 = await res1.json();
    if (res1.status !== 201 || !data1.data?._id) {
      throw new Error(`TEST 1 FAILED: Task creation failed (${res1.status}) - ${data1.message}`);
    }
    createdTask1Id = data1.data._id;
    console.log('✅ TEST 1 PASSED: Task creation successful by Manager (201 Created)');

    // --- TEST 2: Task assignment validated ---
    if (
      data1.data.assignedTo?._id?.toString() !== emp1Doc._id.toString() ||
      data1.data.status !== 'TODO'
    ) {
      throw new Error(`TEST 2 FAILED: Task not properly assigned to emp1 or status not TODO`);
    }
    console.log('✅ TEST 2 PASSED: Task assignment and initial status (TODO) verified');

    // --- TEST 3: Employee task retrieval (GET /api/tasks/my) ---
    const res3 = await fetch(`${baseUrl}/tasks/my`, {
      headers: { Authorization: `Bearer ${emp1Token}` },
    });
    const data3 = await res3.json();
    if (res3.status !== 200 || !data3.data?.tasks?.some((t) => t._id === createdTask1Id)) {
      throw new Error(`TEST 3 FAILED: Employee unable to retrieve assigned task`);
    }
    console.log('✅ TEST 3 PASSED: Employee retrieved assigned tasks via /api/tasks/my');

    // --- TEST 4: Employee cannot access another employee's task ---
    const res4 = await fetch(`${baseUrl}/tasks/${createdTask1Id}`, {
      headers: { Authorization: `Bearer ${emp2Token}` },
    });
    if (res4.status !== 403) {
      throw new Error(`TEST 4 FAILED: Expected 403 Forbidden for unauthorized employee, got ${res4.status}`);
    }
    console.log("✅ TEST 4 PASSED: Employee forbidden from accessing another employee's task (403)");

    // --- TEST 5: Task update by Manager ---
    const res5 = await fetch(`${baseUrl}/tasks/${createdTask1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        priority: 'URGENT',
        estimatedHours: 20,
      }),
    });
    const data5 = await res5.json();
    if (res5.status !== 200 || data5.data.priority !== 'URGENT' || data5.data.estimatedHours !== 20) {
      throw new Error(`TEST 5 FAILED: Task update failed: ${data5.message}`);
    }
    console.log('✅ TEST 5 PASSED: Task details updated successfully by Manager');

    // --- TEST 6: Status transition by Assigned Employee (TODO -> IN_PROGRESS -> REVIEW -> COMPLETED) ---
    const res6a = await fetch(`${baseUrl}/tasks/${createdTask1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp1Token}` },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    const data6a = await res6a.json();
    if (res6a.status !== 200 || data6a.data.status !== 'IN_PROGRESS') {
      throw new Error(`TEST 6a FAILED: Transition to IN_PROGRESS failed: ${data6a.message}`);
    }

    const res6b = await fetch(`${baseUrl}/tasks/${createdTask1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp1Token}` },
      body: JSON.stringify({ status: 'REVIEW', submissionNote: 'Finished the API' }),
    });
    const data6b = await res6b.json();
    if (res6b.status !== 200 || data6b.data.status !== 'REVIEW') {
      throw new Error(`TEST 6b FAILED: Transition to REVIEW failed: ${data6b.message}`);
    }

    const res6c = await fetch(`${baseUrl}/tasks/${createdTask1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    const data6c = await res6c.json();
    if (res6c.status !== 200 || data6c.data.status !== 'COMPLETED') {
      throw new Error(`TEST 6c FAILED: Transition to COMPLETED failed: ${data6c.message}`);
    }
    console.log('✅ TEST 6 PASSED: Status transitions (TODO -> IN_PROGRESS -> REVIEW -> COMPLETED) verified');

    // --- TEST 7: Completion timestamp verified ---
    if (!data6c.data.completedAt) {
      throw new Error(`TEST 7 FAILED: completedAt timestamp was not set on completion`);
    }
    console.log(`✅ TEST 7 PASSED: completedAt timestamp automatically recorded (${data6c.data.completedAt})`);

    // --- TEST 8: Reopening completed task clears completedAt ---
    const res8 = await fetch(`${baseUrl}/tasks/${createdTask1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    const data8 = await res8.json();
    if (res8.status !== 200 || data8.data.completedAt !== null) {
      throw new Error(`TEST 8 FAILED: completedAt was not cleared upon reopening task`);
    }
    console.log('✅ TEST 8 PASSED: Reopening completed task cleared completedAt timestamp');

    // --- Create a secondary task with past dueDate (Overdue test) ---
    const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const resCreateOverdue = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Fix Critical Production Memory Leak',
        description: 'Memory profile shows leak in database connection pool',
        assignedTo: emp1Doc._id,
        department: deptA._id,
        priority: 'URGENT',
        dueDate: pastDate,
        estimatedHours: 8,
      }),
    });
    const dataOverdue = await resCreateOverdue.json();
    createdTask2Id = dataOverdue.data?._id;

    // --- TEST 9: Priority filtering (?priority=URGENT) ---
    const res9 = await fetch(`${baseUrl}/tasks?priority=URGENT`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data9 = await res9.json();
    const allUrgent = data9.data?.tasks?.every((t) => t.priority === 'URGENT');
    if (res9.status !== 200 || !allUrgent || data9.data.tasks.length === 0) {
      throw new Error(`TEST 9 FAILED: Priority filtering returned invalid records`);
    }
    console.log(`✅ TEST 9 PASSED: Priority filter returned ${data9.data.tasks.length} URGENT tasks`);

    // --- TEST 10: Status filtering (?status=IN_PROGRESS) ---
    const res10 = await fetch(`${baseUrl}/tasks?status=IN_PROGRESS`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data10 = await res10.json();
    const allInProgress = data10.data?.tasks?.every((t) => t.status === 'IN_PROGRESS');
    if (res10.status !== 200 || !allInProgress) {
      throw new Error(`TEST 10 FAILED: Status filtering returned invalid records`);
    }
    console.log(`✅ TEST 10 PASSED: Status filter returned ${data10.data.tasks.length} IN_PROGRESS tasks`);

    // --- TEST 11: Department filtering (?department=...) ---
    const res11 = await fetch(`${baseUrl}/tasks?department=${deptA._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data11 = await res11.json();
    if (res11.status !== 200 || data11.data.tasks.length === 0) {
      throw new Error(`TEST 11 FAILED: Department filter failed`);
    }
    console.log(`✅ TEST 11 PASSED: Department filter returned ${data11.data.tasks.length} tasks for deptA`);

    // --- TEST 12: Assignee filtering (?assignedTo=...) ---
    const res12 = await fetch(`${baseUrl}/tasks?assignedTo=${emp1Doc._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data12 = await res12.json();
    if (res12.status !== 200 || data12.data.tasks.length === 0) {
      throw new Error(`TEST 12 FAILED: Assignee filtering failed`);
    }
    console.log(`✅ TEST 12 PASSED: Assignee filter returned ${data12.data.tasks.length} tasks for Alice`);

    // --- TEST 13: Search query (?search=Memory) ---
    const res13 = await fetch(`${baseUrl}/tasks?search=Memory`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data13 = await res13.json();
    if (
      res13.status !== 200 ||
      !data13.data.tasks.some((t) => t.title.includes('Memory Leak'))
    ) {
      throw new Error(`TEST 13 FAILED: Search for 'Memory' did not return target task`);
    }
    console.log(`✅ TEST 13 PASSED: Search query matched title/description`);

    // --- TEST 14: Pagination (?page=1&limit=1) ---
    const res14 = await fetch(`${baseUrl}/tasks?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data14 = await res14.json();
    if (res14.status !== 200 || data14.data.tasks.length !== 1 || data14.data.limit !== 1) {
      throw new Error(`TEST 14 FAILED: Pagination did not enforce limit 1`);
    }
    console.log('✅ TEST 14 PASSED: Pagination correctly limited page items to 1');

    // --- TEST 15: Overdue calculation (past dueDate + non-completed status) ---
    const res15 = await fetch(`${baseUrl}/tasks?overdue=true`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data15 = await res15.json();
    const overdueTask = data15.data?.tasks?.find((t) => t._id === createdTask2Id);
    if (!overdueTask || !overdueTask.isOverdue) {
      throw new Error(`TEST 15 FAILED: Task with past due date was not flagged as isOverdue`);
    }
    console.log('✅ TEST 15 PASSED: Overdue calculation correctly flagged past-due task as overdue');

    // --- TEST 16: Manager RBAC (Manager cannot assign to Employee in different department/team) ---
    const res16 = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        title: 'Unauthorized Manager Assignment',
        description: 'Should fail because Bob is in deptB and does not report to Marcus',
        assignedTo: emp2Doc._id,
        department: deptB._id,
        dueDate: futureDate,
      }),
    });
    if (res16.status !== 403) {
      throw new Error(`TEST 16 FAILED: Expected 403 Forbidden for Manager out-of-scope assignment, got ${res16.status}`);
    }
    console.log('✅ TEST 16 PASSED: Manager out-of-scope task assignment restricted (403 Forbidden)');

    // --- TEST 17: HR RBAC (HR can create tasks across departments) ---
    const res17 = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hrToken}` },
      body: JSON.stringify({
        title: 'Brand Identity Guidelines Update',
        description: 'Update company marketing collaterals',
        assignedTo: emp2Doc._id,
        department: deptB._id,
        priority: 'MEDIUM',
        dueDate: futureDate,
        estimatedHours: 12,
      }),
    });
    const data17 = await res17.json();
    if (res17.status !== 201 || !data17.data?._id) {
      throw new Error(`TEST 17 FAILED: HR company-wide task creation failed: ${data17.message}`);
    }
    const hrCreatedTaskId = data17.data._id;
    console.log('✅ TEST 17 PASSED: HR created task in Marketing department successfully');

    // --- TEST 18: Admin RBAC (Admin can perform all operations including delete) ---
    const res18 = await fetch(`${baseUrl}/tasks/${hrCreatedTaskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res18.status !== 200) {
      throw new Error(`TEST 18 FAILED: Admin failed to delete task (${res18.status})`);
    }
    console.log('✅ TEST 18 PASSED: Admin successfully deleted task (200 OK)');

    // --- TEST 19: Unauthorized access (Regular Employee cannot create tasks) ---
    const res19 = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp1Token}` },
      body: JSON.stringify({
        title: 'Employee Self-Creation Attempt',
        assignedTo: emp1Doc._id,
        department: deptA._id,
        dueDate: futureDate,
      }),
    });
    if (res19.status !== 403) {
      throw new Error(`TEST 19 FAILED: Regular employee should be forbidden from creating tasks (expected 403, got ${res19.status})`);
    }
    console.log('✅ TEST 19 PASSED: Regular Employee forbidden from creating tasks (403)');

    // --- TEST 20: Inactive employee handling (Assigning task to TERMINATED employee) ---
    const res20 = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Assignment to Inactive Dev',
        description: 'Must fail',
        assignedTo: inactiveEmp._id,
        department: deptA._id,
        dueDate: futureDate,
      }),
    });
    if (res20.status !== 400) {
      throw new Error(`TEST 20 FAILED: Expected 400 Bad Request for inactive employee assignment, got ${res20.status}`);
    }
    console.log('✅ TEST 20 PASSED: Assignment to inactive employee rejected with 400 Bad Request');

    // --- TEST 21: Department mismatch validation ---
    const res21 = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Mismatched Department Task',
        description: 'Alice is in deptA, not deptB',
        assignedTo: emp1Doc._id,
        department: deptB._id, // Dept mismatch!
        dueDate: futureDate,
      }),
    });
    if (res21.status !== 400) {
      throw new Error(`TEST 21 FAILED: Expected 400 Bad Request for department mismatch, got ${res21.status}`);
    }
    console.log('✅ TEST 21 PASSED: Assignee department mismatch rejected with 400 Bad Request');

    console.log('\n🎉 ALL 21 TASK MANAGEMENT BACKEND TESTS PASSED SUCCESSFULLY!\n');
  } catch (error) {
    logger.error(`Task Test Suite Failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
};

runTaskTests();
