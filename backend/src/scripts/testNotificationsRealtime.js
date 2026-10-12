import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { io as ClientIO } from 'socket.io-client';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { createNotification } from '../services/notificationService.js';
import { initSocket } from '../socket.js';
import app from '../app.js';

const PORT = 5099; // Dedicated test port to avoid conflicting with dev server
let server;
let userA, userB;
let tokenA, tokenB;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runRealtimeNotificationTests() {
  console.log('\n======================================================');
  console.log('🧪 REAL-TIME NOTIFICATION SYSTEM INTEGRATION TESTS');
  console.log('======================================================\n');

  try {
    // 1. Connect to Database
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ MongoDB connected successfully\n');

    // 2. Start HTTP & Socket.IO server on test port
    console.log(`2. Starting HTTP & Socket.IO test server on port ${PORT}...`);
    server = http.createServer(app);
    initSocket(server);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`   ✅ Test server listening on http://localhost:${PORT}\n`);

    // 3. Setup Test Users
    console.log('3. Setting up test users (User A & User B)...');
    userA = await User.findOne({ email: 'test_alice_rt@example.com' });
    if (!userA) {
      userA = await User.create({
        email: 'test_alice_rt@example.com',
        password: 'Password123!',
        role: 'EMPLOYEE',
        isActive: true,
      });
    }

    userB = await User.findOne({ email: 'test_bob_rt@example.com' });
    if (!userB) {
      userB = await User.create({
        email: 'test_bob_rt@example.com',
        password: 'Password123!',
        role: 'MANAGER',
        isActive: true,
      });
    }

    tokenA = jwt.sign({ id: userA._id, role: userA.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign({ id: userB._id, role: userB.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('   ✅ User A (Alice):', userA._id.toString());
    console.log('   ✅ User B (Bob):', userB._id.toString(), '\n');

    // Clean previous notifications for test users
    await Notification.deleteMany({ recipient: { $in: [userA._id, userB._id] } });

    // 4. Test Socket Authentication Security
    console.log('4. Testing Socket Authentication Security...');

    // 4a. Connect with NO token -> MUST fail
    let unauthFailedAsExpected = false;
    try {
      const unauthClient = ClientIO(`http://localhost:${PORT}`, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 2000,
      });
      await new Promise((resolve, reject) => {
        unauthClient.on('connect_error', (err) => {
          if (err.message.includes('Authentication error')) {
            unauthFailedAsExpected = true;
          }
          unauthClient.disconnect();
          resolve();
        });
        unauthClient.on('connect', () => {
          unauthClient.disconnect();
          reject(new Error('Unauthenticated socket connected unexpectedly!'));
        });
      });
    } catch (err) {
      // expected
    }
    if (!unauthFailedAsExpected) {
      throw new Error('Security check failed: Socket connected without JWT token!');
    }
    console.log('   ✅ Socket connection rejected without JWT token');

    // 4b. Connect with INVALID token -> MUST fail
    let invalidTokenFailedAsExpected = false;
    try {
      const invalidClient = ClientIO(`http://localhost:${PORT}`, {
        auth: { token: 'invalid_malformed_token_xyz' },
        transports: ['websocket'],
        reconnection: false,
        timeout: 2000,
      });
      await new Promise((resolve, reject) => {
        invalidClient.on('connect_error', (err) => {
          if (err.message.includes('Authentication error')) {
            invalidTokenFailedAsExpected = true;
          }
          invalidClient.disconnect();
          resolve();
        });
        invalidClient.on('connect', () => {
          invalidClient.disconnect();
          reject(new Error('Invalid token connected unexpectedly!'));
        });
      });
    } catch (err) {}
    if (!invalidTokenFailedAsExpected) {
      throw new Error('Security check failed: Socket connected with invalid JWT token!');
    }
    console.log('   ✅ Socket connection rejected with forged/invalid token');

    // 4c. Connect with Valid Tokens for User A and User B
    const clientA = ClientIO(`http://localhost:${PORT}`, {
      auth: { token: tokenA },
      transports: ['websocket'],
      reconnection: false,
    });
    await new Promise((resolve, reject) => {
      clientA.on('connect', resolve);
      clientA.on('connect_error', reject);
    });
    console.log('   ✅ User A authenticated and connected (Socket ID:', clientA.id, ')');

    const clientB = ClientIO(`http://localhost:${PORT}`, {
      auth: { token: tokenB },
      transports: ['websocket'],
      reconnection: false,
    });
    await new Promise((resolve, reject) => {
      clientB.on('connect', resolve);
      clientB.on('connect_error', reject);
    });
    console.log('   ✅ User B authenticated and connected (Socket ID:', clientB.id, ')\n');

    // 5. Test Targeted Real-time Emission and Isolation
    console.log('5. Testing Targeted Real-time Emission and User Isolation...');

    let userAReceivedNotif = null;
    let userBReceivedNotif = null;

    clientA.on('notification:new', (notif) => {
      userAReceivedNotif = notif;
    });

    clientB.on('notification:new', (notif) => {
      userBReceivedNotif = notif;
    });

    // Create notification specifically for User A
    const createdNotif = await createNotification({
      recipient: userA._id,
      type: 'TASK_ASSIGNED',
      title: 'Q4 Frontend Audit Task',
      message: 'Please complete the Q4 frontend audit tasks by Friday.',
    });

    // Wait 500ms for socket delivery
    await sleep(500);

    if (!userAReceivedNotif) {
      throw new Error('User A did not receive the real-time notification!');
    }
    if (userAReceivedNotif.title !== 'Q4 Frontend Audit Task') {
      throw new Error(`Notification payload mismatch: ${userAReceivedNotif.title}`);
    }
    console.log('   ✅ User A received real-time notification:', userAReceivedNotif.title);

    if (userBReceivedNotif !== null) {
      throw new Error('SECURITY VIOLATION: User B received private notification intended for User A!');
    }
    console.log('   ✅ User B did NOT receive User A\'s notification (User isolation verified)');

    // 6. Test Unread Count Real-time Synchronization
    console.log('\n6. Testing Unread Count Real-time Synchronization...');
    let unreadCountA = null;
    clientA.on('notification:unread_count', (data) => {
      unreadCountA = data.unreadCount;
    });

    await createNotification({
      recipient: userA._id,
      type: 'LEAVE_APPROVED',
      title: 'Annual Leave Approved',
      message: 'Your leave application has been approved by your manager.',
    });

    await sleep(500);
    console.log('   ✅ Real-time unread_count received by User A:', unreadCountA);
    if (unreadCountA !== 2) {
      throw new Error(`Expected unreadCount = 2, got ${unreadCountA}`);
    }

    // 7. Test REST APIs: Fetching, Marking One Read, Marking All Read
    console.log('\n7. Testing REST APIs & Real-time State Synchronization...');

    // Fetch notifications via REST
    const resGet = await fetch(`http://localhost:${PORT}/api/notifications`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataGet = await resGet.json();
    if (!dataGet.success || dataGet.data.notifications.length !== 2) {
      throw new Error('REST GET /api/notifications failed or returned incorrect length');
    }
    console.log('   ✅ REST GET /api/notifications returned 2 persisted notifications');

    // Mark single notification as read
    let readAckReceived = false;
    clientA.on('notification:read', (data) => {
      if (data.notificationId === createdNotif._id.toString()) {
        readAckReceived = true;
      }
    });

    const resMarkRead = await fetch(`http://localhost:${PORT}/api/notifications/${createdNotif._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataMarkRead = await resMarkRead.json();
    if (!dataMarkRead.success || !dataMarkRead.data.isRead) {
      throw new Error('REST PATCH /api/notifications/:id/read failed');
    }

    await sleep(400);
    if (!readAckReceived) {
      throw new Error('Real-time notification:read socket event not received on markAsRead');
    }
    console.log('   ✅ REST PATCH markAsRead succeeded and emitted real-time sync event');

    // Mark all as read
    let allReadAckReceived = false;
    clientA.on('notification:all_read', () => {
      allReadAckReceived = true;
    });

    const resMarkAll = await fetch(`http://localhost:${PORT}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataMarkAll = await resMarkAll.json();
    if (!dataMarkAll.success) {
      throw new Error('REST PATCH /api/notifications/read-all failed');
    }

    await sleep(400);
    if (!allReadAckReceived) {
      throw new Error('Real-time notification:all_read socket event not received on markAllAsRead');
    }
    console.log('   ✅ REST PATCH markAllAsRead succeeded and emitted real-time sync event');

    // 8. Test Offline Retrieval / Missed Notifications
    console.log('\n8. Testing Offline Persistence & Missed Notification Catch-up...');

    // Disconnect Bob
    clientB.disconnect();
    console.log('   - User B went offline (disconnected socket)');

    // Create notifications while Bob is offline
    await createNotification({
      recipient: userB._id,
      type: 'DIRECT_MESSAGE',
      title: 'New Direct Message',
      message: 'Alice sent you a direct message.',
    });

    await createNotification({
      recipient: userB._id,
      type: 'SYSTEM',
      title: 'System Security Notice',
      message: 'New login detected from verified session.',
    });

    console.log('   - 2 notifications persisted in MongoDB while User B was offline');

    // Reconnect Bob
    const clientBReconnected = ClientIO(`http://localhost:${PORT}`, {
      auth: { token: tokenB },
      transports: ['websocket'],
      reconnection: false,
    });
    await new Promise((resolve, reject) => {
      clientBReconnected.on('connect', resolve);
      clientBReconnected.on('connect_error', reject);
    });
    console.log('   - User B reconnected to socket');

    // Fetch unread count & notifications via REST after reconnection
    const resBobMissed = await fetch(`http://localhost:${PORT}/api/notifications`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const dataBobMissed = await resBobMissed.json();
    if (!dataBobMissed.success || dataBobMissed.data.notifications.length !== 2) {
      throw new Error('Offline notifications were not preserved in MongoDB for User B');
    }
    console.log('   ✅ User B successfully retrieved 2 missed notifications upon reconnection');

    // 9. Test Deduplication
    console.log('\n9. Testing Notification Deduplication Safeguard...');
    const duplicate1 = await createNotification({
      recipient: userA._id,
      type: 'ATTENDANCE_REMINDER',
      title: 'Shift Punch In Reminder',
      message: 'Please remember to punch in.',
    });

    const duplicate2 = await createNotification({
      recipient: userA._id,
      type: 'ATTENDANCE_REMINDER',
      title: 'Shift Punch In Reminder',
      message: 'Please remember to punch in.',
    });

    if (duplicate1._id.toString() !== duplicate2._id.toString()) {
      throw new Error('Deduplication failed: Duplicate notification was created within window');
    }
    console.log('   ✅ Duplicate notification prevented (reused ID:', duplicate1._id.toString(), ')');

    // Cleanup sockets
    clientA.disconnect();
    clientBReconnected.disconnect();

    // Clean test data
    await Notification.deleteMany({ recipient: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ email: { $in: ['test_alice_rt@example.com', 'test_bob_rt@example.com'] } });

    console.log('\n======================================================');
    console.log('🎉 ALL REAL-TIME NOTIFICATION SYSTEM TESTS PASSED!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    process.exit(0);
  }
}

runRealtimeNotificationTests();
