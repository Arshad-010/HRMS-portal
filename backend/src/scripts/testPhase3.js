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
  logger.info('Starting Automated Phase 3 Tests: Department & Employee Management...');

  let server;
  const testPort = 5098;

  try {
    await connectDB();
    server = app.listen(testPort);
    const baseUrl = `http://localhost:${testPort}/api`;

    // 1. Create or ensure test accounts
    // ADMIN User & Employee
    let adminUser = await User.findOne({ email: 'phase3admin@hrms.portal' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'phase3admin@hrms.portal',
        password: 'AdminPassword123!',
        role: 'ADMIN',
      });
    }

    let defaultDept = await Department.findOne({ code: 'OPS' });
    if (!defaultDept) {
      defaultDept = await Department.create({
        name: 'Operations',
        code: 'OPS',
        description: 'Operations Department',
      });
    }

    let adminEmployee = await Employee.findOne({ userId: adminUser._id });
    if (!adminEmployee) {
      adminEmployee = await Employee.create({
        userId: adminUser._id,
        employeeCode: 'EMP-9001',
        firstName: 'Phase3',
        lastName: 'Admin',
        departmentId: defaultDept._id,
        designation: 'Director of Ops',
        salary: 180000,
      });
      adminUser.employeeId = adminEmployee._id;
      await adminUser.save();
    }

    // Regular EMPLOYEE User & Employee
    let empUser = await User.findOne({ email: 'phase3emp@hrms.portal' });
    if (!empUser) {
      empUser = await User.create({
        email: 'phase3emp@hrms.portal',
        password: 'EmployeePassword123!',
        role: 'EMPLOYEE',
      });
    }
    let empEmployee = await Employee.findOne({ userId: empUser._id });
    if (!empEmployee) {
      empEmployee = await Employee.create({
        userId: empUser._id,
        employeeCode: 'EMP-9002',
        firstName: 'Standard',
        lastName: 'Employee',
        departmentId: defaultDept._id,
        designation: 'Associate',
        salary: 60000,
      });
      empUser.employeeId = empEmployee._id;
      await empUser.save();
    }

    const adminToken = generateToken({ id: adminUser._id, role: adminUser.role, email: adminUser.email });
    const empToken = generateToken({ id: empUser._id, role: empUser.role, email: empUser.email });

    // TEST 1: Create department as ADMIN
    const deptCode = `ENG-${Date.now().toString().slice(-4)}`;
    const createDeptRes = await fetch(`${baseUrl}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Engineering ${Date.now()}`,
        code: deptCode,
        description: 'Product Engineering and Core Infrastructure',
      }),
    });
    const createDeptData = await createDeptRes.json();
    if (createDeptRes.status === 201 && createDeptData.data.code === deptCode) {
      console.log('✅ TEST 1 PASSED: Admin created new department successfully');
    } else {
      throw new Error(`TEST 1 FAILED: Department creation returned ${createDeptRes.status}`);
    }
    const createdDeptId = createDeptData.data._id;

    // TEST 2: Duplicate department code rejection (409)
    const dupDeptRes = await fetch(`${baseUrl}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Another Name ${Date.now()}`,
        code: deptCode,
      }),
    });
    if (dupDeptRes.status === 409) {
      console.log('✅ TEST 2 PASSED: Duplicate department code rejected with 409 Conflict');
    } else {
      throw new Error(`TEST 2 FAILED: Expected 409, got ${dupDeptRes.status}`);
    }

    // TEST 3: Regular employee cannot create department (403)
    const unauthDeptRes = await fetch(`${baseUrl}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${empToken}`,
      },
      body: JSON.stringify({
        name: 'Unauthorized Dept',
        code: 'UNAUTH',
      }),
    });
    if (unauthDeptRes.status === 403) {
      console.log('✅ TEST 3 PASSED: EMPLOYEE role restricted from creating department (403)');
    } else {
      throw new Error(`TEST 3 FAILED: Expected 403, got ${unauthDeptRes.status}`);
    }

    // TEST 4: List departments with employee count
    const listDeptRes = await fetch(`${baseUrl}/departments`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    const listDeptData = await listDeptRes.json();
    if (listDeptRes.status === 200 && Array.isArray(listDeptData.data) && listDeptData.data.length > 0) {
      console.log(`✅ TEST 4 PASSED: Retrieved ${listDeptData.data.length} departments with member counts`);
    } else {
      throw new Error(`TEST 4 FAILED: Could not list departments`);
    }

    // TEST 5: Create Employee with user account linking
    const newEmpEmail = `alex.test.${Date.now()}@hrms.portal`;
    const createEmpRes = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        firstName: 'Alex',
        lastName: 'Developer',
        email: newEmpEmail,
        password: 'TempPassword2026!',
        role: 'EMPLOYEE',
        departmentId: createdDeptId,
        designation: 'Full Stack Engineer',
        employmentType: 'FULL_TIME',
        salary: 115000,
      }),
    });
    const createEmpData = await createEmpRes.json();
    if (createEmpRes.status === 201 && createEmpData.data.employeeCode.startsWith('EMP-')) {
      console.log(`✅ TEST 5 PASSED: Created employee ${createEmpData.data.employeeCode} and linked User account`);
    } else {
      throw new Error(`TEST 5 FAILED: Employee creation returned ${createEmpRes.status}`);
    }
    const createdEmpId = createEmpData.data._id;

    // Verify linked User account was created in DB
    const linkedUser = await User.findOne({ email: newEmpEmail });
    if (linkedUser && linkedUser.employeeId?.toString() === createdEmpId.toString()) {
      console.log('✅ TEST 6 PASSED: User-Employee bidirectional relationship verified');
    } else {
      throw new Error('TEST 6 FAILED: User account was not properly linked to Employee');
    }

    // TEST 7: Duplicate employee email rejection (409)
    const dupEmpRes = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        firstName: 'Clone',
        lastName: 'Person',
        email: newEmpEmail,
        departmentId: createdDeptId,
        designation: 'Tester',
      }),
    });
    if (dupEmpRes.status === 409) {
      console.log('✅ TEST 7 PASSED: Duplicate employee email rejected with 409 Conflict');
    } else {
      throw new Error(`TEST 7 FAILED: Expected 409 for duplicate email, got ${dupEmpRes.status}`);
    }

    // TEST 8: Salary protection verification
    // 8a. Admin viewing employee details -> salary IS included
    const adminViewRes = await fetch(`${baseUrl}/employees/${createdEmpId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminViewData = await adminViewRes.json();
    if (adminViewData.data.salary === 115000) {
      console.log('✅ TEST 8A PASSED: ADMIN can view employee salary');
    } else {
      throw new Error('TEST 8A FAILED: ADMIN was unable to view employee salary');
    }

    // 8b. Regular employee viewing employee details -> salary MUST BE STRIPPED
    const empViewRes = await fetch(`${baseUrl}/employees/${createdEmpId}`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    const empViewData = await empViewRes.json();
    if (empViewData.data.salary === undefined) {
      console.log('✅ TEST 8B PASSED: Employee salary is securely stripped for non-Admin/HR users');
    } else {
      throw new Error('TEST 8B FAILED: Sensitive employee salary was leaked to unauthorized user!');
    }

    // TEST 9: Search and filter employees
    const searchRes = await fetch(`${baseUrl}/employees?search=Alex&department=${createdDeptId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchData = await searchRes.json();
    if (searchRes.status === 200 && searchData.data.employees.length >= 1) {
      console.log('✅ TEST 9 PASSED: Search and department filter working correctly');
    } else {
      throw new Error('TEST 9 FAILED: Employee search/filter failed');
    }

    // TEST 10: Update employee
    const updateEmpRes = await fetch(`${baseUrl}/employees/${createdEmpId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        designation: 'Lead Staff Engineer',
        phone: '+1-555-0199',
      }),
    });
    const updateEmpData = await updateEmpRes.json();
    if (updateEmpRes.status === 200 && updateEmpData.data.designation === 'Lead Staff Engineer') {
      console.log('✅ TEST 10 PASSED: Employee designation and contact updated successfully');
    } else {
      throw new Error('TEST 10 FAILED: Employee update failed');
    }

    // TEST 11: Soft deactivation of employee
    const deactivateEmpRes = await fetch(`${baseUrl}/employees/${createdEmpId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (deactivateEmpRes.status === 200) {
      const deactUser = await User.findOne({ email: newEmpEmail });
      const deactEmp = await Employee.findById(createdEmpId);
      if (deactEmp.status === 'TERMINATED' && deactUser.isActive === false) {
        console.log('✅ TEST 11 PASSED: Employee and linked User soft-deactivated (TERMINATED / inactive)');
      } else {
        throw new Error('TEST 11 FAILED: Soft deactivation did not set status to TERMINATED/inactive');
      }
    } else {
      throw new Error('TEST 11 FAILED: Deactivate employee request failed');
    }

    // TEST 12: Soft deactivation of department
    const deactDeptRes = await fetch(`${baseUrl}/departments/${createdDeptId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (deactDeptRes.status === 200) {
      const deptRecord = await Department.findById(createdDeptId);
      if (deptRecord.isActive === false) {
        console.log('✅ TEST 12 PASSED: Department soft-deactivated successfully');
      } else {
        throw new Error('TEST 12 FAILED: Department isActive was not set to false');
      }
    } else {
      throw new Error('TEST 12 FAILED: Deactivate department request failed');
    }

    console.log('\n🎉 ALL 12 PHASE 3 BACKEND CRUD & RBAC TESTS PASSED!\n');

    server.close();
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error(`Phase 3 test failed: ${error.message}`);
    if (server) server.close();
    await disconnectDB();
    process.exit(1);
  }
};

runPhase3Tests();
