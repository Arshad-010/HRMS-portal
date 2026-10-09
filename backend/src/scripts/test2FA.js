import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import speakeasy from 'speakeasy';

dotenv.config();

const runTests = async () => {
  logger.info('Starting Automated 2FA Backend Tests...');

  let server;
  let testPort = 5100;

  try {
    await connectDB();

    server = app.listen(testPort);
    const baseUrl = 'http://localhost:' + testPort + '/api';

    const empEmail = 'test2fa@hrms.portal';
    const empPassword = 'Password123!';
    await User.deleteMany({ email: empEmail });

    const user = new User({
      email: empEmail,
      password: empPassword,
      role: 'EMPLOYEE',
    });
    await user.save();

    // TEST 1: Login normally (No 2FA)
    let loginRes = await fetch(baseUrl + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: empEmail, password: empPassword }),
    });
    let loginData = await loginRes.json();
    
    if (loginData.success && !loginData.requires2FA && loginData.data.token) {
      console.log('✅ TEST 1 PASSED: Normal login succeeds without 2FA challenge');
    } else {
      throw new Error('TEST 1 FAILED: Expected normal login');
    }

    const token = loginData.data.token;

    // TEST 2: Start Setup
    let setupRes = await fetch(baseUrl + '/auth/2fa/setup', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
    });
    let setupData = await setupRes.json();
    
    if (setupData.success && setupData.data.secret && setupData.data.qrCode) {
      console.log('✅ TEST 2 PASSED: 2FA setup started successfully');
    } else {
      throw new Error('TEST 2 FAILED: Failed to start setup');
    }

    const secret = setupData.data.secret;

    // TEST 3: Verify Setup with invalid code
    let verifyRes = await fetch(baseUrl + '/auth/2fa/verify-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ code: '000000' }),
    });
    let verifyData = await verifyRes.json();
    
    if (!verifyData.success) {
      console.log('✅ TEST 3 PASSED: Invalid setup code rejected');
    } else {
      throw new Error('TEST 3 FAILED: Invalid setup code was accepted');
    }

    // TEST 4: Verify Setup with valid code
    const validCode = speakeasy.totp({ secret, encoding: 'base32' });
    verifyRes = await fetch(baseUrl + '/auth/2fa/verify-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ code: validCode }),
    });
    verifyData = await verifyRes.json();
    
    let recoveryCodes = [];
    if (verifyData.success && verifyData.data.recoveryCodes.length === 10) {
      console.log('✅ TEST 4 PASSED: Valid setup code accepted, 2FA enabled, recovery codes generated');
      recoveryCodes = verifyData.data.recoveryCodes;
    } else {
      throw new Error('TEST 4 FAILED: Valid setup code failed');
    }

    // TEST 5: Login with 2FA enabled returns challenge
    loginRes = await fetch(baseUrl + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: empEmail, password: empPassword }),
    });
    loginData = await loginRes.json();
    
    if (loginData.success && loginData.requires2FA && loginData.data.token) {
      console.log('✅ TEST 5 PASSED: Login returns 2FA challenge');
    } else {
      throw new Error('TEST 5 FAILED: Login did not return challenge');
    }

    const challengeToken = loginData.data.token;

    // TEST 6: Challenge token cannot access protected routes
    let meRes = await fetch(baseUrl + '/auth/me', {
      headers: { 'Authorization': 'Bearer ' + challengeToken },
    });
    if (meRes.status === 401) {
      console.log('✅ TEST 6 PASSED: Challenge token blocked from protected routes');
    } else {
      throw new Error('TEST 6 FAILED: Challenge token bypassed protect middleware');
    }

    // TEST 7: Complete 2FA login with valid TOTP
    const loginCode = speakeasy.totp({ secret, encoding: 'base32' });
    let completeLoginRes = await fetch(baseUrl + '/auth/2fa/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + challengeToken },
      body: JSON.stringify({ code: loginCode }),
    });
    let completeLoginData = await completeLoginRes.json();
    
    if (completeLoginData.success && completeLoginData.data.token) {
      console.log('✅ TEST 7 PASSED: 2FA Login succeeds with valid TOTP');
    } else {
      throw new Error('TEST 7 FAILED: 2FA Login failed');
    }

    // TEST 8: Complete 2FA login with Recovery Code
    loginRes = await fetch(baseUrl + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: empEmail, password: empPassword }),
    });
    loginData = await loginRes.json();
    const challengeToken2 = loginData.data.token;

    completeLoginRes = await fetch(baseUrl + '/auth/2fa/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + challengeToken2 },
      body: JSON.stringify({ code: recoveryCodes[0], isRecoveryCode: true }),
    });
    completeLoginData = await completeLoginRes.json();
    
    if (completeLoginData.success && completeLoginData.data.token) {
      console.log('✅ TEST 8 PASSED: 2FA Login succeeds with Recovery Code');
    } else {
      throw new Error('TEST 8 FAILED: 2FA Login with recovery code failed');
    }

    const finalToken = completeLoginData.data.token;

    // TEST 9: Disable 2FA
    const disableCode = speakeasy.totp({ secret, encoding: 'base32' });
    let disableRes = await fetch(baseUrl + '/auth/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + finalToken },
      body: JSON.stringify({ password: empPassword, code: disableCode }),
    });
    let disableData = await disableRes.json();
    
    if (disableData.success) {
      console.log('✅ TEST 9 PASSED: 2FA successfully disabled');
    } else {
      throw new Error('TEST 9 FAILED: 2FA disable failed');
    }

  } catch (error) {
    logger.error('Tests Failed: ' + error.message);
    console.error(error);
  } finally {
    if (server) {
      server.close();
      logger.info('Test server stopped.');
    }
    await disconnectDB();
    process.exit(0);
  }
};

runTests();
