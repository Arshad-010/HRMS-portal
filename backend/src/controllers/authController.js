import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Authenticate user and issue JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // Find user with password included for verification
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact HR or System Administrator.',
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Fetch associated employee record with department details
    let employeeData = null;
    if (user.employeeId) {
      const employee = await Employee.findById(user.employeeId)
        .populate('departmentId', 'name code')
        .populate('reportingManagerId', 'firstName lastName employeeCode');

      if (employee) {
        employeeData = employee.filterForRole(user.role);
      }
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
          employee: employeeData,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user session
 * @route   GET /api/auth/me
 * @access  Private (All Roles)
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    let employeeData = null;
    if (user.employeeId) {
      const employee = await Employee.findById(user.employeeId)
        .populate('departmentId', 'name code')
        .populate('reportingManagerId', 'firstName lastName employeeCode');

      if (employee) {
        employeeData = employee.filterForRole(user.role);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        employee: employeeData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change current user password
 * @route   POST /api/auth/change-password
 * @access  Private (All Roles)
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are both required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password does not match',
      });
    }

    // Set and save new password (triggers pre-save bcrypt hash hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
