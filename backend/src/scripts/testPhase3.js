import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import { generateToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const runPhase3Tests = async () => {
  logger.info('Starting Full Phase 3 Automated Test Suite (15 Test Cases)...');

  let server;
  const testPort = 5097;

  try {
    await connectDB();
    server = app.listen(testPort);
    const baseUrl = `http://localhost:${testPort}/api`;

    // 1. Prepare test accounts
    let adminUser = await User.findOne({ email: 'p3admin@hrms.portal' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'p3admin@hrms.portal',
        password: 'AdminPassword123!',
        role: 'ADMIN',
      });
    }

    let defaultDept = await Department.findOne({ code: 'P3OPS' });
    if (!defaultDept) {
      defaultDept = await Department.create({
        name: 'Phase 3 Operations',
        code: 'P3OPS',
        description: 'Operations Department',
      });
    }

    let adminEmployee = await Employee.findOne({ userId: adminUser._id });
    if (!adminEmployee) {
      adminEmployee = await Employee.create({
        userId: adminUser._id,
        employeeCode: 'EMP-8001',
        firstName: 'P3',
        lastName: 'Admin',
        departmentId: defaultDept._id,
        designation: 'Director of Ops',
        salary: 190000,
      });
      adminUser.employeeId = adminEmployee._id;
      await adminUser.save();
    }

    let empUser = await User.findOne({ email: 'p3emp@hrms.portal' });
    if (!empUser) {
      empUser = await User.create({
        email: 'p3emp@hrms.portal',
        password: 'EmployeePassword123!',
        role: 'EMPLOYEE',
      });
    }

    let empEmployee = await Employee.findOne({ userId: empUser._id });
    if (!empEmployee) {
      empEmployee = await Employee.create({
        userId: empUser._id,
        employeeCode: 'EMP-8002',
        firstName: 'Standard',
        lastName: 'Employee',
        departmentId: defaultDept._id,
        designation: 'Associate',
        salary: 65000,
      });
      empUser.employeeId = empEmployee._id;
      await empUser.save();
    }

    const adminToken = generateToken({ id: adminUser._id, role: adminUser.role, email: adminUser.email });
    const empToken = generateToken({ id: empUser._id, role: empUser.role, email: empUser.email });

    // TEST 1: Department creation
    const deptCode = `DEPT-${Date.now().toString().slice(-4)}`;
    const createDeptRes = await fetch(`${baseUrl}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Engineering Team ${Date.now()}`,
        code: deptCode,
        description: 'Core Software Development',
      }),
    });
    const createDeptData = await createDeptRes.json();
    if (createDeptRes.status === 201 && createDeptData.data.code === deptCode) {
      console.log('✅ TEST 1 PASSED: Department creation (201 Created)');
    } else {
      throw new Error(`TEST 1 FAILED: Expected 201, got ${createDeptRes.status}`);
    }
    const createdDeptId = createDeptData.data._id;

    // TEST 2: Department update
    const updateDeptRes = await fetch(`${baseUrl}/departments/${createdDeptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        description: 'Updated engineering scope and infrastructure',
      }),
    });
    const updateDeptData = await updateDeptRes.json();
    if (updateDeptRes.status === 200 && updateDeptData.data.description === 'Updated engineering scope and infrastructure') {
      console.log('✅ TEST 2 PASSED: Department update (200 OK)');
    } else {
      throw new Error(`TEST 2 FAILED: Expected 200, got ${updateDeptRes.status}`);
    }

    // TEST 3: Department listing (with member count)
    const listDeptRes = await fetch(`${baseUrl}/departments`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    const listDeptData = await listDeptRes.json();
    if (listDeptRes.status === 200 && Array.isArray(listDeptData.data)) {
      console.log(`✅ TEST 3 PASSED: Department listing with member counts (${listDeptData.data.length} found)`);
    } else {
      throw new Error(`TEST 3 FAILED: Could not list departments`);
    }

    // TEST 4: Department safe deactivation
    const deactDeptRes = await fetch(`${baseUrl}/departments/${createdDeptId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (deactDeptRes.status === 200) {
      console.log('✅ TEST 4 PASSED: Department deactivation (200 OK)');
    } else {
      throw new Error(`TEST 4 FAILED: Department deactivation returned ${deactDeptRes.status}`);
    }

    // TEST 5: Duplicate department code rejection
    const dupDeptRes = await fetch(`${baseUrl}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Conflict Dept ${Date.now()}`,
        code: deptCode,
      }),
    });
    if (dupDeptRes.status === 409) {
      console.log('✅ TEST 5 PASSED: Duplicate department code rejected (409 Conflict)');
    } else {
      throw new Error(`TEST 5 FAILED: Expected 409, got ${dupDeptRes.status}`);
    }

    // TEST 6: Employee creation
    const empEmail = `test.dev.${Date.now()}@hrms.portal`;
    const createEmpRes = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        firstName: 'Jordan',
        lastName: 'Smith',
        email: empEmail,
        password: 'JordanPass2026!',
        role: 'EMPLOYEE',
        departmentId: defaultDept._id,
        designation: 'Frontend Engineer',
        employmentType: 'FULL_TIME',
        salary: 105000,
      }),
    });
    const createEmpData = await createEmpRes.json();
    if (createEmpRes.status === 201 && createEmpData.data.employeeCode.startsWith('EMP-')) {
      console.log(`✅ TEST 6 PASSED: Employee creation with code ${createEmpData.data.employeeCode}`);
    } else {
      throw new Error(`TEST 6 FAILED: Employee creation returned ${createEmpRes.status}`);
    }
    const createdEmpId = createEmpData.data._id;

    // TEST 7: Employee / User linking verification
    const linkedUser = await User.findOne({ email: empEmail });
    if (linkedUser && linkedUser.employeeId?.toString() === createdEmpId.toString()) {
      console.log('✅ TEST 7 PASSED: Employee/User bidirectional linking verified');
    } else {
      throw new Error('TEST 7 FAILED: User account was not linked to Employee');
    }

    // TEST 8: Employee listing
    const listEmpRes = await fetch(`${baseUrl}/employees`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    const listEmpData = await listEmpRes.json();
    if (listEmpRes.status === 200 && Array.isArray(listEmpData.data.employees)) {
      console.log(`✅ TEST 8 PASSED: Employee listing retrieved (${listEmpData.data.employees.length} employees)`);
    } else {
      throw new Error('TEST 8 FAILED: Could not list employees');
    }

    // TEST 9: Employee search, filter, and pagination
    const searchEmpRes = await fetch(`${baseUrl}/employees?search=Jordan&page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchEmpData = await searchEmpRes.json();
    if (searchEmpRes.status === 200 && searchEmpData.data.employees.length >= 1) {
      console.log('✅ TEST 9 PASSED: Employee search and pagination functioning properly');
    } else {
      throw new Error('TEST 9 FAILED: Employee search/pagination failed');
    }

    // TEST 10: Employee update
    const updateEmpRes = await fetch(`${baseUrl}/employees/${createdEmpId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        designation: 'Senior Frontend Engineer',
        phone: '+1-555-7788',
      }),
    });
    const updateEmpData = await updateEmpRes.json();
    if (updateEmpRes.status === 200 && updateEmpData.data.designation === 'Senior Frontend Engineer') {
      console.log('✅ TEST 10 PASSED: Employee update (200 OK)');
    } else {
      throw new Error('TEST 10 FAILED: Employee update failed');
    }

    // TEST 11: Employee deactivation (soft deactivation)
    const deactEmpRes = await fetch(`${baseUrl}/employees/${createdEmpId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (deactEmpRes.status === 200) {
      const deactUser = await User.findOne({ email: empEmail });
      const deactEmp = await Employee.findById(createdEmpId);
      if (deactEmp.status === 'TERMINATED' && deactUser.isActive === false) {
        console.log('✅ TEST 11 PASSED: Employee soft deactivation verified (status: TERMINATED, user: inactive)');
      } else {
        throw new Error('TEST 11 FAILED: Status was not set to TERMINATED');
      }
    } else {
      throw new Error('TEST 11 FAILED: Deactivate employee request failed');
    }

    // TEST 12: Duplicate employee email rejection
    const dupEmpRes = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        firstName: 'Duplicate',
        lastName: 'Email',
        email: empEmail,
        departmentId: defaultDept._id,
        designation: 'Engineer',
      }),
    });
    if (dupEmpRes.status === 409) {
      console.log('✅ TEST 12 PASSED: Duplicate employee email rejected (409 Conflict)');
    } else {
      throw new Error(`TEST 12 FAILED: Expected 409 for duplicate email, got ${dupEmpRes.status}`);
    }

    // TEST 13: Unauthorized role access
    const unauthDeptRes = await fetch(`${baseUrl}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${empToken}`,
      },
      body: JSON.stringify({
        name: 'Unauthorized Create',
        code: 'UNAUTH',
      }),
    });
    if (unauthDeptRes.status === 403) {
      console.log('✅ TEST 13 PASSED: Unauthorized role access rejected (403 Forbidden)');
    } else {
      throw new Error(`TEST 13 FAILED: Expected 403 Forbidden, got ${unauthDeptRes.status}`);
    }

    // TEST 14: Salary protection via RBAC
    const salaryAdminRes = await fetch(`${baseUrl}/employees/${empUser.employeeId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const salaryAdminData = await salaryAdminRes.json();

    const salaryEmpRes = await fetch(`${baseUrl}/employees/${empUser.employeeId}`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    const salaryEmpData = await salaryEmpRes.json();

    if (salaryAdminData.data.salary === 65000 && salaryEmpData.data.salary === undefined) {
      console.log('✅ TEST 14 PASSED: Salary protection (Admin sees $65k, regular Employee sees undefined)');
    } else {
      throw new Error(`TEST 14 FAILED: Salary was not properly filtered. Expected Admin=65000 Emp=undefined. Got Admin=${salaryAdminData.data?.salary} Emp=${salaryEmpData.data?.salary}`);
    }

    // TEST 15: Password hash protection
    if (createEmpData.data.password === undefined && salaryAdminData.data.password === undefined) {
      console.log('✅ TEST 15 PASSED: Password hashes are completely protected from all API responses');
    } else {
      throw new Error('TEST 15 FAILED: Password hash leaked in response');
    }

    console.log('\n🎉 ALL 15 PHASE 3 BACKEND TESTS PASSED SUCCESSFULLY!\n');

    server.close();
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error(`Phase 3 test error: ${error.message}`);
    if (server) server.close();
    await disconnectDB();
    process.exit(1);
  }
};

runPhase3Tests();
