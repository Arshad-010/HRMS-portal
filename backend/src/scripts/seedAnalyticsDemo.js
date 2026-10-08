import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Task from '../models/Task.js';
import ReviewCycle from '../models/ReviewCycle.js';
import PerformanceReview from '../models/PerformanceReview.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const DEPARTMENTS_DATA = [
  { name: 'Engineering', code: 'ENG', description: 'Core software development, cloud infrastructure, and QA' },
  { name: 'Human Resources', code: 'HRD', description: 'Talent acquisition, organizational culture, and employee welfare' },
  { name: 'Product & Design', code: 'PRD', description: 'User experience, product management, and interface design' },
  { name: 'Sales & Marketing', code: 'SLS', description: 'Revenue growth, client partnerships, and market brand' },
  { name: 'Customer Support', code: 'SUP', description: 'Client assistance, ticket resolution, and customer satisfaction' },
  { name: 'Finance & Operations', code: 'OPS', description: 'Financial auditing, resource logistics, and office operations' },
];

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rahul', 'Pooja', 'Rohan', 'Sneha', 'Vikram', 'Priya', 'Aditya', 'Meera',
  'Arjun', 'Divya', 'Karan', 'Neha', 'Siddharth', 'Tanvi', 'Abhishek', 'Rhea', 'Varun', 'Kavya',
  'Nikhil', 'Simran', 'Gaurav', 'Isha', 'Rajesh', 'Shruti', 'Akash', 'Swati', 'Manish', 'Pallavi',
  'Suresh', 'Komal', 'Deepak', 'Anjali', 'Kunal', 'Preeti', 'Harish', 'Sunita', 'Vivek', 'Nandini',
  'Alok', 'Bhavna', 'Girish', 'Chitra', 'Dinesh', 'Geeta', 'Jitin', 'Juhi', 'Lalit', 'Maya'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Mehta', 'Nair', 'Kapoor', 'Iyer', 'Gupta', 'Singh',
  'Chopra', 'Joshi', 'Bhatia', 'Deshmukh', 'Kulkarni', 'Malhotra', 'Rao', 'Bose', 'Chatterjee', 'Das'
];

export const seedAnalyticsDemo = async () => {
  try {
    await connectDB();
    logger.info('🚀 Starting Comprehensive Analytics & HR Command Center Seeder...');

    // 1. Seed or retrieve Departments
    const deptDocs = {};
    for (const d of DEPARTMENTS_DATA) {
      let dept = await Department.findOne({ code: d.code });
      if (!dept) {
        dept = await Department.create({ ...d, isActive: true });
      }
      deptDocs[d.code] = dept;
    }
    logger.info(`✓ Seeded / Verified ${Object.keys(deptDocs).length} departments.`);

    // 2. Fetch existing Admin
    const adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      logger.error('No admin user found! Please run regular seed.js first or check .env.');
    }

    const defaultPassword = 'Password@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 3. Prepare Roles Distribution
    // 4 HR, 8 Managers, 36 Employees
    const deptCodes = ['ENG', 'HRD', 'PRD', 'SLS', 'SUP', 'OPS'];
    const designationsByDept = {
      ENG: {
        managers: ['Engineering Director', 'Lead Backend Architect', 'Frontend Engineering Lead'],
        employees: ['Senior Full Stack Engineer', 'Backend Node.js Engineer', 'React UI Specialist', 'DevOps & Cloud Engineer', 'QA Automation Engineer']
      },
      HRD: {
        managers: ['Head of People Ops'],
        employees: ['Senior Talent Partner', 'HR Business Partner', 'Employee Experience Specialist', 'Compensation & Benefits Analyst']
      },
      PRD: {
        managers: ['VP of Product'],
        employees: ['Senior Product Manager', 'Lead UI/UX Designer', 'Product Operations Specialist', 'UX Researcher']
      },
      SLS: {
        managers: ['Director of Enterprise Sales'],
        employees: ['Enterprise Account Executive', 'Sales Development Rep', 'Client Relationship Manager', 'Growth Marketing Specialist']
      },
      SUP: {
        managers: ['Head of Customer Support'],
        employees: ['Tier 2 Technical Support', 'Customer Success Associate', 'Escalation Resolution Specialist']
      },
      OPS: {
        managers: ['Director of Business Operations'],
        employees: ['Financial Planning Analyst', 'Procurement Specialist', 'Operations Coordinator']
      }
    };

    // Check existing count of demo users
    const existingEmployeesCount = await Employee.countDocuments();
    let createdEmployees = [];

    if (existingEmployeesCount < 30) {
      logger.info('Creating 48 demo personnel (HR, Managers, Employees)...');

      // Create Managers first so employees can reference them
      const managerMap = {}; // deptCode -> Manager EmployeeDoc
      let codeCounter = 2000;

      // 8 Managers across departments
      for (const code of deptCodes) {
        const titles = designationsByDept[code].managers;
        for (const title of titles) {
          const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
          const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
          const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${codeCounter}@hrms.demo`;

          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              email,
              password: defaultPassword,
              role: code === 'HRD' ? 'HR' : 'MANAGER',
              isActive: true,
            });
          }

          let emp = await Employee.findOne({ userId: user._id });
          if (!emp) {
            emp = await Employee.create({
              userId: user._id,
              employeeCode: `EMP-${codeCounter}`,
              firstName: fn,
              lastName: ln,
              phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
              departmentId: deptDocs[code]._id,
              designation: title,
              joiningDate: new Date(Date.now() - (180 + Math.floor(Math.random() * 500)) * 86400000),
              status: 'ACTIVE',
              salary: 120000 + Math.floor(Math.random() * 60000),
              leaveBalances: { casual: 12, sick: 10, earned: 14, paid: 12, unpaid: 0, other: 5 },
            });
            user.employeeId = emp._id;
            await user.save();
          }

          if (!managerMap[code]) managerMap[code] = emp;
          createdEmployees.push(emp);
          codeCounter++;
        }
      }

      // 4 Dedicated HR team members
      for (let i = 0; i < 3; i++) {
        const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const email = `hr.${fn.toLowerCase()}.${codeCounter}@hrms.demo`;

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            email,
            password: defaultPassword,
            role: 'HR',
            isActive: true,
          });
        }

        let emp = await Employee.findOne({ userId: user._id });
        if (!emp) {
          emp = await Employee.create({
            userId: user._id,
            employeeCode: `EMP-${codeCounter}`,
            firstName: fn,
            lastName: ln,
            phone: `+91 97${Math.floor(10000000 + Math.random() * 90000000)}`,
            departmentId: deptDocs['HRD']._id,
            designation: 'People Partner Specialist',
            joiningDate: new Date(Date.now() - (120 + Math.floor(Math.random() * 300)) * 86400000),
            status: 'ACTIVE',
            reportingManagerId: managerMap['HRD']?._id || null,
            salary: 85000 + Math.floor(Math.random() * 25000),
            leaveBalances: { casual: 12, sick: 10, earned: 12, paid: 12, unpaid: 0, other: 5 },
          });
          user.employeeId = emp._id;
          await user.save();
        }
        createdEmployees.push(emp);
        codeCounter++;
      }

      // 36 Pure Employees
      for (let i = 0; i < 36; i++) {
        const deptCode = deptCodes[i % deptCodes.length];
        const fn = FIRST_NAMES[(i * 3) % FIRST_NAMES.length];
        const ln = LAST_NAMES[(i * 2) % LAST_NAMES.length];
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${codeCounter}@hrms.demo`;

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            email,
            password: defaultPassword,
            role: 'EMPLOYEE',
            isActive: true,
          });
        }

        const deptTitles = designationsByDept[deptCode].employees;
        const desig = deptTitles[i % deptTitles.length];

        let emp = await Employee.findOne({ userId: user._id });
        if (!emp) {
          emp = await Employee.create({
            userId: user._id,
            employeeCode: `EMP-${codeCounter}`,
            firstName: fn,
            lastName: ln,
            phone: `+91 96${Math.floor(10000000 + Math.random() * 90000000)}`,
            departmentId: deptDocs[deptCode]._id,
            designation: desig,
            joiningDate: new Date(Date.now() - (30 + (i * 12)) * 86400000),
            status: i === 34 ? 'PROBATION' : (i === 35 ? 'ON_LEAVE' : 'ACTIVE'),
            reportingManagerId: managerMap[deptCode]?._id || null,
            salary: 60000 + Math.floor(Math.random() * 50000),
            leaveBalances: { casual: 10, sick: 8, earned: 12, paid: 12, unpaid: 0, other: 5 },
          });
          user.employeeId = emp._id;
          await user.save();
        }
        createdEmployees.push(emp);
        codeCounter++;
      }

      logger.info(`✓ Successfully provisioned ${createdEmployees.length} personnel with users.`);
    } else {
      createdEmployees = await Employee.find({ status: { $ne: 'TERMINATED' } });
      logger.info(`Using existing ${createdEmployees.length} employee documents.`);
    }

    // 4. Create Review Cycles
    let activeCycle = await ReviewCycle.findOne({ status: 'ACTIVE' });
    if (!activeCycle) {
      const qStart = new Date();
      qStart.setMonth(qStart.getMonth() - 2);
      const qEnd = new Date();
      qEnd.setMonth(qEnd.getMonth() + 1);

      activeCycle = await ReviewCycle.create({
        title: 'Q3 2026 Executive Performance Review',
        cycleType: 'QUARTERLY',
        startDate: qStart,
        endDate: qEnd,
        status: 'ACTIVE',
        createdBy: adminUser ? adminUser._id : createdEmployees[0].userId,
        scorecardTemplate: [
          { criterion: 'Task Completion & Sprint Velocity', weight: 30, isSystemCalculated: true, metricType: 'TASK_COMPLETION_PCT' },
          { criterion: 'Attendance & Presence Punctuality', weight: 20, isSystemCalculated: true, metricType: 'ATTENDANCE_PCT' },
          { criterion: 'Quality of Technical Deliverables', weight: 20, isSystemCalculated: false },
          { criterion: 'Cross-functional Collaboration', weight: 15, isSystemCalculated: false },
          { criterion: 'Initiative & Continuous Learning', weight: 15, isSystemCalculated: false },
        ]
      });
      logger.info(`✓ Created Review Cycle: ${activeCycle.title}`);
    }

    // 5. Seed Performance Reviews for created employees
    const existingReviewsCount = await PerformanceReview.countDocuments({ cycleId: activeCycle._id });
    if (existingReviewsCount < createdEmployees.length) {
      logger.info('Generating weighted performance reviews for employees...');
      for (const emp of createdEmployees) {
        const existingRev = await PerformanceReview.findOne({ cycleId: activeCycle._id, employeeId: emp._id });
        if (existingRev) continue;

        // Generate score between 62 and 96
        const randSeed = Math.random();
        let finalScore, band, potRating, nineBox;
        if (randSeed > 0.75) {
          finalScore = Math.floor(90 + Math.random() * 8);
          band = 'OUTSTANDING';
          potRating = 3;
          nineBox = 'Star';
        } else if (randSeed > 0.40) {
          finalScore = Math.floor(76 + Math.random() * 13);
          band = 'EXCEEDS';
          potRating = 2;
          nineBox = 'High Performer';
        } else if (randSeed > 0.10) {
          finalScore = Math.floor(65 + Math.random() * 10);
          band = 'MEETS';
          potRating = 2;
          nineBox = 'Core Player';
        } else {
          finalScore = Math.floor(52 + Math.random() * 10);
          band = 'NEEDS_IMPROVEMENT';
          potRating = 1;
          nineBox = 'At Risk';
        }

        await PerformanceReview.create({
          cycleId: activeCycle._id,
          employeeId: emp._id,
          reviewerId: emp.reportingManagerId || emp._id,
          status: 'COMPLETED',
          finalScore,
          ratingBand: band,
          potentialRating: potRating,
          performanceRatingLevel: band === 'OUTSTANDING' ? 3 : (band === 'EXCEEDS' || band === 'MEETS' ? 2 : 1),
          nineBoxCategory: nineBox,
          scores: [
            { criterion: 'Task Completion & Sprint Velocity', weight: 30, systemValue: 92, rating: 4, weightedScore: 28 },
            { criterion: 'Attendance & Presence Punctuality', weight: 20, systemValue: 96, rating: 5, weightedScore: 19 },
            { criterion: 'Quality of Technical Deliverables', weight: 20, rating: band === 'OUTSTANDING' ? 5 : 4, weightedScore: 19 },
            { criterion: 'Cross-functional Collaboration', weight: 15, rating: 4, weightedScore: 14 },
            { criterion: 'Initiative & Continuous Learning', weight: 15, rating: 4, weightedScore: 14 },
          ],
          goals: [
            { title: 'Deliver core system milestones on time', progress: Math.min(100, Math.floor(finalScore * 1.05)) },
            { title: 'Maintain code coverage above 85%', progress: 90 },
            { title: 'Complete annual cloud security refresher', progress: 100 },
          ],
          managerComments: `Solid contributor in the team. Demonstrates consistent execution and team spirit.`,
          reviewedAt: new Date(),
        });
      }
      logger.info('✓ Seeded performance reviews with 9-box talent matrix.');
    }

    // 6. Seed 90 Days of Realistic Attendance Records
    const attCount = await Attendance.countDocuments();
    if (attCount < 500) {
      logger.info('Generating 90 days of daily workforce attendance...');
      const attendanceInserts = [];
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Loop over last 90 days
      for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
        const currentDate = new Date(now.getTime() - dayOffset * 86400000);
        // Skip weekends
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        // Sample a subset or all employees
        for (const emp of createdEmployees.slice(0, 40)) {
          const rand = Math.random();
          let status = 'PRESENT';
          let checkIn = new Date(currentDate);
          let checkOut = new Date(currentDate);
          let workHours = 8.5;
          let isLate = false;

          if (rand > 0.94) {
            status = 'ABSENT';
            checkIn = null;
            checkOut = null;
            workHours = 0;
          } else if (rand > 0.88) {
            status = 'ON_LEAVE';
            checkIn = null;
            checkOut = null;
            workHours = 0;
          } else {
            status = 'PRESENT';
            const lateProb = Math.random();
            if (lateProb > 0.85) {
              isLate = true;
              checkIn.setHours(9, 45 + Math.floor(Math.random() * 25), 0);
            } else {
              checkIn.setHours(9, Math.floor(Math.random() * 20), 0);
            }
            checkOut.setHours(17, 30 + Math.floor(Math.random() * 60), 0);
            workHours = parseFloat(((checkOut - checkIn) / 3600000).toFixed(2));
          }

          attendanceInserts.push({
            employee: emp._id,
            date: currentDate,
            status,
            checkIn,
            checkOut,
            workHours,
            isLate,
          });
        }
      }

      if (attendanceInserts.length > 0) {
        // Chunk inserts to avoid payload limitations
        const chunkSize = 500;
        for (let i = 0; i < attendanceInserts.length; i += chunkSize) {
          await Attendance.insertMany(attendanceInserts.slice(i, i + chunkSize), { ordered: false }).catch(() => {});
        }
        logger.info(`✓ Seeded ${attendanceInserts.length} daily attendance records across 90 days.`);
      }
    }

    // 7. Seed Tasks across departments
    const taskCount = await Task.countDocuments();
    if (taskCount < 40) {
      logger.info('Generating realistic tasks across departments...');
      const sampleTasks = [
        { title: 'Migrate MongoDB Aggregation Pipelines to dedicated analytics service', prio: 'HIGH', status: 'IN_PROGRESS', dept: 'ENG' },
        { title: 'Update Enterprise Dark/Light theme design tokens for Admin Cockpit', prio: 'URGENT', status: 'IN_PROGRESS', dept: 'ENG' },
        { title: 'Implement CSV bulk import parser for employee directory onboarding', prio: 'MEDIUM', status: 'TODO', dept: 'ENG' },
        { title: 'Conduct Q3 Talent & Performance Review Calibrations', prio: 'HIGH', status: 'TODO', dept: 'HRD' },
        { title: 'Finalize Health & Dental Benefits renewal package for 2027', prio: 'MEDIUM', status: 'COMPLETED', dept: 'HRD' },
        { title: 'Redesign Executive Command Center UX mockups & 9-Box grid', prio: 'HIGH', status: 'COMPLETED', dept: 'PRD' },
        { title: 'Review Q4 Enterprise Sales Targets & Incentive structure', prio: 'URGENT', status: 'IN_PROGRESS', dept: 'SLS' },
        { title: 'Audit Zendesk CSAT resolution times across Tier 2 support queues', prio: 'MEDIUM', status: 'TODO', dept: 'SUP' },
        { title: 'Q3 Financial audit reconciliation with external accountants', prio: 'HIGH', status: 'IN_PROGRESS', dept: 'OPS' },
        { title: 'Security compliance review: verify bcrypt salt factor and JWT claims', prio: 'URGENT', status: 'COMPLETED', dept: 'ENG' },
      ];

      for (let i = 0; i < 35; i++) {
        const template = sampleTasks[i % sampleTasks.length];
        const assignedEmp = createdEmployees[i % createdEmployees.length];
        const deptDoc = deptDocs[template.dept] || deptDocs['ENG'];

        // Randomize due date
        const dueOffset = (i % 5 === 0) ? -3 : (i * 2 + 1); // some overdue!
        const dueDate = new Date(Date.now() + dueOffset * 86400000);

        await Task.create({
          title: `${template.title} #${i + 1}`,
          description: `Deliverable assigned as part of departmental roadmap and operational sprints.`,
          assignedTo: assignedEmp._id,
          assignedBy: assignedEmp.reportingManagerId || assignedEmp._id,
          department: deptDoc._id,
          priority: template.prio,
          status: template.status,
          dueDate,
          estimatedHours: 12 + (i % 8) * 4,
          completedAt: template.status === 'COMPLETED' ? new Date() : null,
        }).catch(() => {});
      }
      logger.info('✓ Seeded realistic task backlog with in-progress, completed, and overdue items.');
    }

    // 8. Seed Leaves
    const leaveCount = await Leave.countDocuments();
    if (leaveCount < 25) {
      logger.info('Generating realistic leave requests...');
      const leaveTypes = ['CASUAL', 'SICK', 'EARNED', 'UNPAID'];
      for (let i = 0; i < 30; i++) {
        const emp = createdEmployees[i % createdEmployees.length];
        const lType = leaveTypes[i % leaveTypes.length];
        const status = (i < 6) ? 'PENDING' : (i < 24 ? 'APPROVED' : 'REJECTED');
        const days = 1 + (i % 4);

        const start = new Date(Date.now() + (i < 6 ? (i + 1) : -(i * 3)) * 86400000);
        const end = new Date(start.getTime() + (days - 1) * 86400000);

        await Leave.create({
          employee: emp._id,
          leaveType: lType,
          startDate: start,
          endDate: end,
          numberOfDays: days,
          reason: `Planned leave for personal and family commitments (${lType.toLowerCase()}).`,
          status,
          appliedAt: new Date(start.getTime() - 4 * 86400000),
          reviewedAt: status !== 'PENDING' ? new Date() : null,
          reviewedBy: emp.reportingManagerId || null,
        }).catch(() => {});
      }
      logger.info('✓ Seeded leave records across leave types and pending approvals queue.');
    }

    logger.info('🎉 Analytics Demo Seeding Finished Successfully!');
    await disconnectDB();
    process.exit(0);

  } catch (err) {
    logger.error(`❌ Seeder error: ${err.message}`);
    await disconnectDB();
    process.exit(1);
  }
};

seedAnalyticsDemo();
