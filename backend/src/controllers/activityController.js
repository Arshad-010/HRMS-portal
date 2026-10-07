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
