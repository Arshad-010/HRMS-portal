import Attendance, { normalizeToMidnightUTC } from '../models/Attendance.js';
import Employee from '../models/Employee.js';

/**
 * Check-in for current working day
 * @route   POST /api/attendance/check-in
 * @access  Private (Employee self-service)
 */
export const checkIn = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee record associated with this account',
      });
    }

    const employee = await Employee.findById(req.user.employeeId);
    if (!employee || employee.status === 'TERMINATED') {
      return res.status(403).json({
        success: false,
        message: 'Inactive or terminated employees cannot check in',
      });
    }

    const today = normalizeToMidnightUTC(new Date());

    // Check for existing record on today's date
    let record = await Attendance.findOne({
      employee: employee._id,
      date: today,
    });

    if (record && record.checkIn) {
      return res.status(400).json({
        success: false,
        message: `You have already checked in today at ${new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        data: record,
      });
    }

    const now = new Date();

    if (record) {
      // Record was pre-created (e.g. marked absent or placeholder)
      record.checkIn = now;
      record.status = 'PRESENT';
      if (req.body.remarks) record.remarks = req.body.remarks;
      await record.save();
    } else {
      record = await Attendance.create({
        employee: employee._id,
        date: today,
        checkIn: now,
        status: 'PRESENT',
        remarks: req.body.remarks || '',
      });
    }

    await record.populate('employee', 'firstName lastName employeeCode designation departmentId');

    res.status(201).json({
      success: true,
      message: 'Check-in recorded successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check-out for current working day
 * @route   POST /api/attendance/check-out
 * @access  Private (Employee self-service)
 */
export const checkOut = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee record associated with this account',
      });
    }

    const today = normalizeToMidnightUTC(new Date());

    const record = await Attendance.findOne({
      employee: req.user.employeeId,
      date: today,
    });

    if (!record || !record.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You have not checked in for today yet. Check-in is required before checkout.',
      });
    }

    if (record.checkOut) {
      return res.status(400).json({
        success: false,
        message: `You have already checked out today at ${new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        data: record,
      });
    }

    const now = new Date();
    record.checkOut = now;
    if (req.body.remarks) {
      record.remarks = record.remarks ? `${record.remarks} | ${req.body.remarks}` : req.body.remarks;
    }

    // Automatically calculate work hours from checkIn to checkOut
    record.calculateWorkHours();
    await record.save();

    await record.populate('employee', 'firstName lastName employeeCode designation departmentId');

    res.status(200).json({
      success: true,
      message: `Check-out recorded successfully. Total work duration: ${record.workHours} hours.`,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get logged-in user's personal attendance records & today's status
 * @route   GET /api/attendance/my
 * @access  Private (Employee self-service)
 */
export const getMyAttendance = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee record linked to this account',
      });
    }

    const { startDate, endDate, month, year } = req.query;
    const query = { employee: req.user.employeeId };

    if (startDate && endDate) {
      query.date = {
        $gte: normalizeToMidnightUTC(new Date(startDate)),
        $lte: normalizeToMidnightUTC(new Date(endDate)),
      };
    } else if (month && year) {
      const start = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, 1));
      const end = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10), 0));
      query.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query).sort({ date: -1 }).limit(60);

    // Also get today's record specifically for self-service status badge
    const today = normalizeToMidnightUTC(new Date());
    const todayRecord = await Attendance.findOne({
      employee: req.user.employeeId,
      date: today,
    });

    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const halfDayCount = records.filter((r) => r.status === 'HALF_DAY').length;
    const onLeaveCount = records.filter((r) => r.status === 'ON_LEAVE').length;
    const absentCount = records.filter((r) => r.status === 'ABSENT').length;
    const totalHours = records.reduce((acc, r) => acc + (r.workHours || 0), 0);
    const avgHours = records.length > 0 ? parseFloat((totalHours / (presentCount + halfDayCount || 1)).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        todayRecord,
        records,
        attendance: records,
        stats: {
          presentDays: presentCount,
          halfDays: halfDayCount,
          onLeaveDays: onLeaveCount,
          absentDays: absentCount,
          totalWorkHours: parseFloat(totalHours.toFixed(2)),
          avgWorkHours: avgHours,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get company / department attendance summary metrics
 * @route   GET /api/attendance/summary
 * @access  Private (All Roles - scoped)
 */
export const getAttendanceSummary = async (req, res, next) => {
  try {
    const today = normalizeToMidnightUTC(new Date());
    let employeeFilter = { status: { $ne: 'TERMINATED' } };

    // If Manager, filter by team
    if (req.user.role === 'MANAGER' && req.user.employeeId) {
      employeeFilter = {
        $or: [{ reportingManagerId: req.user.employeeId }, { _id: req.user.employeeId }],
        status: { $ne: 'TERMINATED' },
      };
    } else if (req.user.role === 'EMPLOYEE' && req.user.employeeId) {
      employeeFilter = { _id: req.user.employeeId };
    }

    const targetEmployees = await Employee.find(employeeFilter).select('_id');
    const targetIds = targetEmployees.map((e) => e._id);

    const totalHeadcount = targetIds.length;
    const todayRecords = await Attendance.find({
      employee: { $in: targetIds },
      date: today,
    });

    const presentCount = todayRecords.filter((r) => r.status === 'PRESENT').length;
    const halfDayCount = todayRecords.filter((r) => r.status === 'HALF_DAY').length;
    const onLeaveCount = todayRecords.filter((r) => r.status === 'ON_LEAVE').length;
    const absentCount = totalHeadcount - (presentCount + halfDayCount + onLeaveCount);

    const totalWorkHours = todayRecords.reduce((acc, r) => acc + (r.workHours || 0), 0);
    const avgWorkHours = todayRecords.length > 0 ? Number((totalWorkHours / todayRecords.length).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalHeadcount,
        present: presentCount,
        halfDay: halfDayCount,
        onLeave: onLeaveCount,
        absent: Math.max(0, absentCount),
        avgWorkHours,
        recordsToday: todayRecords.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List attendance records with date range, department, employee, and status filters
 * @route   GET /api/attendance
 * @access  Private (RBAC Scoped)
 */
export const getAttendance = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const {
      date,
      startDate,
      endDate,
      employee,
      department,
      status,
    } = req.query;

    const query = {};

    // 1. RBAC Data Scope Restrictions
    if (req.user.role === 'EMPLOYEE') {
      // Employees can strictly view only their own records
      query.employee = req.user.employeeId;
    } else if (req.user.role === 'MANAGER') {
      // Managers can view direct reports plus themselves
      const teamEmployees = await Employee.find({
        $or: [{ reportingManagerId: req.user.employeeId }, { _id: req.user.employeeId }],
      }).select('_id');
      const teamIds = teamEmployees.map((e) => e._id);
      query.employee = { $in: teamIds };
    }

    // 2. Specific employee filter (if requested and allowed)
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
            message: 'You are not authorized to view this employee attendance',
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

    // 4. Date filtering
    if (date) {
      query.date = normalizeToMidnightUTC(new Date(date));
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeToMidnightUTC(new Date(startDate));
      if (endDate) query.date.$lte = normalizeToMidnightUTC(new Date(endDate));
    }

    // 5. Status filter (supports exact enum or prefix like PRE)
    if (status) {
      query.status = new RegExp(`^${status}`, 'i');
    }

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeCode designation departmentId',
        populate: { path: 'departmentId', select: 'name code' },
      })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        records,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendance record by ID
 * @route   GET /api/attendance/:id
 * @access  Private (RBAC Scoped)
 */
export const getAttendanceById = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id).populate({
      path: 'employee',
      select: 'firstName lastName employeeCode designation departmentId reportingManagerId',
      populate: { path: 'departmentId', select: 'name code' },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    // RBAC check
    const isOwner = req.user.employeeId?.toString() === record.employee._id.toString();
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';
    const isManager =
      req.user.role === 'MANAGER' &&
      record.employee.reportingManagerId?.toString() === req.user.employeeId?.toString();

    if (!isOwner && !isPrivileged && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this attendance record',
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually create attendance entry
 * @route   POST /api/attendance
 * @access  Private (ADMIN, HR, MANAGER for direct reports)
 */
export const createAttendance = async (req, res, next) => {
  try {
    const targetEmployeeId = req.body.employeeId || req.body.employee;
    const { date, checkIn, checkOut, status = 'PRESENT', remarks } = req.body;

    if (!targetEmployeeId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and date are required',
      });
    }

    const employee = await Employee.findById(targetEmployeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Manager scope validation
    if (req.user.role === 'MANAGER') {
      if (employee.reportingManagerId?.toString() !== req.user.employeeId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Managers can only log attendance for their direct reporting employees',
        });
      }
    }

    const normalizedDate = normalizeToMidnightUTC(new Date(date));

    // Check duplicate record
    const existing = await Attendance.findOne({
      employee: employee._id,
      date: normalizedDate,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `An attendance record already exists for ${employee.firstName} ${employee.lastName} on ${normalizedDate.toISOString().slice(0, 10)}`,
      });
    }

    const record = new Attendance({
      employee: employee._id,
      date: normalizedDate,
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      status,
      remarks: remarks?.trim() || '',
    });

    record.calculateWorkHours();
    await record.save();

    await record.populate({
      path: 'employee',
      select: 'firstName lastName employeeCode designation departmentId',
      populate: { path: 'departmentId', select: 'name code' },
    });

    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Modify attendance record
 * @route   PUT /api/attendance/:id
 * @access  Private (ADMIN, HR, MANAGER for direct reports)
 */
export const updateAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id).populate('employee');
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    // Role check: EMPLOYEE cannot modify; MANAGER can only modify direct reports
    if (req.user.role === 'EMPLOYEE') {
      return res.status(403).json({
        success: false,
        message: 'Employees are not authorized to modify attendance records',
      });
    }

    if (req.user.role === 'MANAGER') {
      if (record.employee.reportingManagerId?.toString() !== req.user.employeeId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Managers can only modify attendance for their direct reports',
        });
      }
    }

    const { checkIn, checkOut, status, remarks } = req.body;

    if (checkIn !== undefined) record.checkIn = checkIn ? new Date(checkIn) : null;
    if (checkOut !== undefined) record.checkOut = checkOut ? new Date(checkOut) : null;
    if (status) record.status = status;
    if (remarks !== undefined) record.remarks = remarks.trim();

    // Recalculate work hours on server
    record.calculateWorkHours();
    await record.save();

    await record.populate({
      path: 'employee',
      select: 'firstName lastName employeeCode designation departmentId',
      populate: { path: 'departmentId', select: 'name code' },
    });

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete attendance record
 * @route   DELETE /api/attendance/:id
 * @access  Private (ADMIN only)
 */
export const deleteAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    await record.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * View specific employee's attendance
 * @route   GET /api/attendance/employee/:employeeId
 * @access  Private (ADMIN, HR, MANAGER for direct reports, or Self)
 */
export const getEmployeeAttendance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const isSelf = req.user.employeeId?.toString() === employeeId;
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';
    const isManager =
      req.user.role === 'MANAGER' &&
      employee.reportingManagerId?.toString() === req.user.employeeId?.toString();

    if (!isSelf && !isPrivileged && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this employee attendance history',
      });
    }

    const records = await Attendance.find({ employee: employeeId })
      .sort({ date: -1 })
      .limit(60);

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};
