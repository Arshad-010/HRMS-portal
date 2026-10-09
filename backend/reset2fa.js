import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.updateMany({}, { 
    $set: { twoFactorEnabled: false },
    $unset: { twoFactorSecretEncrypted: "", twoFactorRecoveryCodeHashes: "", twoFactorPendingSecretEncrypted: "", twoFactorPendingExpiresAt: "" }
  });
  console.log('Successfully reset all users 2FA');
  process.exit(0);
});
