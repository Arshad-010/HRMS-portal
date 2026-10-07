import Department from '../models/Department.js';
import Employee from '../models/Employee.js';
import { logActivity } from '../services/activityService.js';

/**
 * Get all departments with employee counts
 * @route   GET /api/departments
 * @access  Private (All Roles)
 */
export const getDepartments = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const departments = await Department.find(filter)
      .populate('managerId', 'firstName lastName employeeCode designation')
      .sort({ name: 1 })
      .lean();

    // Attach active employee counts for each department
    const departmentIds = departments.map((d) => d._id);
    const memberCounts = await Employee.aggregate([
      {
        $match: {
          departmentId: { $in: departmentIds },
          status: { $ne: 'TERMINATED' },
        },
      },
      {
        $group: {
          _id: '$departmentId',
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    memberCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const enrichedDepartments = departments.map((dept) => ({
      ...dept,
      employeeCount: countMap[dept._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      data: enrichedDepartments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get department details and member list
 * @route   GET /api/departments/:id
 * @access  Private (All Roles)
 */
export const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id).populate(
      'managerId',
      'firstName lastName employeeCode designation'
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const members = await Employee.find({
      departmentId: req.params.id,
      status: { $ne: 'TERMINATED' },
    })
      .select('firstName lastName employeeCode designation status employmentType')
      .sort({ firstName: 1 });

    res.status(200).json({
      success: true,
      data: {
        department,
        employeeCount: members.length,
        members,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new department
 * @route   POST /api/departments
 * @access  Private (ADMIN, HR)
 */
export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, managerId } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Department name and unique code are required',
      });
    }

    const formattedCode = code.trim().toUpperCase();

    // Check duplicate code
    const existingCode = await Department.findOne({ code: formattedCode });
    if (existingCode) {
      return res.status(409).json({
        success: false,
        message: `Department code '${formattedCode}' is already in use`,
      });
    }

    // Check duplicate name
    const existingName = await Department.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existingName) {
      return res.status(409).json({
        success: false,
        message: `Department name '${name.trim()}' already exists`,
      });
    }

    const department = await Department.create({
      name: name.trim(),
      code: formattedCode,
      description: description?.trim() || '',
      managerId: managerId || null,
      isActive: true,
    });

    logActivity({
      actor: req.user._id,
      action: 'DEPARTMENT_CREATED',
      entityType: 'DEPARTMENT',
      entityId: department._id,
      description: `Department "${department.name}" (${department.code}) was created`,
      metadata: { name: department.name, code: department.code },
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update department details
 * @route   PUT /api/departments/:id
 * @access  Private (ADMIN, HR)
 */
export const updateDepartment = async (req, res, next) => {
  try {
    const { name, description, managerId, isActive } = req.body;

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    if (name && name.trim() !== department.name) {
      const duplicateName = await Department.findOne({
        _id: { $ne: department._id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      });
      if (duplicateName) {
        return res.status(409).json({
          success: false,
          message: `Department name '${name.trim()}' already exists`,
        });
      }
      department.name = name.trim();
    }

    if (description !== undefined) department.description = description.trim();
    if (managerId !== undefined) department.managerId = managerId || null;
    if (isActive !== undefined) department.isActive = Boolean(isActive);

    await department.save();

    logActivity({
      actor: req.user._id,
      action: 'DEPARTMENT_UPDATED',
      entityType: 'DEPARTMENT',
      entityId: department._id,
      description: `Department "${department.name}" (${department.code}) was updated`,
      metadata: { name: department.name, code: department.code },
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate or delete department
 * Prefers soft deactivation when employees are assigned
 * @route   DELETE /api/departments/:id
 * @access  Private (ADMIN only)
 */
export const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const activeMemberCount = await Employee.countDocuments({
      departmentId: department._id,
      status: { $ne: 'TERMINATED' },
    });

    department.isActive = false;
    await department.save();

    logActivity({
      actor: req.user._id,
      action: 'DEPARTMENT_DEACTIVATED',
      entityType: 'DEPARTMENT',
      entityId: department._id,
      description: `Department "${department.name}" (${department.code}) was deactivated`,
      metadata: { name: department.name, code: department.code },
    });

    if (activeMemberCount > 0) {
      return res.status(200).json({
        success: true,
        message: `Department has been deactivated rather than deleted because ${activeMemberCount} active employee(s) belong to it.`,
        data: department,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Department deactivated successfully',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};
