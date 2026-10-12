import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { io as ClientIO } from 'socket.io-client';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { initSocket } from '../socket.js';
import app from '../app.js';

const PORT = 5097; // Dedicated test port
let server;
let adminUser, hrUser, managerUser, empUser1, empUser2;
let adminToken, hrToken, managerToken, empToken1, empToken2;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runGroupChatTests() {
  console.log('\n======================================================');
  console.log('🧪 HRMS GROUP CHAT & TEAM MANAGEMENT (PHASE 7) TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, name, details = '') => {
    if (condition) {
      console.log(`   ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  let clientAdmin, clientManager, clientEmp1, clientEmp2;

  try {
    // 1. Connect to Database
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ MongoDB connected successfully\n');

    // 2. Start HTTP & Socket.IO server on test port
    console.log(`2. Starting HTTP & Socket.IO test server on port ${PORT}...`);
    server = http.createServer(app);
    initSocket(server);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`   ✅ Test server listening on http://localhost:${PORT}\n`);

    // 3. Setup Test Department & Users
    console.log('3. Setting up test departments, employees & users...');

    let engDept = await Department.findOne({ code: 'ENG_GRP_TEST' });
    if (!engDept) {
      engDept = await Department.create({
        name: 'Engineering Grp Test',
        code: 'ENG_GRP_TEST',
        description: 'Engineering Dept for Group Chat Tests',
        isActive: true,
      });
    }

    let salesDept = await Department.findOne({ code: 'SLS_GRP_TEST' });
    if (!salesDept) {
      salesDept = await Department.create({
        name: 'Sales Grp Test',
        code: 'SLS_GRP_TEST',
        description: 'Sales Dept for Group Chat Tests',
        isActive: true,
      });
    }

    // Admin
    adminUser = await User.findOneAndUpdate(
      { email: 'grp_admin_test@example.com' },
      { email: 'grp_admin_test@example.com', password: 'Password123!', role: 'ADMIN', isActive: true },
      { upsert: true, new: true }
    );

    // HR
    hrUser = await User.findOneAndUpdate(
      { email: 'grp_hr_test@example.com' },
      { email: 'grp_hr_test@example.com', password: 'Password123!', role: 'HR', isActive: true },
      { upsert: true, new: true }
    );

    // Manager
    managerUser = await User.findOneAndUpdate(
      { email: 'grp_manager_test@example.com' },
      { email: 'grp_manager_test@example.com', password: 'Password123!', role: 'MANAGER', isActive: true },
      { upsert: true, new: true }
    );
    let managerEmp = await Employee.findOneAndUpdate(
      { userId: managerUser._id },
      {
        userId: managerUser._id,
        employeeCode: 'MGR_GRP_01',
        firstName: 'Mike',
        lastName: 'Manager',
        designation: 'Engineering Lead',
        departmentId: engDept._id,
        status: 'ACTIVE',
      },
      { upsert: true, new: true }
    );
    managerUser.employeeId = managerEmp._id;
    await managerUser.save();

    // Employee 1 (in manager's department & direct report)
    empUser1 = await User.findOneAndUpdate(
      { email: 'grp_emp1_test@example.com' },
      { email: 'grp_emp1_test@example.com', password: 'Password123!', role: 'EMPLOYEE', isActive: true },
      { upsert: true, new: true }
    );
    let emp1Doc = await Employee.findOneAndUpdate(
      { userId: empUser1._id },
      {
        userId: empUser1._id,
        employeeCode: 'EMP_GRP_01',
        firstName: 'Eva',
        lastName: 'Engineer',
        designation: 'Software Engineer',
        departmentId: engDept._id,
        reportingManagerId: managerEmp._id,
        status: 'ACTIVE',
      },
      { upsert: true, new: true }
    );
    empUser1.employeeId = emp1Doc._id;
    await empUser1.save();

    // Employee 2 (in Sales department - not reporting to Mike)
    empUser2 = await User.findOneAndUpdate(
      { email: 'grp_emp2_test@example.com' },
      { email: 'grp_emp2_test@example.com', password: 'Password123!', role: 'EMPLOYEE', isActive: true },
      { upsert: true, new: true }
    );
    let emp2Doc = await Employee.findOneAndUpdate(
      { userId: empUser2._id },
      {
        userId: empUser2._id,
        employeeCode: 'EMP_GRP_02',
        firstName: 'Dan',
        lastName: 'Salesperson',
        designation: 'Sales Executive',
        departmentId: salesDept._id,
        reportingManagerId: null,
        status: 'ACTIVE',
      },
      { upsert: true, new: true }
    );
    empUser2.employeeId = emp2Doc._id;
    await empUser2.save();

    adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    hrToken = jwt.sign({ id: hrUser._id, role: hrUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    managerToken = jwt.sign({ id: managerUser._id, role: managerUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    empToken1 = jwt.sign({ id: empUser1._id, role: empUser1.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    empToken2 = jwt.sign({ id: empUser2._id, role: empUser2.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log(`   ✅ Admin: ${adminUser._id}`);
    console.log(`   ✅ Manager (Mike): ${managerUser._id}`);
    console.log(`   ✅ Emp 1 (Eva - Mike's report): ${empUser1._id}`);
    console.log(`   ✅ Emp 2 (Dan - Sales Dept): ${empUser2._id}\n`);

    // Clean prior test groups & messages
    await Conversation.deleteMany({
      participants: { $in: [adminUser._id, managerUser._id, empUser1._id, empUser2._id] },
      type: 'GROUP',
    });

    // 4. Test Group Creation RBAC Permissions
    console.log('4. Testing Group Creation RBAC Permissions...');

    // 4a. Employee Eva tries to create a group -> MUST fail (403 Forbidden)
    const empCreateRes = await fetch(`http://localhost:${PORT}/api/chat/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken1}` },
      body: JSON.stringify({
        name: 'Employee Secret Club',
        memberIds: [managerUser._id.toString()],
      }),
    });
    assert(empCreateRes.status === 403, 'Employees are blocked from creating groups (403 Forbidden)');

    // 4b. Manager Mike attempts to create a group with Dan (outside Mike\'s team/department) -> MUST fail (403 Forbidden)
    const mgrCrossDeptRes = await fetch(`http://localhost:${PORT}/api/chat/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        name: 'Cross Dept unauthorized',
        memberIds: [empUser2._id.toString()],
      }),
    });
    assert(mgrCrossDeptRes.status === 403, 'Managers cannot add members outside their authorized team/department (403 Forbidden)');

    // 4c. Manager Mike creates a valid group with Eva (direct report in same department)
    const mgrValidRes = await fetch(`http://localhost:${PORT}/api/chat/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        name: 'Engineering Core Team',
        description: 'Daily standup and sync for engineering',
        groupType: 'DEPARTMENT',
        memberIds: [empUser1._id.toString()],
      }),
    });
    const mgrValidData = await mgrValidRes.json();
    assert(mgrValidRes.status === 201 && mgrValidData.success === true, 'Manager successfully creates authorized team group');
    const teamGroupId = mgrValidData.data._id;
    assert(!!teamGroupId, 'Team Group ID generated and returned');

    // 4d. Admin Adam creates an organization-wide group with Mike, Eva, and Dan
    const adminCreateRes = await fetch(`http://localhost:${PORT}/api/chat/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'All-Company Announcements',
        description: 'Company-wide updates',
        groupType: 'GENERAL',
        memberIds: [managerUser._id.toString(), empUser1._id.toString(), empUser2._id.toString()],
      }),
    });
    const adminCreateData = await adminCreateRes.json();
    assert(adminCreateRes.status === 201 && adminCreateData.success === true, 'Admin successfully creates organization-wide group');
    const companyGroupId = adminCreateData.data._id;

    // 5. Test Group Membership & Details Access
    console.log('\n5. Testing Group Details & Membership Access...');

    // 5a. Eva (authorized member) reads Engineering Core Team details
    const evaDetailsRes = await fetch(`http://localhost:${PORT}/api/chat/groups/${teamGroupId}`, {
      headers: { Authorization: `Bearer ${empToken1}` },
    });
    const evaDetailsData = await evaDetailsRes.json();
    assert(evaDetailsRes.status === 200 && evaDetailsData.success === true, 'Authorized member Eva can read group details');
    assert(evaDetailsData.data.name === 'Engineering Core Team', 'Group name accurately retrieved');

    // 5b. Dan (unauthorized non-member) attempts to read Engineering Core Team details -> 403 Forbidden
    const danDetailsRes = await fetch(`http://localhost:${PORT}/api/chat/groups/${teamGroupId}`, {
      headers: { Authorization: `Bearer ${empToken2}` },
    });
    assert(danDetailsRes.status === 403, 'Unauthorized non-member Dan cannot view group details (403 Forbidden)');

    // 6. Test Real-time Socket.IO Connection & Room Authorization
    console.log('\n6. Testing Real-time Socket.IO Connection & Room Authorization...');

    clientAdmin = ClientIO(`http://localhost:${PORT}`, { auth: { token: adminToken }, transports: ['websocket'] });
    clientManager = ClientIO(`http://localhost:${PORT}`, { auth: { token: managerToken }, transports: ['websocket'] });
    clientEmp1 = ClientIO(`http://localhost:${PORT}`, { auth: { token: empToken1 }, transports: ['websocket'] });
    clientEmp2 = ClientIO(`http://localhost:${PORT}`, { auth: { token: empToken2 }, transports: ['websocket'] });

    await Promise.all([
      new Promise((res) => clientAdmin.on('connect', res)),
      new Promise((res) => clientManager.on('connect', res)),
      new Promise((res) => clientEmp1.on('connect', res)),
      new Promise((res) => clientEmp2.on('connect', res)),
    ]);
    assert(
      clientAdmin.connected && clientManager.connected && clientEmp1.connected && clientEmp2.connected,
      'All clients authenticated to Socket.IO'
    );

    // Mike and Eva join teamGroupId socket room
    clientManager.emit('join_conversation', teamGroupId);
    clientEmp1.emit('join_conversation', teamGroupId);

    // Dan attempts to join teamGroupId room -> MUST receive socket:error
    let danDeniedJoin = false;
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 3000);
      clientEmp2.once('socket:error', (err) => {
        clearTimeout(timer);
        if (err && err.message && err.message.includes('Not authorized')) {
          danDeniedJoin = true;
        }
        resolve();
      });
      clientEmp2.emit('join_conversation', teamGroupId);
    });
    assert(danDeniedJoin, 'Unauthorized user Dan is denied joining group socket room');

    // 7. Test Group Message Sending, Persistence & Real-time Delivery
    console.log('\n7. Testing Group Message Sending, Persistence & Delivery...');

    let evaReceivedMsg = null;
    let danReceivedMsg = null;

    clientEmp1.on('message:new', (msg) => {
      if (msg.conversationId === teamGroupId) {
        evaReceivedMsg = msg;
      }
    });

    clientEmp2.on('message:new', (msg) => {
      if (msg.conversationId === teamGroupId) {
        danReceivedMsg = msg;
      }
    });

    // Mike sends a message in teamGroupId
    const sendMsgRes = await fetch(`http://localhost:${PORT}/api/chat/conversations/${teamGroupId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ text: 'Good morning team! Standup in 10 minutes.' }),
    });
    const sendMsgData = await sendMsgRes.json();
    assert(sendMsgRes.status === 201 && sendMsgData.success === true, 'Group message posted and persisted');

    await sleep(400);
    assert(
      evaReceivedMsg && evaReceivedMsg.text === 'Good morning team! Standup in 10 minutes.',
      'Group message delivered in real time to member Eva'
    );
    assert(danReceivedMsg === null, 'Group message NOT delivered to non-member Dan');

    // Dan attempts to post to teamGroupId -> MUST fail (403 Forbidden)
    const danPostRes = await fetch(`http://localhost:${PORT}/api/chat/conversations/${teamGroupId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken2}` },
      body: JSON.stringify({ text: 'Unauthorized intruder message!' }),
    });
    assert(danPostRes.status === 403, 'Non-member Dan cannot post to group (403 Forbidden)');

    // 8. Test Adding and Removing Members with Immediate Access Revocation
    console.log('\n8. Testing Adding and Removing Members with Real-Time Revocation...');

    // 8a. Eva (non-admin) tries to add Dan -> MUST fail (403 Forbidden)
    const evaAddRes = await fetch(`http://localhost:${PORT}/api/chat/groups/${teamGroupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken1}` },
      body: JSON.stringify({ memberIds: [empUser2._id.toString()] }),
    });
    assert(evaAddRes.status === 403, 'Non-admin member cannot add users to group (403 Forbidden)');

    // 8b. Admin Adam adds Helen (HR) to teamGroupId
    const adminAddRes = await fetch(`http://localhost:${PORT}/api/chat/groups/${teamGroupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ memberIds: [hrUser._id.toString()] }),
    });
    const adminAddData = await adminAddRes.json();
    assert(adminAddRes.status === 200 && adminAddData.success === true, 'Admin adds Helen to group');

    // 8c. Mike removes Helen from the group
    const removeHelenRes = await fetch(
      `http://localhost:${PORT}/api/chat/groups/${teamGroupId}/members/${hrUser._id.toString()}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${managerToken}` },
      }
    );
    assert(removeHelenRes.status === 200, 'Group admin Mike removes Helen from group');

    // Helen attempts to read messages after removal -> MUST fail (403 Forbidden)
    const helenReadRes = await fetch(`http://localhost:${PORT}/api/chat/conversations/${teamGroupId}/messages`, {
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    assert(helenReadRes.status === 403, 'Removed member immediately rejected from reading messages (403 Forbidden)');

    // 9. Test Updating Group Name and Description
    console.log('\n9. Testing Group Name & Description Updates...');

    // 9a. Eva attempts to rename group -> 403 Forbidden
    const evaRenameRes = await fetch(`http://localhost:${PORT}/api/chat/groups/${teamGroupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken1}` },
      body: JSON.stringify({ name: 'Eva Secret Club' }),
    });
    assert(evaRenameRes.status === 403, 'Regular member cannot rename group (403 Forbidden)');

    // 9b. Group Admin Mike renames group to "Engineering Core Standup"
    let groupUpdatedEvent = false;
    clientEmp1.on('group:updated', (data) => {
      if (data._id === teamGroupId && data.name === 'Engineering Core Standup') {
        groupUpdatedEvent = true;
      }
    });

    const mikeRenameRes = await fetch(`http://localhost:${PORT}/api/chat/groups/${teamGroupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        name: 'Engineering Core Standup',
        description: 'Official engineering daily standup and sync',
      }),
    });
    const mikeRenameData = await mikeRenameRes.json();
    assert(
      mikeRenameRes.status === 200 && mikeRenameData.data.name === 'Engineering Core Standup',
      'Group Admin Mike successfully renames group'
    );
    await sleep(300);
    assert(groupUpdatedEvent, 'Real-time group:updated event broadcast to members');

    // 10. Test Leaving Group Voluntarily
    console.log('\n10. Testing Voluntary Leaving of Group...');

    let memberLeftEvent = false;
    clientManager.on('group:member_left', (data) => {
      if (data.conversationId === teamGroupId && data.userId.toString() === empUser1._id.toString()) {
        memberLeftEvent = true;
      }
    });

    const leaveRes = await fetch(`http://localhost:${PORT}/api/chat/groups/${teamGroupId}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken1}` },
    });
    assert(leaveRes.status === 200, 'Eva successfully leaves the group');
    await sleep(300);
    assert(memberLeftEvent, 'Real-time group:member_left event received by remaining members');

    // Eva attempts to send message after leaving -> 403 Forbidden
    const evaSendAfterLeaveRes = await fetch(
      `http://localhost:${PORT}/api/chat/conversations/${teamGroupId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken1}` },
        body: JSON.stringify({ text: 'Can I still message?' }),
      }
    );
    assert(evaSendAfterLeaveRes.status === 403, 'User who left cannot post to group (403 Forbidden)');

    console.log('\n======================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution encountered an unhandled error:', error);
    process.exit(1);
  } finally {
    if (clientAdmin) clientAdmin.disconnect();
    if (clientManager) clientManager.disconnect();
    if (clientEmp1) clientEmp1.disconnect();
    if (clientEmp2) clientEmp2.disconnect();
    if (server) server.close();
    await mongoose.disconnect();
    console.log('Teardown complete.\n');
  }
}

runGroupChatTests();
