/**
 * verifyPhase7Full.js
 * End-to-end HTTP and contract verification for Phase 7 against live backend & frontend
 */

import fs from 'fs';
import path from 'path';

const BACKEND_URL = 'http://localhost:5001/api';

const runVerification = async () => {
  console.log('🚀 Starting Comprehensive Phase 7 End-to-End Verification against live server...');
  let passed = 0;
  let total = 0;

  const assert = (condition, msg) => {
    total++;
    if (condition) {
      console.log(`✅ TEST ${total} PASSED: ${msg}`);
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  };

  try {
    // 1. Health check
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', 'Live backend is healthy and responding');

    // 2. Admin Login
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@hrms.portal',
        password: 'AdminSecure@2026!',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.data?.token, 'Admin authentication successful with JWT issued');
    const adminToken = loginData.data.token;
    const adminAuthHeader = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // 3. GET /api/notifications
    const notifsRes = await fetch(`${BACKEND_URL}/notifications`, { headers: adminAuthHeader });
    const notifsData = await notifsRes.json();
    assert(notifsRes.status === 200 && notifsData.success, 'GET /api/notifications returned 200 OK');
    assert(Array.isArray(notifsData.data.notifications), 'Notifications response has notifications array');

    // 4. GET /api/notifications/unread
    const unreadRes = await fetch(`${BACKEND_URL}/notifications/unread`, { headers: adminAuthHeader });
    const unreadData = await unreadRes.json();
    assert(unreadRes.status === 200 && typeof unreadData.data.unreadCount === 'number', 'GET /api/notifications/unread returned numerical count');

    // 5. Test PATCH /api/notifications/read-all
    const readAllRes = await fetch(`${BACKEND_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: adminAuthHeader,
    });
    const readAllData = await readAllRes.json();
    assert(readAllRes.status === 200 && readAllData.success, 'PATCH /api/notifications/read-all succeeded');

    // 6. Verify unread count is now 0
    const unreadAfterRes = await fetch(`${BACKEND_URL}/notifications/unread`, { headers: adminAuthHeader });
    const unreadAfterData = await unreadAfterRes.json();
    assert(unreadAfterData.data.unreadCount === 0, 'Unread count is exactly 0 after mark-all-read');

    // 7. GET /api/activity
    const actRes = await fetch(`${BACKEND_URL}/activity`, { headers: adminAuthHeader });
    const actData = await actRes.json();
    assert(actRes.status === 200 && actData.success, 'GET /api/activity returned 200 OK');
    assert(Array.isArray(actData.data.logs), 'Activity logs returned as array');

    // 8. Activity filtering by entityType
    const actFilterRes = await fetch(`${BACKEND_URL}/activity?entityType=DEPARTMENT`, { headers: adminAuthHeader });
    assert(actFilterRes.status === 200, 'GET /api/activity with entityType filter returned 200 OK');

    // 9. Sensitive data leakage verification
    const allLogs = actData.data.logs;
    const hasSensitiveData = allLogs.some((l) => {
      const str = JSON.stringify(l).toLowerCase();
      return str.includes('password') || str.includes('hash') || str.includes('secret') || str.includes('jwt');
    });
    assert(!hasSensitiveData, 'Zero passwords, hashes, tokens, or secrets found in audit logs');

    // 10. Frontend contract & build verification
    const frontendDist = path.resolve(process.cwd(), '../frontend/dist/index.html');
    const distExists = fs.existsSync(frontendDist);
    assert(distExists, 'Frontend production distribution bundle verified (dist/index.html exists)');

    // 11. Check Frontend routes and components exist
    const notifsPage = path.resolve(process.cwd(), '../frontend/src/pages/Notifications.jsx');
    const activityPage = path.resolve(process.cwd(), '../frontend/src/pages/Activity.jsx');
    const notifContext = path.resolve(process.cwd(), '../frontend/src/context/NotificationContext.jsx');
    assert(fs.existsSync(notifsPage) && fs.existsSync(activityPage) && fs.existsSync(notifContext), 'All Phase 7 frontend source files confirmed');

    console.log(`\n🎉 ALL ${passed} LIVE VERIFICATION CHECKS PASSED SUCCESSFULLY!\n`);
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  }
};

runVerification();
