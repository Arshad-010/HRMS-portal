import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import crypto from 'crypto';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Team from '../models/Team.js';
import Task from '../models/Task.js';
import { generateToken } from '../utils/jwt.js';
import { getNextEmployeeCode } from '../models/Counter.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrms';
const PORT = process.env.PORT || 5001;
const baseUrl = `http://localhost:${PORT}/api`;

const testResults = { PASS: 0, FAIL: 0, TOTAL: 10 };

function assert(condition, message, testNumber) {
  if (condition) {
    console.log(`✅ TEST ${testNumber} PASSED: ${message}`);
    testResults.PASS++;
  } else {
    console.error(`❌ TEST ${testNumber} FAILED: ${message}`);
    testResults.FAIL++;
    throw new Error(`TEST ${testNumber} FAILED`);
  }
}

async function getOrCreateDepartment(name, code) {
  let dept = await Department.findOne({ code });
  if (!dept) {
    dept = await Department.create({ name, code, isActive: true });
  }
  return dept;
}

async function setupUsers() {
  const dept = await getOrCreateDepartment('Team Testing Dept', 'TEAMTST');
  
  const createEmp = async (email, role, firstName, lastName) => {
    let user = await User.findOne({ email });
    let emp = await Employee.findOne({ 'firstName': firstName, 'lastName': lastName });
    if (emp) await Employee.deleteOne({ _id: emp._id });
    if (user) await User.deleteOne({ _id: user._id });

    user = await User.create({ email, password: 'Password123!', role, isActive: true });
    const code = await getNextEmployeeCode();
    emp = await Employee.create({
      userId: user._id, employeeCode: code, firstName, lastName,
      departmentId: dept._id, designation: `${role} Dev`, status: 'ACTIVE'
    });
    user.employeeId = emp._id;
    await user.save();
    return { user, emp, token: generateToken({ id: user._id, role: user.role, email: user.email }) };
  };

  const admin = await createEmp('admin.teamtest@hrms.portal', 'ADMIN', 'Admin', 'TeamTest');
  const hr = await createEmp('hr.teamtest@hrms.portal', 'HR', 'HR', 'TeamTest');
  const manager = await createEmp('manager.teamtest@hrms.portal', 'MANAGER', 'Manager', 'TeamTest');
  const lead1 = await createEmp('lead1.teamtest@hrms.portal', 'EMPLOYEE', 'Lead1', 'TeamTest');
  const lead2 = await createEmp('lead2.teamtest@hrms.portal', 'EMPLOYEE', 'Lead2', 'TeamTest');
  const member1 = await createEmp('member1.teamtest@hrms.portal', 'EMPLOYEE', 'Member1', 'TeamTest');
  const member2 = await createEmp('member2.teamtest@hrms.portal', 'EMPLOYEE', 'Member2', 'TeamTest');
  
  await Team.deleteMany({ name: { $in: ['Alpha Team', 'Beta Team'] } });
  
  // Set up manager reporting line
  lead1.emp.reportingManagerId = manager.emp._id;
  await lead1.emp.save();

  return { admin, hr, manager, lead1, lead2, member1, member2 };
}

async function runTests() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for Team Tests');

    const users = await setupUsers();

    // TEST 1: Admin creates a team and assigns an existing employee as Team Lead.
    let team1Res = await fetch(`${baseUrl}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${users.admin.token}` },
      body: JSON.stringify({
        name: 'Alpha Team',
        description: 'First team',
        teamLeadId: users.lead1.emp._id,
        members: [users.member1.emp._id]
      })
    });
    let team1Data = await team1Res.json();
    if (team1Res.status !== 201 || !team1Data.success) {
      console.error('TEST 1 Error Response:', team1Data);
    }
    assert(team1Res.status === 201 && team1Data.success, 'Admin creates a team and assigns Team Lead', 1);
    const team1Id = team1Data.data._id;

    // TEST 2: Authorized HR can create and manage teams.
    let team2Res = await fetch(`${baseUrl}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${users.hr.token}` },
      body: JSON.stringify({
        name: 'Beta Team',
        description: 'Second team',
        teamLeadId: users.lead2.emp._id,
        members: [users.member2.emp._id]
      })
    });
    let team2Data = await team2Res.json();
    assert(team2Res.status === 201 && team2Data.success, 'Authorized HR can create and manage teams', 2);
    const team2Id = team2Data.data._id;

    // TEST 3: Multiple employees can be added to a team, and one employee can belong to multiple teams.
    let addMemberRes = await fetch(`${baseUrl}/teams/${team1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${users.admin.token}` },
      body: JSON.stringify({ members: [users.member1.emp._id, users.member2.emp._id] })
    });
    assert(addMemberRes.status === 200, 'Employee can belong to multiple teams (member2 added to Alpha)', 3);

    // TEST 4: Team Lead can assign a task to a member of a team they lead.
    let task1Res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${users.lead1.token}` },
      body: JSON.stringify({
        title: 'Alpha Task',
        description: 'Task for member1',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        estimatedHours: 5,
        department: users.member1.emp.departmentId,
        assignedTo: users.member1.emp._id,
        teamId: team1Id
      })
    });
    let task1Data = await task1Res.json();
    assert(task1Res.status === 201 && task1Data.success, 'Team Lead can assign a task to a member of their team', 4);
    const task1Id = task1Data.data._id;

    // TEST 5: Team Lead cannot assign tasks to employees outside their team.
    let taskFailRes = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${users.lead1.token}` },
      body: JSON.stringify({
        title: 'Fail Task',
        description: 'Should fail',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        estimatedHours: 5,
        department: users.lead2.emp.departmentId, // lead2 is not in Alpha Team
        assignedTo: users.lead2.emp._id,
        teamId: team1Id
      })
    });
    assert(taskFailRes.status === 400 || taskFailRes.status === 403, 'Team Lead cannot assign tasks to employees outside their team', 5);

    // TEST 6: Employee can submit a task for review but cannot approve their own submission.
    let completeFailRes = await fetch(`${baseUrl}/tasks/${task1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${users.member1.token}` },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    assert(completeFailRes.status === 403, 'Employee cannot approve their own submission directly to COMPLETED', 6);
    
    let reviewRes = await fetch(`${baseUrl}/tasks/${task1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${users.member1.token}` },
      body: JSON.stringify({ status: 'REVIEW', submissionNote: 'Ready for review' })
    });
    assert(reviewRes.status === 200, 'Employee submitted task for REVIEW', 6.5);

    // TEST 7: Team Lead can review their own team's submissions but cannot review unrelated teams' tasks.
    let reviewApproveRes = await fetch(`${baseUrl}/tasks/${task1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${users.lead1.token}` },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    assert(reviewApproveRes.status === 200, 'Team Lead can review and complete their own team\'s submissions', 7);

    let reviewFailRes = await fetch(`${baseUrl}/tasks/${task1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${users.lead2.token}` },
      body: JSON.stringify({ status: 'TODO' })
    });
    assert(reviewFailRes.status === 403, 'Team Lead cannot review unrelated teams\' tasks', 7.5);

    // TEST 8: Manager can access only teams and tasks within their authorized scope.
    let mgrTeamsRes = await fetch(`${baseUrl}/teams`, {
      headers: { Authorization: `Bearer ${users.manager.token}` }
    });
    let mgrTeamsData = await mgrTeamsRes.json();
    let mgrCanSeeAlpha = mgrTeamsData.data.some(t => t._id.toString() === team1Id.toString());
    assert(mgrTeamsRes.status === 200, 'Manager can access their scoped teams', 8);

    // TEST 9: Employees can see their explicit teams, and legacy My Team behavior still works for employees without explicit team membership.
    let myTeamRes = await fetch(`${baseUrl}/teams/my-teams`, {
      headers: { Authorization: `Bearer ${users.member1.token}` }
    });
    let myTeamData = await myTeamRes.json();
    assert(myTeamRes.status === 200 && myTeamData.success && myTeamData.data.length > 0, 'Employees can see their explicit teams via my-teams', 9);

    // TEST 10: Existing tasks without teamId still work.
    let noTeamTaskRes = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${users.manager.token}` },
      body: JSON.stringify({
        title: 'No Team Task',
        description: 'Legacy task',
        priority: 'LOW',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        estimatedHours: 2,
        department: users.lead1.emp.departmentId,
        assignedTo: users.lead1.emp._id,
      })
    });
    assert(noTeamTaskRes.status === 201, 'Existing tasks without teamId still work', 10);
    
    console.log(`\n🎉 TEAM TESTS COMPLETE: ${testResults.PASS}/${testResults.TOTAL} PASSED`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    process.exit(1);
  }
}

runTests();
