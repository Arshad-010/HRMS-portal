import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Department from '../models/Department.js';

const departmentsToSeed = [
  {
    name: 'Engineering & Development',
    code: 'ENG',
    description: 'Software development, application engineering and technical implementation.'
  },
  {
    name: 'Quality Assurance (QA)',
    code: 'QA',
    description: 'Software testing, quality assurance and automation.'
  },
  {
    name: 'Human Resources (HR)',
    code: 'HR',
    description: 'Recruitment, onboarding and employee relations.'
  },
  {
    name: 'Finance & Accounting',
    code: 'FIN',
    description: 'Payroll, budgeting and financial management.'
  },
  {
    name: 'Sales & Marketing',
    code: 'MKT',
    description: 'Sales, marketing campaigns and business development.'
  },
  {
    name: 'IT & Infrastructure',
    code: 'IT',
    description: 'IT support, systems, networks and infrastructure.'
  },
  {
    name: 'Product Management',
    code: 'PROD',
    description: 'Product planning, requirements and roadmap coordination.'
  },
  {
    name: 'Operations & Administration',
    code: 'OPS',
    description: 'Business operations and administrative activities.'
  },
  {
    name: 'Customer Support',
    code: 'CS',
    description: 'Customer assistance and issue resolution.'
  },
  {
    name: 'Research & Development (R&D)',
    code: 'RND',
    description: 'Research, experimentation and technology innovation.'
  }
];

const seedDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let inserted = 0;
    let existing = 0;

    for (const dept of departmentsToSeed) {
      // Check if a department with the same code or same name (case-insensitive) exists
      const existingDept = await Department.findOne({
        $or: [
          { code: dept.code },
          { name: { $regex: new RegExp(`^${dept.name.trim()}$`, 'i') } }
        ]
      });

      if (!existingDept) {
        await Department.create(dept);
        console.log(`[CREATED] Department: ${dept.name}`);
        inserted++;
      } else {
        console.log(`[SKIPPED] Department already exists: ${existingDept.name}`);
        existing++;
      }
    }

    console.log(`\nSeed completed. Inserted: ${inserted}, Existing/Skipped: ${existing}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding departments:', error);
    process.exit(1);
  }
};

seedDepartments();
