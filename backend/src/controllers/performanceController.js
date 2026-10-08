import PerformanceReview from '../models/PerformanceReview.js';
import ReviewCycle from '../models/ReviewCycle.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Attendance from '../models/Attendance.js';
import Task from '../models/Task.js';

/**
 * GET /api/performance/cycles
 */
export const getReviewCycles = async (req, res) => {
  try {
    const cycles = await ReviewCycle.find().sort({ startDate: -1 });
    res.json({ success: true, data: cycles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/performance/cycles
 */
export const createReviewCycle = async (req, res) => {
  try {
    const { title, cycleType, startDate, endDate, scorecardTemplate } = req.body;
    const cycle = await ReviewCycle.create({
      title,
      cycleType,
      startDate,
      endDate,
      scorecardTemplate: scorecardTemplate || [
        { criterion: 'Task Completion & Delivery', weight: 30, isSystemCalculated: true, metricType: 'TASK_COMPLETION_PCT' },
        { criterion: 'Attendance & Punctuality', weight: 20, isSystemCalculated: true, metricType: 'ATTENDANCE_PCT' },
        { criterion: 'Quality of Work & Output', weight: 20, isSystemCalculated: false },
        { criterion: 'Teamwork & Collaboration', weight: 15, isSystemCalculated: false },
        { criterion: 'Leadership & Initiative', weight: 15, isSystemCalculated: false },
      ],
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: cycle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/performance/overview
 * 9-box grid, company-wide score trend, top performers, at-risk list
 */
export const getPerformanceOverview = async (req, res) => {
  try {
    const role = req.user.role;
    const empId = req.user.employeeId;

    let reviewMatch = {};
    if (role === 'EMPLOYEE') {
      reviewMatch = { employeeId: empId };
    } else if (role === 'MANAGER') {
      const team = await Employee.find({ reportingManagerId: empId }).select('_id');
      const teamIds = team.map(t => t._id);
      teamIds.push(empId);
      reviewMatch = { employeeId: { $in: teamIds } };
    }

    const reviews = await PerformanceReview.find(reviewMatch)
      .populate({
        path: 'employeeId',
        select: 'firstName lastName employeeCode designation departmentId profilePicture',
        populate: { path: 'departmentId', select: 'name code' }
      })
      .populate('cycleId', 'title cycleType')
      .sort({ finalScore: -1 });

    // 9-Box Grid matrix distribution
    // 3x3: Potential (Low 1, Med 2, High 3) vs Performance (Low 1, Med 2, High 3)
    const nineBox = {
      '3-3': { name: 'Star', count: 0, employees: [] },
      '3-2': { name: 'High Potential', count: 0, employees: [] },
      '3-1': { name: 'Enigma / Inconsistent', count: 0, employees: [] },
      '2-3': { name: 'High Performer', count: 0, employees: [] },
      '2-2': { name: 'Core Player', count: 0, employees: [] },
      '2-1': { name: 'Dilemma', count: 0, employees: [] },
      '1-3': { name: 'Solid Professional', count: 0, employees: [] },
      '1-2': { name: 'Effective', count: 0, employees: [] },
      '1-1': { name: 'At Risk', count: 0, employees: [] },
    };

    const atRisk = [];
    const topPerformers = [];

    reviews.forEach(r => {
      if (!r.employeeId) return;
      const perfLvl = r.finalScore >= 85 ? 3 : r.finalScore >= 70 ? 2 : 1;
      const potLvl = r.potentialRating || 2;
      const key = `${potLvl}-${perfLvl}`;

      const empSummary = {
        id: r.employeeId._id,
        name: `${r.employeeId.firstName} ${r.employeeId.lastName}`,
        code: r.employeeId.employeeCode,
        department: r.employeeId.departmentId?.name || 'General',
        designation: r.employeeId.designation,
        score: r.finalScore,
        band: r.ratingBand,
      };

      if (nineBox[key]) {
        nineBox[key].count += 1;
        if (nineBox[key].employees.length < 5) {
          nineBox[key].employees.push(empSummary);
        }
      }

      if (r.finalScore < 65 || (perfLvl === 1 && potLvl === 1)) {
        atRisk.push(empSummary);
      }
      if (r.finalScore >= 88) {
        topPerformers.push(empSummary);
      }
    });

    const avgScore = reviews.length > 0
      ? Math.round(reviews.reduce((acc, r) => acc + (r.finalScore || 0), 0) / reviews.length)
      : 80;

    res.json({
      success: true,
      data: {
        totalEvaluations: reviews.length,
        averageScore: avgScore,
        nineBoxGrid: nineBox,
        atRiskEmployees: atRisk.slice(0, 6),
        topPerformers: topPerformers.slice(0, 6),
        recentReviews: reviews.slice(0, 10),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/performance/reviews
 */
export const getReviews = async (req, res) => {
  try {
    const { cycleId, employeeId } = req.query;
    const filter = {};
    if (cycleId) filter.cycleId = cycleId;
    if (employeeId) filter.employeeId = employeeId;

    const reviews = await PerformanceReview.find(filter)
      .populate('employeeId', 'firstName lastName employeeCode designation departmentId')
      .populate('reviewerId', 'firstName lastName')
      .populate('cycleId', 'title')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/performance/reviews/:id
 */
export const updateReview = async (req, res) => {
  try {
    const { scores, finalScore, ratingBand, managerComments, selfComments, hrComments, status } = req.body;
    
    const review = await PerformanceReview.findByIdAndUpdate(
      req.params.id,
      {
        ...(scores && { scores }),
        ...(finalScore !== undefined && { finalScore }),
        ...(ratingBand && { ratingBand }),
        ...(managerComments && { managerComments }),
        ...(selfComments && { selfComments }),
        ...(hrComments && { hrComments }),
        ...(status && { status }),
        reviewedAt: new Date(),
      },
      { new: true }
    );

    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
