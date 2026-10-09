import ActivityLog from '../models/ActivityLog.js';
import Employee from '../models/Employee.js';

/**
 * Get activity / audit logs with RBAC scoping and multi-filter capabilities
 * @route   GET /api/activity
 * @access  Private (RBAC Scoped)
 */
export const getActivityLogs = async (req, res, next) => {
  try {
    const pageNum = parseInt(req.query.page, 10) || 1;
    const limitNum = Math.min(parseInt(req.query.limit, 10) || 15, 100);
    const skip = (pageNum - 1) * limitNum;

    const { actor, action, entityType, startDate, endDate, search } = req.query;

    const query = {};

    // 1. RBAC Scoping
    if (req.user.role === 'EMPLOYEE') {
      // Employees can only inspect events they initiated or where their employee profile was targeted
      const conditions = [{ actor: req.user._id }];
      if (req.user.employeeId) {
        conditions.push({ entityId: req.user.employeeId });
      }
      query.$or = conditions;
    } else if (req.user.role === 'MANAGER') {
      // Managers can inspect events they initiated or events involving their supervisees/department
      const teamEmployees = await Employee.find({
        $or: [{ reportingManagerId: req.user.employeeId }, { _id: req.user.employeeId }],
      }).select('_id');
      const teamEmpIds = teamEmployees.map((e) => e._id);

      query.$or = [
        { actor: req.user._id },
        { entityId: { $in: teamEmpIds } },
      ];
    }
    // ADMIN & HR have organization-wide visibility

    // 2. Specific Actor filter
    if (actor) {
      if (req.user.role === 'EMPLOYEE' && actor.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Employees cannot inspect other users activity logs',
        });
      }
      query.actor = actor;
    }

    // 3. Action filter
    if (action) {
      query.action = action.toUpperCase();
    }

    // 4. Entity Type filter
    if (entityType) {
      query.entityType = entityType.toUpperCase();
    }

    // 5. Date Range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // 6. Free text search on description
    if (search && search.trim()) {
      query.description = { $regex: search.trim(), $options: 'i' };
    }

    const [total, logs] = await Promise.all([
      ActivityLog.countDocuments(query),
      ActivityLog.find(query)
        .populate('actor', 'email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
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
 * Get team activity feed for the authenticated user
 * @route   GET /api/activity/team
 * @access  Private
 */
export const getTeamActivityLogs = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const currentEmp = await Employee.findById(employeeId).select('reportingManagerId');
    if (!currentEmp) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const { teamId } = req.query;
    let teamEmployeeIds = [];

    if (teamId) {
      const Team = (await import('../models/Team.js')).default;
      const team = await Team.findById(teamId).populate('members');
      if (!team) {
        return res.status(404).json({ success: false, message: 'Team not found' });
      }
      
      const isMemberOrLead = 
        team.teamLeadId.toString() === employeeId.toString() ||
        team.members.some(m => m._id.toString() === employeeId.toString() || m.toString() === employeeId.toString());

      if (req.user.role === 'EMPLOYEE' && !isMemberOrLead) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this team' });
      }

      teamEmployeeIds = team.members.map(m => m._id || m);
      teamEmployeeIds.push(team.teamLeadId);
    } else {
      // Derive team logic matching employeeController.js
      if (req.user.role === 'EMPLOYEE') {
        if (!currentEmp.reportingManagerId) {
          teamEmployeeIds = [employeeId];
        } else {
          const peers = await Employee.find({ reportingManagerId: currentEmp.reportingManagerId }).select('_id');
          teamEmployeeIds = peers.map(p => p._id);
          teamEmployeeIds.push(currentEmp.reportingManagerId); // add manager
        }
      } else if (req.user.role === 'MANAGER') {
        const reports = await Employee.find({ reportingManagerId: employeeId }).select('_id');
        teamEmployeeIds = reports.map(r => r._id);
        teamEmployeeIds.push(employeeId);
        if (currentEmp.reportingManagerId) {
          teamEmployeeIds.push(currentEmp.reportingManagerId);
          const peers = await Employee.find({ reportingManagerId: currentEmp.reportingManagerId }).select('_id');
          peers.forEach(p => teamEmployeeIds.push(p._id));
        }
      } else {
        // HR/ADMIN
        if (currentEmp.reportingManagerId) {
          const peers = await Employee.find({ reportingManagerId: currentEmp.reportingManagerId }).select('_id');
          teamEmployeeIds = peers.map(p => p._id);
          teamEmployeeIds.push(currentEmp.reportingManagerId);
        }
        const reports = await Employee.find({ reportingManagerId: employeeId }).select('_id');
        reports.forEach(r => teamEmployeeIds.push(r._id));
        teamEmployeeIds.push(employeeId);
      }
    }

    // Get User IDs for the team employees to filter actors
    const employees = await Employee.find({ _id: { $in: teamEmployeeIds } }).select('userId');
    const teamUserIds = employees.map(e => e.userId).filter(Boolean);

    // Build query for team activity
    // We want activities performed by these users, OR targeting these employees/users
    // Excluding sensitive entity types if necessary (e.g. PERFORMANCE, SALARY)
    // The current entityTypes are: 'EMPLOYEE', 'DEPARTMENT', 'LEAVE', 'TASK', 'ATTENDANCE', 'USER', 'SYSTEM'
    // Exclude 'USER' and 'SYSTEM' for team feed noise
    const query = {
      $or: [
        { actor: { $in: teamUserIds } },
        { entityId: { $in: teamEmployeeIds } }
      ],
      entityType: { $in: ['EMPLOYEE', 'LEAVE', 'TASK', 'ATTENDANCE'] }
    };

    const logs = await ActivityLog.find(query)
      .populate('actor', 'email role')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};
