import Task from '../models/Task.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';

/**
 * Helper to verify if a manager has authority over an employee
 */
const isManagerAuthorizedForEmployee = async (managerEmployeeId, targetEmployeeId) => {
  if (!managerEmployeeId || !targetEmployeeId) return false;
  if (managerEmployeeId.toString() === targetEmployeeId.toString()) return true;

  const targetEmployee = await Employee.findById(targetEmployeeId);
  if (!targetEmployee) return false;

  // Direct reporting manager
  if (
    targetEmployee.reportingManagerId &&
    targetEmployee.reportingManagerId.toString() === managerEmployeeId.toString()
  ) {
    return true;
  }

  // Same department if manager is department head
  const managerEmployee = await Employee.findById(managerEmployeeId);
  if (
    managerEmployee &&
    targetEmployee.departmentId &&
    managerEmployee.departmentId &&
    targetEmployee.departmentId.toString() === managerEmployee.departmentId.toString()
  ) {
    const isHead = await Department.exists({
      _id: managerEmployee.departmentId,
      managerId: managerEmployeeId,
    });
    if (isHead) return true;
  }

  return false;
};

/**
 * Create a new task
 * @route   POST /api/tasks
 * @access  Private (ADMIN, HR, MANAGER)
 */
export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description = '',
      assignedTo,
      department,
      priority = 'MEDIUM',
      dueDate,
      estimatedHours = 0,
    } = req.body;

    // 1. Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Assigned employee is required',
      });
    }

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department is required',
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date is required',
      });
    }

    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid due date format',
      });
    }

    // 2. Validate department exists and is active
    const deptDoc = await Department.findById(department);
    if (!deptDoc) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    if (!deptDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign task in an inactive department',
      });
    }

    // 3. Validate employee exists, is active, and belongs to the department
    const employee = await Employee.findById(assignedTo);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Assigned employee not found',
      });
    }

    if (employee.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign task to an inactive employee (status: ${employee.status})`,
      });
    }

    if (employee.departmentId.toString() !== deptDoc._id.toString()) {
      return res.status(400).json({
        success: false,
        message: `Employee ${employee.firstName} ${employee.lastName} does not belong to the selected department`,
      });
    }

    // 4. Validate Manager authority if role is MANAGER
    if (req.user.role === 'MANAGER') {
      const authorized = await isManagerAuthorizedForEmployee(req.user.employeeId, employee._id);
      if (!authorized) {
        return res.status(403).json({
          success: false,
          message: 'Managers can only assign tasks to team members within their reporting line or managed department',
        });
      }
    }

    // 5. Create task
    const task = new Task({
      title: title.trim(),
      description: description.trim(),
      assignedTo: employee._id,
      assignedBy: req.user._id,
      department: deptDoc._id,
      priority,
      status: 'TODO',
      dueDate: parsedDueDate,
      estimatedHours: Number(estimatedHours) || 0,
      completedAt: null,
    });

    await task.save();

    await task.populate([
      {
        path: 'assignedTo',
        select: 'firstName lastName employeeCode designation departmentId reportingManagerId',
      },
      { path: 'assignedBy', select: 'email role' },
      { path: 'department', select: 'name code' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', '),
      });
    }
    next(error);
  }
};

/**
 * Get all tasks with multi-filtering, search, pagination, and RBAC scoping
 * @route   GET /api/tasks
 * @access  Private (RBAC Scoped)
 */
export const getTasks = async (req, res, next) => {
  try {
    const pageNum = parseInt(req.query.page, 10) || 1;
    const limitNum = parseInt(req.query.limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const {
      search,
      assignedTo,
      department,
      status,
      priority,
      dueDate,
      startDate,
      endDate,
      overdue,
    } = req.query;

    const query = {};

    // 1. RBAC Scoping
    if (req.user.role === 'EMPLOYEE') {
      if (!req.user.employeeId) {
        return res.status(200).json({
          success: true,
          data: { tasks: [], total: 0, page: pageNum, pages: 1, limit: limitNum },
        });
      }
      query.assignedTo = req.user.employeeId;
    } else if (req.user.role === 'MANAGER') {
      const teamEmployees = await Employee.find({
        $or: [{ reportingManagerId: req.user.employeeId }, { _id: req.user.employeeId }],
      }).select('_id');
      const teamIds = teamEmployees.map((e) => e._id);

      const managerEmployee = await Employee.findById(req.user.employeeId);
      const managerDeptId = managerEmployee?.departmentId;

      query.$or = [
        { assignedTo: { $in: teamIds } },
        { assignedBy: req.user._id },
        ...(managerDeptId ? [{ department: managerDeptId }] : []),
      ];
    }

    // 2. Search filter (title, description)
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      const searchConditions = [{ title: searchRegex }, { description: searchRegex }];

      // Search employee name or code if applicable
      const matchingEmployees = await Employee.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { employeeCode: searchRegex },
        ],
      }).select('_id');

      if (matchingEmployees.length > 0) {
        const empIds = matchingEmployees.map((e) => e._id);
        searchConditions.push({ assignedTo: { $in: empIds } });
      }

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    // 3. Assignee filter
    if (assignedTo) {
      if (req.user.role === 'EMPLOYEE') {
        if (assignedTo.toString() !== req.user.employeeId?.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to view another employee tasks',
          });
        }
      } else if (req.user.role === 'MANAGER') {
        const authorized = await isManagerAuthorizedForEmployee(req.user.employeeId, assignedTo);
        if (!authorized) {
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to view tasks for employees outside your team',
          });
        }
        query.assignedTo = assignedTo;
      } else {
        query.assignedTo = assignedTo;
      }
    }

    // 4. Department filter
    if (department) {
      query.department = department;
    }

    // 5. Status filter
    if (status) {
      query.status = status;
    }

    // 6. Priority filter
    if (priority) {
      query.priority = priority;
    }

    // 7. Due Date range or single date
    if (dueDate) {
      const parsedDate = new Date(dueDate);
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));
        const endOfDay = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate(), 23, 59, 59, 999));
        query.dueDate = { $gte: startOfDay, $lte: endOfDay };
      }
    } else if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    // 8. Overdue filter
    if (overdue === 'true') {
      query.dueDate = { ...(query.dueDate || {}), $lt: new Date() };
      query.status = { $nin: ['COMPLETED', 'CANCELLED'] };
    } else if (overdue === 'false') {
      query.$or = [
        { status: { $in: ['COMPLETED', 'CANCELLED'] } },
        { dueDate: { $gte: new Date() } },
      ];
    }

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate({
        path: 'assignedTo',
        select: 'firstName lastName employeeCode designation departmentId reportingManagerId',
        populate: { path: 'departmentId', select: 'name code' },
      })
      .populate('assignedBy', 'email role')
      .populate('department', 'name code')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Compute overview statistics for active scope
    const baseScopeQuery = req.user.role === 'EMPLOYEE'
      ? { assignedTo: req.user.employeeId }
      : req.user.role === 'MANAGER'
      ? query
      : {};

    const allScopeTasks = await Task.find(baseScopeQuery).select('status dueDate');
    const now = new Date();
    const stats = {
      total: allScopeTasks.length,
      todo: allScopeTasks.filter((t) => t.status === 'TODO').length,
      inProgress: allScopeTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      review: allScopeTasks.filter((t) => t.status === 'REVIEW').length,
      completed: allScopeTasks.filter((t) => t.status === 'COMPLETED').length,
      cancelled: allScopeTasks.filter((t) => t.status === 'CANCELLED').length,
      overdue: allScopeTasks.filter(
        (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < now
      ).length,
    };

    res.status(200).json({
      success: true,
      data: {
        tasks,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current employee's tasks and self-service metrics
 * @route   GET /api/tasks/my
 * @access  Private (Authenticated Employee)
 */
export const getMyTasks = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to this account',
      });
    }

    const pageNum = parseInt(req.query.page, 10) || 1;
    const limitNum = parseInt(req.query.limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const { status, priority, overdue } = req.query;

    const query = { assignedTo: req.user.employeeId };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $nin: ['COMPLETED', 'CANCELLED'] };
    }

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('department', 'name code')
      .populate('assignedBy', 'email role')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Compute user personal stats
    const allUserTasks = await Task.find({ assignedTo: req.user.employeeId }).select(
      'status dueDate'
    );
    const now = new Date();
    const stats = {
      total: allUserTasks.length,
      todo: allUserTasks.filter((t) => t.status === 'TODO').length,
      inProgress: allUserTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      review: allUserTasks.filter((t) => t.status === 'REVIEW').length,
      completed: allUserTasks.filter((t) => t.status === 'COMPLETED').length,
      overdue: allUserTasks.filter(
        (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < now
      ).length,
    };

    res.status(200).json({
      success: true,
      data: {
        tasks,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private (RBAC Scoped)
 */
export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate({
        path: 'assignedTo',
        select: 'firstName lastName employeeCode designation departmentId reportingManagerId',
        populate: { path: 'departmentId', select: 'name code' },
      })
      .populate('assignedBy', 'email role')
      .populate('department', 'name code');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // RBAC validation
    if (req.user.role === 'EMPLOYEE') {
      if (task.assignedTo._id.toString() !== req.user.employeeId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this task',
        });
      }
    } else if (req.user.role === 'MANAGER') {
      const authorized = await isManagerAuthorizedForEmployee(
        req.user.employeeId,
        task.assignedTo._id
      );
      const isCreator = task.assignedBy._id.toString() === req.user._id.toString();
      if (!authorized && !isCreator) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this task',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task details (title, description, priority, dueDate, estimatedHours, department, assignedTo)
 * @route   PUT /api/tasks/:id
 * @access  Private (ADMIN, HR, MANAGER)
 */
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check manager authorization
    if (req.user.role === 'MANAGER') {
      const authorized = await isManagerAuthorizedForEmployee(
        req.user.employeeId,
        task.assignedTo
      );
      const isCreator = task.assignedBy.toString() === req.user._id.toString();
      if (!authorized && !isCreator) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this task',
        });
      }
    }

    const {
      title,
      description,
      priority,
      dueDate,
      estimatedHours,
      department,
      assignedTo,
    } = req.body;

    if (title && title.trim()) {
      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = description.trim();
    }

    if (priority) {
      task.priority = priority;
    }

    if (estimatedHours !== undefined) {
      task.estimatedHours = Number(estimatedHours) || 0;
    }

    if (dueDate) {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid due date format',
        });
      }
      task.dueDate = parsedDate;
    }

    // Re-verify department and assignee if modified
    const targetDeptId = department || task.department;
    const targetAssigneeId = assignedTo || task.assignedTo;

    if (department || assignedTo) {
      const deptDoc = await Department.findById(targetDeptId);
      if (!deptDoc || !deptDoc.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Selected department is invalid or inactive',
        });
      }

      const empDoc = await Employee.findById(targetAssigneeId);
      if (!empDoc) {
        return res.status(404).json({
          success: false,
          message: 'Assigned employee not found',
        });
      }

      if (empDoc.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: `Cannot assign task to an inactive employee (status: ${empDoc.status})`,
        });
      }

      if (empDoc.departmentId.toString() !== deptDoc._id.toString()) {
        return res.status(400).json({
          success: false,
          message: `Employee ${empDoc.firstName} ${empDoc.lastName} does not belong to the selected department`,
        });
      }

      if (req.user.role === 'MANAGER') {
        const authorized = await isManagerAuthorizedForEmployee(req.user.employeeId, empDoc._id);
        if (!authorized) {
          return res.status(403).json({
            success: false,
            message: 'Managers cannot assign tasks outside their authorized reporting scope',
          });
        }
      }

      task.department = deptDoc._id;
      task.assignedTo = empDoc._id;
    }

    await task.save();

    await task.populate([
      {
        path: 'assignedTo',
        select: 'firstName lastName employeeCode designation departmentId reportingManagerId',
      },
      { path: 'assignedBy', select: 'email role' },
      { path: 'department', select: 'name code' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private (ADMIN, HR, MANAGER who created it)
 */
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (req.user.role === 'EMPLOYEE') {
      return res.status(403).json({
        success: false,
        message: 'Employees are not authorized to delete tasks',
      });
    }

    if (req.user.role === 'MANAGER') {
      const isCreator = task.assignedBy.toString() === req.user._id.toString();
      if (!isCreator) {
        return res.status(403).json({
          success: false,
          message: 'Managers can only delete tasks they personally created',
        });
      }
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Transition task status (TODO -> IN_PROGRESS -> REVIEW -> COMPLETED -> CANCELLED)
 * @route   PATCH /api/tasks/:id/status
 * @access  Private (Assigned Employee, Manager, HR, Admin)
 */
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Role check
    if (req.user.role === 'EMPLOYEE') {
      if (task.assignedTo.toString() !== req.user.employeeId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update status for another employee task',
        });
      }
    } else if (req.user.role === 'MANAGER') {
      const authorized = await isManagerAuthorizedForEmployee(
        req.user.employeeId,
        task.assignedTo
      );
      const isCreator = task.assignedBy.toString() === req.user._id.toString();
      if (!authorized && !isCreator) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this task status',
        });
      }
    }

    // Status transition & completedAt management
    task.status = status;
    if (status === 'COMPLETED') {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }

    await task.save();

    await task.populate([
      {
        path: 'assignedTo',
        select: 'firstName lastName employeeCode designation departmentId',
      },
      { path: 'assignedBy', select: 'email role' },
      { path: 'department', select: 'name code' },
    ]);

    res.status(200).json({
      success: true,
      message: `Task status updated to ${status}`,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reassign task to a different employee
 * @route   PATCH /api/tasks/:id/assign
 * @access  Private (ADMIN, HR, MANAGER)
 */
export const assignTask = async (req, res, next) => {
  try {
    const { assignedTo, department } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'New assigned employee is required',
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (req.user.role === 'EMPLOYEE') {
      return res.status(403).json({
        success: false,
        message: 'Employees are not authorized to reassign tasks',
      });
    }

    const targetDeptId = department || task.department;
    const deptDoc = await Department.findById(targetDeptId);
    if (!deptDoc || !deptDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Department is invalid or inactive',
      });
    }

    const employee = await Employee.findById(assignedTo);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'New assigned employee not found',
      });
    }

    if (employee.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign task to an inactive employee (status: ${employee.status})`,
      });
    }

    if (employee.departmentId.toString() !== deptDoc._id.toString()) {
      return res.status(400).json({
        success: false,
        message: `Employee ${employee.firstName} ${employee.lastName} does not belong to department ${deptDoc.name}`,
      });
    }

    if (req.user.role === 'MANAGER') {
      const authorized = await isManagerAuthorizedForEmployee(req.user.employeeId, employee._id);
      if (!authorized) {
        return res.status(403).json({
          success: false,
          message: 'Managers can only assign tasks to employees within their reporting scope',
        });
      }
    }

    task.assignedTo = employee._id;
    task.department = deptDoc._id;
    await task.save();

    await task.populate([
      {
        path: 'assignedTo',
        select: 'firstName lastName employeeCode designation departmentId',
      },
      { path: 'assignedBy', select: 'email role' },
      { path: 'department', select: 'name code' },
    ]);

    res.status(200).json({
      success: true,
      message: `Task reassigned to ${employee.firstName} ${employee.lastName}`,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};
