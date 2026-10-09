import crypto from 'crypto';
import speakeasy from 'speakeasy';

// Configuration
// Using a 256-bit encryption key (32 bytes) mapped from env or throwing error
const getEncryptionKey = () => {
  const key = process.env.TWO_FACTOR_SECRET_KEY;
  if (!key || key.length !== 64) {
    return null;
  }
  return Buffer.from(key, 'hex');
};

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

export const is2FAConfigured = () => {
  return getEncryptionKey() !== null;
};

export const encryptSecret = (secret) => {
  const key = getEncryptionKey();
  if (!key) throw new Error('2FA Encryption Key is missing or invalid');

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decryptSecret = (encryptedString) => {
  const key = getEncryptionKey();
  if (!key) throw new Error('2FA Encryption Key is missing or invalid');

  const parts = encryptedString.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted secret format');
  
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

export const generateTOTPSecret = () => {
  const secret = speakeasy.generateSecret({ length: 20 });
  return secret.base32;
};

export const generateProvisioningURI = (email, secret) => {
  return speakeasy.otpauthURL({ secret, label: encodeURIComponent(email), issuer: 'HRMS Portal', encoding: 'base32' });
};

export const verifyTOTPCode = (token, secret) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow a bit of time drift
  });
};

export const generateRecoveryCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex') + '-' + crypto.randomBytes(4).toString('hex');
    codes.push(code);
  }
  return codes;
};
