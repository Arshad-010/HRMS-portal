import Leave, { calculateLeaveDays, normalizeToMidnightUTC } from '../models/Leave.js';
import Employee from '../models/Employee.js';
import {
  syncApprovedLeaveToAttendance,
  revertApprovedLeaveFromAttendance,
} from '../services/leaveAttendanceService.js';
import {
  notifyLeaveApplied,
  notifyLeaveApproved,
  notifyLeaveRejected,
  notifyLeaveCancelled,
} from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

/**
 * Maps leaveType enum string to Employee.leaveBalances key
 */
const getBalanceKey = (leaveType) => {
  switch (leaveType) {
    case 'CASUAL':
      return 'casual';
    case 'SICK':
      return 'sick';
    case 'EARNED':
      return 'earned';
    case 'OTHER':
      return 'other';
    case 'UNPAID':
    default:
      return null;
  }
};

/**
 * Apply for a leave
 * @route   POST /api/leaves
 * @access  Private (Authenticated Employees)
 */
export const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason, employeeId } = req.body;

    // 1. Determine target employee ID
    let targetEmployeeId = req.user.employeeId;
    if ((req.user.role === 'ADMIN' || req.user.role === 'HR') && employeeId) {
      targetEmployeeId = employeeId;
    }

    if (!targetEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to this account',
      });
    }

    // 2. Validate Employee existence and active status
    const employee = await Employee.findById(targetEmployeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    if (employee.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Leave application rejected: Employee status is currently ${employee.status}`,
      });
    }

    // 3. Validate required fields
    if (!leaveType || !startDate || !endDate || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Leave type, start date, end date, and reason are required',
      });
    }

    const validLeaveTypes = ['CASUAL', 'SICK', 'EARNED', 'UNPAID', 'OTHER'];
    if (!validLeaveTypes.includes(leaveType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid leave type. Supported types: ${validLeaveTypes.join(', ')}`,
      });
    }

    // 4. Validate Date sequence
    const normalizedStart = normalizeToMidnightUTC(startDate);
    const normalizedEnd = normalizeToMidnightUTC(endDate);

    if (isNaN(normalizedStart.getTime()) || isNaN(normalizedEnd.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date or end date format',
      });
    }

    if (normalizedEnd.getTime() < normalizedStart.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date',
      });
    }

    // 5. Calculate numberOfDays server-side (do not trust client)
    const numberOfDays = calculateLeaveDays(normalizedStart, normalizedEnd);
    if (numberOfDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Calculated leave duration must be at least 1 day',
      });
    }

    // 6. Check for overlapping active leaves (PENDING or APPROVED)
    const overlapping = await Leave.findOne({
      employee: employee._id,
      status: { $in: ['PENDING', 'APPROVED'] },
      startDate: { $lte: normalizedEnd },
      endDate: { $gte: normalizedStart },
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: `An active leave request (${overlapping.status}) already exists from ${overlapping.startDate
          .toISOString()
          .slice(0, 10)} to ${overlapping.endDate.toISOString().slice(0, 10)}`,
      });
    }

    // 7. Check leave balance availability (for paid leave types)
    const balanceKey = getBalanceKey(leaveType);
    if (balanceKey) {
      const availableBalance = employee.leaveBalances?.[balanceKey] ?? 0;
      if (availableBalance < numberOfDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} leave balance. Available: ${availableBalance} days, Requested: ${numberOfDays} days`,
        });
      }
    }

    // 8. Create Leave Record
    const leave = new Leave({
      employee: employee._id,
      leaveType,
      startDate: normalizedStart,
      endDate: normalizedEnd,
      numberOfDays,
      reason: reason.trim(),
      status: 'PENDING',
      appliedAt: new Date(),
    });

    await leave.save();

    // Trigger Notification and Activity Logging
    await notifyLeaveApplied(leave, employee);
    await logActivity({
      actor: req.user._id,
      action: 'LEAVE_APPLIED',
      entityType: 'LEAVE',
      entityId: leave._id,
      description: `${employee.firstName} ${employee.lastName} applied for ${leave.numberOfDays} day(s) of ${leave.leaveType} leave`,
      metadata: {
        leaveType: leave.leaveType,
        numberOfDays: leave.numberOfDays,
        startDate: leave.startDate,
        endDate: leave.endDate,
      },
    });

    await leave.populate({
      path: 'employee',
      select: 'firstName lastName employeeCode designation departmentId',
      populate: { path: 'departmentId', select: 'name code' },
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current employee's leaves, statistics, and balances
 * @route   GET /api/leaves/my
 * @access  Private (Authenticated Employee)
 */
export const getMyLeaves = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to this account',
      });
    }

    const { status, leaveType, year, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query = { employee: req.user.employeeId };

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (year) {
      const startOfYear = new Date(Date.UTC(parseInt(year, 10), 0, 1));
      const endOfYear = new Date(Date.UTC(parseInt(year, 10), 11, 31, 23, 59, 59));
      query.startDate = { $gte: startOfYear, $lte: endOfYear };
    }

    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate('reviewedBy', 'firstName lastName employeeCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Compute user stats
    const allUserLeaves = await Leave.find({ employee: req.user.employeeId });
    const pendingCount = allUserLeaves.filter((l) => l.status === 'PENDING').length;
    const approvedCount = allUserLeaves.filter((l) => l.status === 'APPROVED').length;
    const rejectedCount = allUserLeaves.filter((l) => l.status === 'REJECTED').length;
    const cancelledCount = allUserLeaves.filter((l) => l.status === 'CANCELLED').length;
    const approvedDays = allUserLeaves
      .filter((l) => l.status === 'APPROVED')
      .reduce((sum, l) => sum + (l.numberOfDays || 0), 0);

    const employee = await Employee.findById(req.user.employeeId).select('leaveBalances');

    res.status(200).json({
      success: true,
      data: {
        leaves,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        stats: {
          pendingCount,
          approvedCount,
          rejectedCount,
          cancelledCount,
          approvedDays,
        },
        balances: employee?.leaveBalances || {
          casual: 12,
          sick: 10,
          earned: 12,
          paid: 12,
          unpaid: 0,
          other: 5,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get leave balance for current user or specific employee
 * @route   GET /api/leaves/balance
 * @route   GET /api/leaves/balance/:employeeId
 * @access  Private
 */
export const getLeaveBalance = async (req, res, next) => {
  try {
    let targetEmployeeId = req.params.employeeId || req.user.employeeId;

    if (!targetEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee ID provided or associated with account',
      });
    }

    // RBAC check if querying another employee
    if (req.params.employeeId && req.params.employeeId.toString() !== req.user.employeeId?.toString()) {
      if (req.user.role === 'EMPLOYEE') {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view another employee leave balance',
        });
      }

      if (req.user.role === 'MANAGER') {
        const isTeamMember = await Employee.exists({
          _id: req.params.employeeId,
          $or: [{ reportingManagerId: req.user.employeeId }, { _id: req.user.employeeId }],
        });
        if (!isTeamMember) {
          return res.status(403).json({
            success: false,
            message: 'Managers can only view balances of direct reporting team members',
          });
        }
      }
    }

    const employee = await Employee.findById(targetEmployeeId).select('firstName lastName employeeCode leaveBalances');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Calculate used leaves in the current year
    const currentYear = new Date().getUTCFullYear();
    const startYear = new Date(Date.UTC(currentYear, 0, 1));
    const endYear = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));

    const approvedLeaves = await Leave.find({
      employee: employee._id,
      status: 'APPROVED',
      startDate: { $gte: startYear, $lte: endYear },
    });

    const used = {
      casual: 0,
      sick: 0,
      earned: 0,
      other: 0,
      unpaid: 0,
    };

    approvedLeaves.forEach((l) => {
      const key = getBalanceKey(l.leaveType);
      if (key && used[key] !== undefined) {
        used[key] += l.numberOfDays || 0;
      } else if (l.leaveType === 'UNPAID') {
        used.unpaid += l.numberOfDays || 0;
      }
    });

    const balances = employee.leaveBalances || {
      casual: 12,
      sick: 10,
      earned: 12,
      other: 5,
      unpaid: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        employee: {
          _id: employee._id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          employeeCode: employee.employeeCode,
        },
        balances,
        used,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get leave records with multi-filter and RBAC scoping
 * @route   GET /api/leaves
 * @access  Private (RBAC Scoped)
 */
export const getLeaves = async (req, res, next) => {
  try {
    const pageNum = parseInt(req.query.page, 10) || 1;
    const limitNum = parseInt(req.query.limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const { employee, department, status, leaveType, startDate, endDate } = req.query;

    const query = {};

    // 1. RBAC Scoping
    if (req.user.role === 'EMPLOYEE') {
      query.employee = req.user.employeeId;
    } else if (req.user.role === 'MANAGER') {
      const teamEmployees = await Employee.find({
        $or: [{ reportingManagerId: req.user.employeeId }, { _id: req.user.employeeId }],
      }).select('_id');
      const teamIds = teamEmployees.map((e) => e._id);
      query.employee = { $in: teamIds };
    }

    // 2. Specific employee filter
    if (employee) {
      if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
        query.employee = employee;
      } else if (req.user.role === 'MANAGER') {
        const isTeamMember = await Employee.exists({
          _id: employee,
          $or: [{ reportingManagerId: req.user.employeeId }, { _id: req.user.employeeId }],
        });
        if (isTeamMember) {
          query.employee = employee;
        } else {
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to view this employee leaves',
          });
        }
      }
    }

    // 3. Department filter
    if (department) {
      const deptEmployees = await Employee.find({ departmentId: department }).select('_id');
      const deptEmpIds = deptEmployees.map((e) => e._id.toString());

      if (!query.employee) {
        query.employee = { $in: deptEmpIds };
      } else if (query.employee.$in) {
        const intersection = query.employee.$in.filter((id) => deptEmpIds.includes(id.toString()));
        query.employee = { $in: intersection };
      } else {
        if (!deptEmpIds.includes(query.employee.toString())) {
          query.employee = { $in: [] };
        }
      }
    }

    // 4. Status filter
    if (status) {
      query.status = status;
    }

    // 5. Leave Type filter
    if (leaveType) {
      query.leaveType = leaveType;
    }

    // 6. Date Range filter
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = normalizeToMidnightUTC(startDate);
      if (endDate) query.startDate.$lte = normalizeToMidnightUTC(endDate);
    }

    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeCode designation departmentId reportingManagerId',
        populate: { path: 'departmentId', select: 'name code' },
      })
      .populate('reviewedBy', 'firstName lastName employeeCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: {
        leaves,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get leave record by ID
 * @route   GET /api/leaves/:id
 * @access  Private (Owner, Manager, Admin, HR)
 */
export const getLeaveById = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeCode designation departmentId reportingManagerId',
        populate: { path: 'departmentId', select: 'name code' },
      })
      .populate('reviewedBy', 'firstName lastName employeeCode');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave record not found',
      });
    }

    // Authorization verification
    const isOwner = req.user.employeeId?.toString() === leave.employee._id.toString();
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';
    const isManager =
      req.user.role === 'MANAGER' &&
      leave.employee.reportingManagerId?.toString() === req.user.employeeId?.toString();

    if (!isOwner && !isPrivileged && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this leave record',
      });
    }

    res.status(200).json({
      success: true,
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a leave request
 * @route   PATCH /api/leaves/:id/approve
 * @access  Private (ADMIN, HR, MANAGER for direct reports)
 */
export const approveLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id).populate('employee');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (leave.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is already approved',
      });
    }

    if (leave.status === 'CANCELLED' || leave.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a leave request that is already ${leave.status}`,
      });
    }

    // Reviewer RBAC checks
    if (req.user.role === 'EMPLOYEE') {
      return res.status(403).json({
        success: false,
        message: 'Employees are not authorized to approve leave requests',
      });
    }

    if (req.user.role === 'MANAGER') {
      const isDirectReport =
        leave.employee.reportingManagerId?.toString() === req.user.employeeId?.toString();
      if (!isDirectReport) {
        return res.status(403).json({
          success: false,
          message: 'Managers can only approve leave requests for their direct reporting employees',
        });
      }
    }

    // Atomic leave balance deduction for paid leave types
    const balanceKey = getBalanceKey(leave.leaveType);
    if (balanceKey) {
      const balanceField = `leaveBalances.${balanceKey}`;
      const updateQuery = {
        _id: leave.employee._id,
        [balanceField]: { $gte: leave.numberOfDays },
      };

      const updateOp = {
        $inc: { [balanceField]: -leave.numberOfDays },
      };

      // Keep 'paid' field in sync if 'earned'
      if (balanceKey === 'earned') {
        updateOp.$inc['leaveBalances.paid'] = -leave.numberOfDays;
      }

      const updatedEmployee = await Employee.findOneAndUpdate(updateQuery, updateOp, { new: true });

      if (!updatedEmployee) {
        return res.status(400).json({
          success: false,
          message: `Insufficient leave balance to approve this request (available balance is less than ${leave.numberOfDays} days)`,
        });
      }
    }

    // Update leave record status
    leave.status = 'APPROVED';
    leave.reviewedAt = new Date();
    leave.reviewedBy = req.user.employeeId;
    leave.reviewerComment = req.body.reviewerComment || req.body.comment || '';

    await leave.save();

    // Trigger Notification & Activity Log
    await notifyLeaveApproved(leave, req.user.role);
    await logActivity({
      actor: req.user._id,
      action: 'LEAVE_APPROVED',
      entityType: 'LEAVE',
      entityId: leave._id,
      description: `Leave request for ${leave.numberOfDays} day(s) was approved`,
      metadata: {
        leaveType: leave.leaveType,
        numberOfDays: leave.numberOfDays,
        reviewerComment: leave.reviewerComment,
      },
    });

    // Sync to Attendance records (mark as ON_LEAVE)
    await syncApprovedLeaveToAttendance(leave);

    await leave.populate({
      path: 'employee',
      select: 'firstName lastName employeeCode designation departmentId leaveBalances',
    });

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a leave request
 * @route   PATCH /api/leaves/:id/reject
 * @access  Private (ADMIN, HR, MANAGER for direct reports)
 */
export const rejectLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id).populate('employee');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (leave.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is already rejected',
      });
    }

    if (leave.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject an already cancelled leave request',
      });
    }

    // Reviewer RBAC checks
    if (req.user.role === 'EMPLOYEE') {
      return res.status(403).json({
        success: false,
        message: 'Employees are not authorized to reject leave requests',
      });
    }

    if (req.user.role === 'MANAGER') {
      const isDirectReport =
        leave.employee.reportingManagerId?.toString() === req.user.employeeId?.toString();
      if (!isDirectReport) {
        return res.status(403).json({
          success: false,
          message: 'Managers can only reject leave requests for their direct reporting employees',
        });
      }
    }

    // If previously approved, restore balance and revert attendance
    if (leave.status === 'APPROVED') {
      const balanceKey = getBalanceKey(leave.leaveType);
      if (balanceKey) {
        const balanceField = `leaveBalances.${balanceKey}`;
        const updateOp = {
          $inc: { [balanceField]: leave.numberOfDays },
        };
        if (balanceKey === 'earned') {
          updateOp.$inc['leaveBalances.paid'] = leave.numberOfDays;
        }
        await Employee.findByIdAndUpdate(leave.employee._id, updateOp);
      }
      await revertApprovedLeaveFromAttendance(leave);
    }

    leave.status = 'REJECTED';
    leave.reviewedAt = new Date();
    leave.reviewedBy = req.user.employeeId;
    leave.reviewerComment = req.body.reviewerComment || req.body.comment || '';

    await leave.save();

    // Trigger Notification & Activity Log
    await notifyLeaveRejected(leave, req.user.role, leave.reviewerComment);
    await logActivity({
      actor: req.user._id,
      action: 'LEAVE_REJECTED',
      entityType: 'LEAVE',
      entityId: leave._id,
      description: `Leave request for ${leave.numberOfDays} day(s) was rejected`,
      metadata: {
        leaveType: leave.leaveType,
        numberOfDays: leave.numberOfDays,
        reviewerComment: leave.reviewerComment,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Leave request rejected',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a leave request
 * @route   POST /api/leaves/:id/cancel
 * @access  Private (Owner, Admin, HR)
 */
export const cancelLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    // RBAC: Owner, ADMIN, or HR
    const isOwner = req.user.employeeId?.toString() === leave.employee.toString();
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this leave request',
      });
    }

    if (leave.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is already cancelled',
      });
    }

    if (leave.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an already rejected leave request',
      });
    }

    // If previously approved, restore the deducted leave balance & remove attendance marks
    if (leave.status === 'APPROVED') {
      const balanceKey = getBalanceKey(leave.leaveType);
      if (balanceKey) {
        const balanceField = `leaveBalances.${balanceKey}`;
        const updateOp = {
          $inc: { [balanceField]: leave.numberOfDays },
        };
        if (balanceKey === 'earned') {
          updateOp.$inc['leaveBalances.paid'] = leave.numberOfDays;
        }
        await Employee.findByIdAndUpdate(leave.employee, updateOp);
      }
      await revertApprovedLeaveFromAttendance(leave);
    }

    leave.status = 'CANCELLED';
    await leave.save();

    // Trigger Notification & Activity Log
    await notifyLeaveCancelled(leave, 'Employee');
    await logActivity({
      actor: req.user._id,
      action: 'LEAVE_CANCELLED',
      entityType: 'LEAVE',
      entityId: leave._id,
      description: `Leave request for ${leave.numberOfDays} day(s) was cancelled`,
      metadata: {
        leaveType: leave.leaveType,
        numberOfDays: leave.numberOfDays,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a pending leave request
 * @route   PUT /api/leaves/:id
 * @access  Private (Owner or Admin/HR while still PENDING)
 */
export const updateLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    const isOwner = req.user.employeeId?.toString() === leave.employee.toString();
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this leave request',
      });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Only PENDING leave requests can be modified. Current status: ${leave.status}`,
      });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    if (startDate || endDate) {
      const newStart = startDate ? normalizeToMidnightUTC(startDate) : leave.startDate;
      const newEnd = endDate ? normalizeToMidnightUTC(endDate) : leave.endDate;

      if (newEnd.getTime() < newStart.getTime()) {
        return res.status(400).json({
          success: false,
          message: 'End date cannot be earlier than start date',
        });
      }

      // Check overlap excluding this leave
      const overlapping = await Leave.findOne({
        _id: { $ne: leave._id },
        employee: leave.employee,
        status: { $in: ['PENDING', 'APPROVED'] },
        startDate: { $lte: newEnd },
        endDate: { $gte: newStart },
      });

      if (overlapping) {
        return res.status(400).json({
          success: false,
          message: `An active leave request (${overlapping.status}) already exists covering this period`,
        });
      }

      leave.startDate = newStart;
      leave.endDate = newEnd;
      leave.numberOfDays = calculateLeaveDays(newStart, newEnd);
    }

    if (leaveType) {
      const validLeaveTypes = ['CASUAL', 'SICK', 'EARNED', 'UNPAID', 'OTHER'];
      if (!validLeaveTypes.includes(leaveType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid leave type',
        });
      }
      leave.leaveType = leaveType;
    }

    if (reason !== undefined) {
      leave.reason = reason.trim();
    }

    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave request updated successfully',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a leave record
 * @route   DELETE /api/leaves/:id
 * @access  Private (ADMIN only, or Owner while still PENDING)
 */
export const deleteLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    const isOwner = req.user.employeeId?.toString() === leave.employee.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isAdmin && (!isOwner || leave.status !== 'PENDING')) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete processed leave records',
      });
    }

    // If approved, restore balance & attendance before removing
    if (leave.status === 'APPROVED') {
      const balanceKey = getBalanceKey(leave.leaveType);
      if (balanceKey) {
        const balanceField = `leaveBalances.${balanceKey}`;
        const updateOp = {
          $inc: { [balanceField]: leave.numberOfDays },
        };
        if (balanceKey === 'earned') {
          updateOp.$inc['leaveBalances.paid'] = leave.numberOfDays;
        }
        await Employee.findByIdAndUpdate(leave.employee, updateOp);
      }
      await revertApprovedLeaveFromAttendance(leave);
    }

    await Leave.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Leave record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
