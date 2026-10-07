import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token
 * @param {Object} payload - Object containing { id, role, email }
 * @returns {String} Signed JWT token string
 */
export const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify a JWT token and decode its payload
 * @param {String} token - Raw JWT token string
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }

  return jwt.verify(token, secret);
};
