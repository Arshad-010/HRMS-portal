import admin from 'firebase-admin';
import { cert, getApps } from 'firebase-admin/app';

export const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return admin;
  }

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.warn('Firebase Admin credentials are not fully configured in the environment.');
    return null;
  }

  try {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    // Handle both raw newlines and escaped \n characters
    const formattedKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

    admin.initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedKey,
      }),
    });
    console.log('Firebase Admin initialized successfully.');
    return admin;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error.message);
    return null;
  }
};

export { admin };
