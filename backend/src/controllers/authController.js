import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import { generateToken } from '../utils/jwt.js';
import { admin } from '../config/firebaseAdmin.js';
import { getAuth } from 'firebase-admin/auth';

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

/**
 * Upload profile picture (Base64 string)
 * @route   POST /api/auth/profile-picture
 * @access  Private (All Roles)
 */
export const uploadProfilePicture = async (req, res, next) => {
  try {
    const { image } = req.body; // Expecting base64 string

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }

    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No associated employee profile found to update image',
      });
    }

    // Basic validation to ensure it's a base64 string
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Must be a base64 data URI starting with data:image/',
      });
    }

    // Check size roughly (5MB max) - Base64 string length * (3/4) = bytes
    const sizeInBytes = image.length * (3 / 4);
    if (sizeInBytes > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image size exceeds 5MB limit',
      });
    }

    const employee = await Employee.findById(req.user.employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found',
      });
    }

    employee.profilePicture = image;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePicture: employee.profilePicture,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate user with Google Firebase Token
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'No Google identity token provided',
      });
    }

    if (!admin) {
      return res.status(500).json({
        success: false,
        message: 'Firebase Admin is not configured on the server',
      });
    }

    // 1. Verify the token with Firebase Admin
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed or token expired',
      });
    }

    const { email, email_verified } = decodedToken;

    if (!email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Google email address is not verified',
      });
    }

    if (!email) {
      return res.status(401).json({
        success: false,
        message: 'Google account does not provide an email address',
      });
    }

    // 2. Find the existing HRMS User by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No HRMS account is associated with this Google account. Please contact your administrator.',
      });
    }

    // 3. Ensure user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your HRMS account is inactive. Please contact your administrator.',
      });
    }

    // 4. Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // 5. Fetch associated employee record with department details
    let employeeData = null;
    if (user.employeeId) {
      const employee = await Employee.findById(user.employeeId)
        .populate('departmentId', 'name code')
        .populate('reportingManagerId', 'firstName lastName employeeCode');

      if (employee) {
        employeeData = employee.filterForRole(user.role);
      }
    }

    // 6. Generate existing HRMS JWT token
    const token = generateToken({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: 'Google Login successful',
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
