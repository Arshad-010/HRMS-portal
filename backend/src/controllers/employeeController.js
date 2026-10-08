import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { getNextEmployeeCode } from '../models/Counter.js';
import { logActivity } from '../services/activityService.js';

/**
 * Get paginated employees list with search and filters
 * @route   GET /api/employees
 * @access  Private (All Roles - salary protected by RBAC)
 */
export const getEmployees = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const {
      search,
      department,
      designation,
      status,
      employmentType,
    } = req.query;

    const query = {};

    // Filters
    if (department) {
      query.departmentId = department;
    }

    if (designation) {
      query.designation = { $regex: designation.trim(), $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (employmentType) {
      query.employmentType = employmentType;
    }

    // Search query matches firstName, lastName, employeeCode
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeCode: searchRegex },
        { designation: searchRegex },
      ];
    }

    const userRole = req.user.role;
    let finalQuery = query;

    // Enforce RBAC for directory listing
    if (userRole === 'EMPLOYEE') {
      finalQuery = { $and: [{ _id: req.user.employeeId }, query] };
    } else if (userRole === 'MANAGER') {
      finalQuery = { 
        $and: [
          { $or: [{ _id: req.user.employeeId }, { reportingManagerId: req.user.employeeId }] },
          query
        ] 
      };
    }

    const total = await Employee.countDocuments(finalQuery);
    const employees = await Employee.find(finalQuery)
      .select('-profilePicture')
      .populate('departmentId', 'name code')
      .populate('reportingManagerId', 'firstName lastName employeeCode designation')
      .populate('userId', 'email role isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Apply role-based field filtering (strip salary for non-Admin/non-HR)
    const sanitizedEmployees = employees.map((emp) =>
      emp.filterForRole(req.user.role)
    );

    res.status(200).json({
      success: true,
      data: {
        employees: sanitizedEmployees,
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
 * Get employee details by ID
 * @route   GET /api/employees/:id
 * @access  Private (All Roles - salary protected by RBAC)
 */
export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('departmentId', 'name code description')
      .populate('reportingManagerId', 'firstName lastName employeeCode designation email')
      .populate('userId', 'email role isActive lastLogin');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const userRole = req.user.role;
    const isSelf = req.user.employeeId && req.user.employeeId.toString() === employee._id.toString();
    const isDirectReport = employee.reportingManagerId && req.user.employeeId && employee.reportingManagerId._id.toString() === req.user.employeeId.toString();

    // Enforce RBAC for specific employee details
    if (userRole === 'EMPLOYEE') {
      if (!isSelf) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this employee profile',
        });
      }
    } else if (userRole === 'MANAGER') {
      if (!isSelf && !isDirectReport) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this employee profile',
        });
      }
    }

    // Apply role-based filtering (salary strictly reserved for ADMIN and HR)
    const sanitizedEmployee = employee.filterForRole(req.user.role);

    res.status(200).json({
      success: true,
      data: sanitizedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create employee and link corresponding User account
 * @route   POST /api/employees
 * @access  Private (ADMIN, HR)
 */
export const createEmployee = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role = 'EMPLOYEE',
      departmentId,
      designation,
      joiningDate = new Date(),
      employmentType = 'FULL_TIME',
      status = 'ACTIVE',
      salary = 0,
      reportingManagerId,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !departmentId || !designation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, departmentId, and designation',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address format',
      });
    }

    // Prevent duplicate email records
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `An account with email '${normalizedEmail}' already exists`,
      });
    }

    // Validate department existence
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'The selected department does not exist',
      });
    }

    // Validate reporting manager if specified
    if (reportingManagerId) {
      const managerExists = await Employee.findById(reportingManagerId);
      if (!managerExists) {
        return res.status(400).json({
          success: false,
          message: 'The selected reporting manager does not exist',
        });
      }
    }

    // Safely generate next sequential employee code
    const employeeCode = await getNextEmployeeCode();

    // 1. Create corresponding User credentials
    const defaultPassword = password || 'Welcome@2026!';
    const user = new User({
      email: normalizedEmail,
      password: defaultPassword, // Hashed by User model pre-save hook
      role,
      isActive: status !== 'TERMINATED',
    });

    // 2. Create Employee record referencing User
    const employee = new Employee({
      userId: user._id,
      employeeCode,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() || '',
      dateOfBirth: dateOfBirth || null,
      gender: gender || 'PREFER_NOT_TO_SAY',
      address: address || {},
      departmentId,
      designation: designation.trim(),
      joiningDate,
      employmentType,
      status,
      reportingManagerId: reportingManagerId || null,
      salary: Number(salary) || 0,
      leaveBalances: {
        casual: 12,
        sick: 10,
        paid: 12,
        unpaid: 0,
      },
      emergencyContact: emergencyContact || {},
    });

    // 3. Link Employee back to User and persist both
    user.employeeId = employee._id;
    await user.save();
    await employee.save();

    logActivity({
      actor: req.user._id,
      action: 'EMPLOYEE_CREATED',
      entityType: 'EMPLOYEE',
      entityId: employee._id,
      description: `Employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode}) was created`,
      metadata: {
        employeeCode: employee.employeeCode,
        designation: employee.designation,
        email: user.email,
      },
    });

    // Populate department info for response
    await employee.populate('departmentId', 'name code');

    res.status(201).json({
      success: true,
      message: 'Employee created and user account provisioned successfully',
      data: employee.filterForRole(req.user.role),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update employee details
 * @route   PUT /api/employees/:id
 * @access  Private (ADMIN, HR, or Self for contact info)
 */
export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'HR';
    const isSelf = req.user.employeeId?.toString() === employee._id.toString();

    if (!isPrivileged && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this employee profile',
      });
    }

    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      departmentId,
      designation,
      employmentType,
      status,
      reportingManagerId,
      salary,
      role,
    } = req.body;

    // Contact fields accessible by self or privileged
    if (phone !== undefined) employee.phone = phone.trim();
    if (dateOfBirth !== undefined) employee.dateOfBirth = dateOfBirth;
    if (gender !== undefined) employee.gender = gender;
    if (address !== undefined) employee.address = address;
    if (emergencyContact !== undefined) employee.emergencyContact = emergencyContact;

    // Core organizational and compensation fields restricted to ADMIN/HR
    if (isPrivileged) {
      if (firstName) employee.firstName = firstName.trim();
      if (lastName) employee.lastName = lastName.trim();
      if (designation) employee.designation = designation.trim();
      if (employmentType) employee.employmentType = employmentType;
      if (reportingManagerId !== undefined) employee.reportingManagerId = reportingManagerId || null;

      if (departmentId) {
        const department = await Department.findById(departmentId);
        if (!department) {
          return res.status(400).json({
            success: false,
            message: 'Selected department does not exist',
          });
        }
        employee.departmentId = departmentId;
      }

      if (salary !== undefined) {
        employee.salary = Number(salary);
      }

      if (status) {
        employee.status = status;
        if (status === 'TERMINATED') {
          // Synchronize user deactivation
          await User.findByIdAndUpdate(employee.userId, { isActive: false });
        } else if (status === 'ACTIVE') {
          await User.findByIdAndUpdate(employee.userId, { isActive: true });
        }
      }

      if (role && req.user.role === 'ADMIN') {
        // ADMIN can modify user role
        await User.findByIdAndUpdate(employee.userId, { role });
      }
    }

    await employee.save();

    logActivity({
      actor: req.user._id,
      action: 'EMPLOYEE_UPDATED',
      entityType: 'EMPLOYEE',
      entityId: employee._id,
      description: `Employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode}) was updated`,
      metadata: {
        employeeCode: employee.employeeCode,
        designation: employee.designation,
        status: employee.status,
      },
    });

    await employee.populate('departmentId', 'name code');
    await employee.populate('reportingManagerId', 'firstName lastName employeeCode');

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee.filterForRole(req.user.role),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate employee (Soft deactivation rather than permanent deletion)
 * @route   DELETE /api/employees/:id
 * @access  Private (ADMIN only)
 */
export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Soft deactivation: set employee status to TERMINATED & disable User login
    employee.status = 'TERMINATED';
    await employee.save();

    await User.findByIdAndUpdate(employee.userId, { isActive: false });

    logActivity({
      actor: req.user._id,
      action: 'EMPLOYEE_DEACTIVATED',
      entityType: 'EMPLOYEE',
      entityId: employee._id,
      description: `Employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode}) was deactivated`,
      metadata: {
        employeeCode: employee.employeeCode,
      },
    });

    res.status(200).json({
      success: true,
      message: `Employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode}) has been deactivated.`,
      data: employee.filterForRole(req.user.role),
    });
  } catch (error) {
    next(error);
  }
};
