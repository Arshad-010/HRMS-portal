import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import { admin } from '../config/firebaseAdmin.js';
import { getAuth } from 'firebase-admin/auth';
import { generateTOTPSecret, generateProvisioningURI, encryptSecret, decryptSecret, verifyTOTPCode, generateRecoveryCodes, is2FAConfigured } from '../utils/twoFactor.js';
import qrcode from 'qrcode';
import bcrypt from 'bcryptjs';

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

    if (user.twoFactorEnabled) {
      const challengeToken = generateToken({
        id: user._id,
        role: '2FA_CHALLENGE',
        email: user.email,
      });
      return res.status(200).json({
        success: true,
        message: '2FA verification required',
        requires2FA: true,
        data: {
          token: challengeToken,
        },
      });
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
        twoFactorEnabled: user.twoFactorEnabled,
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

import crypto from 'crypto';

/**
 * Activate user account and set password using activation token
 * @route   POST /api/auth/activate/:token
 * @access  Public
 */
export const activateAccount = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // Hash token to compare with database
    const cleanToken = token.trim();
    const hashedToken = crypto.createHash('sha256').update(cleanToken).digest('hex');

    const user = await User.findOne({
      activationToken: hashedToken,
      activationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      // DEBUG: Find out why user was not found
      import('fs').then(async fs => {
        const anyUserWithToken = await User.findOne({ activationToken: hashedToken });
        const allUsers = await User.find({}).select('+activationToken +activationTokenExpire email');
        const debugInfo = {
          time: new Date(),
          providedRawToken: token,
          computedHashedToken: hashedToken,
          foundWithHashOnly: !!anyUserWithToken,
          allTokensInDb: allUsers.map(u => ({ email: u.email, token: u.activationToken, expire: u.activationTokenExpire }))
        };
        fs.writeFileSync('activation-debug.json', JSON.stringify(debugInfo, null, 2));
      });

      return res.status(400).json({
        success: false,
        message: 'Activation link is invalid or has expired',
      });
    }

    // Set new password and clear activation fields
    user.password = password;
    user.activationToken = undefined;
    user.activationTokenExpire = undefined;
    user.isActive = true;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account activated successfully. You can now login.',
    });
  } catch (error) {
    next(error);
  }
};

import { sendPasswordResetEmail } from '../services/emailService.js';

/**
 * Forgot password request
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Return generic message even if user not found to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const rawToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Set token and expiration (30 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;
    
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
      
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      console.error('Email could not be sent:', error);
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // Hash token to compare
    const cleanToken = token.trim();
    const hashedToken = crypto.createHash('sha256').update(cleanToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // In this basic JWT implementation, existing JWTs don't get invalidated
    // automatically unless we implement a token blacklist or change a secret.
    // We document this limitation as requested.
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};


/**
 * 2FA Endpoints
 */

export const setup2FA = async (req, res, next) => {
  try {
    if (!is2FAConfigured()) {
      return res.status(500).json({ success: false, message: '2FA is not configured on the server. Missing TWO_FACTOR_SECRET_KEY.' });
    }
    
    const user = await User.findById(req.user._id);
    if (user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: '2FA is already enabled.' });
    }

    const secret = generateTOTPSecret();
    const uri = generateProvisioningURI(user.email, secret);
    const qrCodeDataUrl = await qrcode.toDataURL(uri);

    // Save pending secret (expires in 10 minutes)
    user.twoFactorPendingSecretEncrypted = encryptSecret(secret);
    user.twoFactorPendingExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: {
        qrCode: qrCodeDataUrl,
        secret: secret // manual setup key
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verify2FASetup = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code || code.length !== 6) {
      return res.status(400).json({ success: false, message: 'Please provide a 6-digit code.' });
    }

    const user = await User.findById(req.user._id).select('+twoFactorPendingSecretEncrypted +twoFactorPendingExpiresAt');
    
    if (!user.twoFactorPendingSecretEncrypted || !user.twoFactorPendingExpiresAt || user.twoFactorPendingExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Pending 2FA setup expired or not found. Please restart setup.' });
    }

    const secret = decryptSecret(user.twoFactorPendingSecretEncrypted);
    const isValid = verifyTOTPCode(code, secret);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA code.' });
    }

    // Setup successful
    user.twoFactorEnabled = true;
    user.twoFactorSecretEncrypted = user.twoFactorPendingSecretEncrypted;
    user.twoFactorEnabledAt = new Date();
    
    // Clear pending
    user.twoFactorPendingSecretEncrypted = undefined;
    user.twoFactorPendingExpiresAt = undefined;

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes(10);
    const recoveryCodeHashes = [];
    for (const rcode of recoveryCodes) {
      const salt = await bcrypt.genSalt(10);
      recoveryCodeHashes.push(await bcrypt.hash(rcode, salt));
    }
    user.twoFactorRecoveryCodeHashes = recoveryCodeHashes;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: '2FA has been successfully enabled.',
      data: {
        recoveryCodes
      }
    });
  } catch (error) {
    next(error);
  }
};

export const disable2FA = async (req, res, next) => {
  try {
    const { password, code } = req.body;
    
    const user = await User.findById(req.user._id).select('+password +twoFactorSecretEncrypted');
    
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: '2FA is not enabled.' });
    }

    // Verify identity
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    const secret = decryptSecret(user.twoFactorSecretEncrypted);
    const isValid = verifyTOTPCode(code, secret);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA code.' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecretEncrypted = undefined;
    user.twoFactorEnabledAt = undefined;
    user.twoFactorRecoveryCodeHashes = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: '2FA has been disabled.' });
  } catch (error) {
    next(error);
  }
};

export const regenerateRecoveryCodes = async (req, res, next) => {
  try {
    const { password, code } = req.body;
    const user = await User.findById(req.user._id).select('+password +twoFactorSecretEncrypted');
    
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: '2FA is not enabled.' });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    const secret = decryptSecret(user.twoFactorSecretEncrypted);
    const isValid = verifyTOTPCode(code, secret);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA code.' });
    }

    const recoveryCodes = generateRecoveryCodes(10);
    const recoveryCodeHashes = [];
    for (const rcode of recoveryCodes) {
      const salt = await bcrypt.genSalt(10);
      recoveryCodeHashes.push(await bcrypt.hash(rcode, salt));
    }
    user.twoFactorRecoveryCodeHashes = recoveryCodeHashes;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Recovery codes regenerated successfully.',
      data: { recoveryCodes }
    });
  } catch (error) {
    next(error);
  }
};

export const verify2FALogin = async (req, res, next) => {
  try {
    // Challenge token should be passed in headers
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to verify 2FA challenge.' });
    }

    const { code, isRecoveryCode } = req.body;

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired challenge token.' });
    }

    if (decoded.role !== '2FA_CHALLENGE') {
      return res.status(400).json({ success: false, message: 'Invalid challenge token.' });
    }

    const user = await User.findById(decoded.id).select('+twoFactorSecretEncrypted +twoFactorRecoveryCodeHashes');
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: 'Invalid request. 2FA not enabled.' });
    }

    let isValid = false;

    if (isRecoveryCode) {
      // Check recovery codes
      for (let i = 0; i < user.twoFactorRecoveryCodeHashes.length; i++) {
        const hash = user.twoFactorRecoveryCodeHashes[i];
        if (await bcrypt.compare(code, hash)) {
          isValid = true;
          // Invalidate used recovery code
          user.twoFactorRecoveryCodeHashes.splice(i, 1);
          await user.save({ validateBeforeSave: false });
          break;
        }
      }
    } else {
      // Check TOTP
      if (!code || code.length !== 6) {
        return res.status(400).json({ success: false, message: 'Invalid 2FA code.' });
      }
      const secret = decryptSecret(user.twoFactorSecretEncrypted);
      isValid = verifyTOTPCode(code, secret);
    }

    if (!isValid) {
      return res.status(401).json({ success: false, message: isRecoveryCode ? 'Invalid recovery code.' : 'Invalid 2FA code.' });
    }

    // Issue actual token
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    let employeeData = null;
    if (user.employeeId) {
      const employee = await Employee.findById(user.employeeId)
        .populate('departmentId', 'name code')
        .populate('reportingManagerId', 'firstName lastName employeeCode');

      if (employee) {
        employeeData = employee.filterForRole(user.role);
      }
    }

    const fullToken = generateToken({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: fullToken,
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
