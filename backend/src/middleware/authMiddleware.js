import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * Authentication guard middleware
 * Extracts and verifies JWT from Authorization header, attaching user to request
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: No authentication token provided',
    });
  }

  try {
    const decoded = verifyToken(token);

    // Verify user still exists in database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: The user belonging to this token no longer exists',
      });
    }

    if (decoded.role === '2FA_CHALLENGE') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: 2FA challenge token cannot access protected resources',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator or HR',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired: Please log in again',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
    });
  }
};

/**
 * Role-Based Access Control (RBAC) authorization middleware
 * @param  {...String} roles - Allowed roles e.g. ('ADMIN', 'HR')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user?.role || 'ANONYMOUS'}' is not authorized to access this resource`,
      });
    }
    next();
  };
};
