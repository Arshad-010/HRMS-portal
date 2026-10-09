const fs = require('fs');
const path = require('path');
const authControllerPath = path.join(__dirname, 'backend', 'src', 'controllers', 'authController.js');

let content = fs.readFileSync(authControllerPath, 'utf8');

// 1. Add new imports
const importBlock = `import { admin } from '../config/firebaseAdmin.js';
import { getAuth } from 'firebase-admin/auth';
import { generateTOTPSecret, generateProvisioningURI, encryptSecret, decryptSecret, verifyTOTPCode, generateRecoveryCodes, is2FAConfigured } from '../utils/twoFactor.js';
import qrcode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';`;

content = content.replace(`import { admin } from '../config/firebaseAdmin.js';
import { getAuth } from 'firebase-admin/auth';`, importBlock);


// 2. Update login
const oldLoginTokenGen = `    // Generate JWT token
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
    });`;

const newLoginTokenGen = `    if (user.twoFactorEnabled) {
      // Issue a short-lived 2FA challenge token instead of full access
      const challengeToken = generateToken({
        id: user._id,
        role: '2FA_CHALLENGE',
        email: user.email,
      });
      // We don't want the frontend to treat this as fully authenticated.
      // So we return an explicit flag requiring 2fa.
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
    });`;

if (content.includes(oldLoginTokenGen)) {
  content = content.replace(oldLoginTokenGen, newLoginTokenGen);
}


// 3. Add 2FA controllers at the end
const twoFactorControllers = `

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

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
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
`;

content += twoFactorControllers;
fs.writeFileSync(authControllerPath, content);
console.log('authController.js updated');
