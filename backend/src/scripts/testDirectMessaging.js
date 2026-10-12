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
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { initSocket } from '../socket.js';
import app from '../app.js';

const PORT = 5098; // Dedicated test port
let server;
let userA, userB, userC;
let tokenA, tokenB, tokenC;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runDirectMessagingTests() {
  console.log('\n======================================================');
  console.log('🧪 HRMS DIRECT MESSAGING (PHASE 6) INTEGRATION TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, name, details = '') => {
    if (condition) {
      console.log(`   ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  let clientA, clientB, clientC;

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
    console.log('3. Setting up test users (User A - Alice, User B - Bob, User C - Charlie)...');
    userA = await User.findOneAndUpdate(
      { email: 'chat_alice_test@example.com' },
      { email: 'chat_alice_test@example.com', password: 'Password123!', role: 'EMPLOYEE', isActive: true },
      { upsert: true, new: true }
    );

    userB = await User.findOneAndUpdate(
      { email: 'chat_bob_test@example.com' },
      { email: 'chat_bob_test@example.com', password: 'Password123!', role: 'EMPLOYEE', isActive: true },
      { upsert: true, new: true }
    );

    userC = await User.findOneAndUpdate(
      { email: 'chat_charlie_test@example.com' },
      { email: 'chat_charlie_test@example.com', password: 'Password123!', role: 'EMPLOYEE', isActive: true },
      { upsert: true, new: true }
    );

    tokenA = jwt.sign({ id: userA._id, role: userA.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign({ id: userB._id, role: userB.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    tokenC = jwt.sign({ id: userC._id, role: userC.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log(`   ✅ User A: ${userA._id}`);
    console.log(`   ✅ User B: ${userB._id}`);
    console.log(`   ✅ User C (Attacker/Unauthorized): ${userC._id}\n`);

    // Clean previous test conversations & messages for these users
    await Conversation.deleteMany({ participants: { $in: [userA._id, userB._id, userC._id] } });
    await Message.deleteMany({ sender: { $in: [userA._id, userB._id, userC._id] } });

    // 4. Test Conversation Creation & Membership Validation
    console.log('4. Testing Conversation Creation & Authorization Rules...');

    // 4a. Self conversation prevention
    const selfRes = await fetch(`http://localhost:${PORT}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ userId: userA._id.toString() }),
    });
    assert(selfRes.status === 400, 'Cannot create direct conversation with oneself');

    // 4b. Invalid / non-existent user
    const nonExistentRes = await fetch(`http://localhost:${PORT}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ userId: new mongoose.Types.ObjectId().toString() }),
    });
    assert(nonExistentRes.status === 404, 'Cannot create conversation with non-existent user');

    // 4c. Valid Direct Conversation between User A & User B
    const createRes = await fetch(`http://localhost:${PORT}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ userId: userB._id.toString() }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 200 && createData.success === true, 'Successfully created direct conversation');
    const conversationId = createData.data._id;
    assert(!!conversationId, 'Conversation ID generated and returned');

    // 4d. Idempotent check (same conversation returned when requested again by User B)
    const getSameRes = await fetch(`http://localhost:${PORT}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ userId: userA._id.toString() }),
    });
    const getSameData = await getSameRes.json();
    assert(
      getSameRes.status === 200 && getSameData.data._id.toString() === conversationId.toString(),
      'Idempotent conversation lookup returns existing direct conversation'
    );

    // 5. Test Socket.IO Authentication & Conversation Room Access
    console.log('\n5. Testing Real-time Socket.IO Connection & Room Authorization...');

    clientA = ClientIO(`http://localhost:${PORT}`, {
      auth: { token: tokenA },
      transports: ['websocket'],
    });

    clientB = ClientIO(`http://localhost:${PORT}`, {
      auth: { token: tokenB },
      transports: ['websocket'],
    });

    clientC = ClientIO(`http://localhost:${PORT}`, {
      auth: { token: tokenC },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise((res) => clientA.on('connect', res)),
      new Promise((res) => clientB.on('connect', res)),
      new Promise((res) => clientC.on('connect', res)),
    ]);
    assert(clientA.connected && clientB.connected && clientC.connected, 'All users authenticated to Socket.IO');

    // User A and User B join the conversation room
    clientA.emit('join_conversation', conversationId);
    clientB.emit('join_conversation', conversationId);
    await sleep(200);

    // User C attempts to join User A & B's conversation room -> MUST receive socket:error
    let userCDeniedJoin = false;
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve();
      }, 5000);

      clientC.once('socket:error', (err) => {
        clearTimeout(timer);
        if (err && err.message && err.message.includes('Not authorized')) {
          userCDeniedJoin = true;
        }
        resolve();
      });

      clientC.emit('join_conversation', conversationId);
    });
    assert(userCDeniedJoin, 'Unauthorized User C is denied joining conversation room');

    // 6. Test Message Sending & Real-time Delivery
    console.log('\n6. Testing Message Sending, Persistence & Real-time Delivery...');

    let userBReceivedMsg = null;
    let userCReceivedMsg = null;

    clientB.on('message:new', (msg) => {
      userBReceivedMsg = msg;
    });
    clientC.on('message:new', (msg) => {
      userCReceivedMsg = msg;
    });

    // 6a. User A sends message to conversation
    const sendRes = await fetch(`http://localhost:${PORT}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ text: 'Hello Bob! This is Alice.' }),
    });
    const sendData = await sendRes.json();
    assert(sendRes.status === 201 && sendData.success === true, 'Message successfully sent and persisted');
    const messageId = sendData.data._id;

    // Verify DB persistence
    const savedMsg = await Message.findById(messageId);
    assert(
      savedMsg && savedMsg.text === 'Hello Bob! This is Alice.',
      'Message persisted in MongoDB before broadcasting'
    );

    await sleep(400);

    // Verify real-time delivery
    assert(
      userBReceivedMsg && userBReceivedMsg.text === 'Hello Bob! This is Alice.',
      'Message received in real-time by recipient User B'
    );
    assert(userCReceivedMsg === null, 'Message NOT delivered to unauthorized User C');

    // 7. Test Message Validation Rules
    console.log('\n7. Testing Message Validation Rules...');

    // 7a. Empty text
    const emptyRes = await fetch(`http://localhost:${PORT}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ text: '    ' }),
    });
    assert(emptyRes.status === 400, 'Empty message text is rejected with 400 Bad Request');

    // 7b. Exceeding 5000 characters
    const longText = 'a'.repeat(5001);
    const longRes = await fetch(`http://localhost:${PORT}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ text: longText }),
    });
    assert(longRes.status === 400, 'Message exceeding 5000 characters is rejected with 400 Bad Request');

    // 8. Test Message History & Server-Side Pagination
    console.log('\n8. Testing Message History & Pagination...');

    // Send 3 more messages
    await fetch(`http://localhost:${PORT}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ text: 'Hi Alice! Great to hear from you.' }),
    });
    await fetch(`http://localhost:${PORT}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ text: 'Did you review the quarterly report?' }),
    });
    await fetch(`http://localhost:${PORT}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ text: 'Yes, looking good!' }),
    });

    const historyRes = await fetch(`http://localhost:${PORT}/api/chat/conversations/${conversationId}/messages?limit=2`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const historyData = await historyRes.json();
    assert(
      historyRes.status === 200 && historyData.data.length === 2,
      'Paginated history respects limit=2'
    );
    assert(
      historyData.pagination && historyData.pagination.hasMore === true,
      'Pagination metadata accurately reports hasMore=true'
    );

    // 9. Test Unauthorized Access Security (User C vs Conversation of A & B)
    console.log('\n9. Testing Security: Rejection of Unauthorized Conversation Access...');

    // 9a. User C reading conversation messages -> 403 Forbidden
    const unauthReadRes = await fetch(`http://localhost:${PORT}/api/chat/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    assert(unauthReadRes.status === 403, 'Unauthorized User C cannot read conversation messages (403 Forbidden)');

    // 9b. User C sending message to conversation -> 403 Forbidden
    const unauthSendRes = await fetch(`http://localhost:${PORT}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenC}` },
      body: JSON.stringify({ text: 'Imposter message from Charlie!' }),
    });
    assert(unauthSendRes.status === 403, 'Unauthorized User C cannot post to conversation (403 Forbidden)');

    // 9c. User C marking conversation as read -> 403 Forbidden
    const unauthMarkRes = await fetch(`http://localhost:${PORT}/api/chat/conversations/${conversationId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    assert(unauthMarkRes.status === 403, 'Unauthorized User C cannot mark conversation as read (403 Forbidden)');

    // 9d. User C attempting to delete Alice's message -> 403 Forbidden
    const unauthDeleteRes = await fetch(
      `http://localhost:${PORT}/api/chat/conversations/${conversationId}/messages/${messageId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenC}` },
      }
    );
    assert(unauthDeleteRes.status === 403, 'Unauthorized User C cannot delete another user\'s message (403 Forbidden)');

    // 10. Test Read Receipts & Unread Count Update
    console.log('\n10. Testing Read Receipts & Unread Count Management...');

    // Check User B's conversations unread count before reading
    const convsBeforeRes = await fetch(`http://localhost:${PORT}/api/chat/conversations`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const convsBefore = await convsBeforeRes.json();
    const convForBBefore = convsBefore.data.find((c) => c._id.toString() === conversationId.toString());
    assert(convForBBefore && convForBBefore.unreadCount > 0, 'User B has unread messages');

    // User B marks conversation as read
    let readEventReceived = false;
    clientA.on('message:read', (data) => {
      if (data.conversationId.toString() === conversationId.toString()) {
        readEventReceived = true;
      }
    });

    const readRes = await fetch(`http://localhost:${PORT}/api/chat/conversations/${conversationId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(readRes.status === 200, 'Conversation successfully marked as read');

    await sleep(300);
    assert(readEventReceived, 'Sender User A received message:read event via Socket.IO');

    // Check User B's unread count after reading
    const convsAfterRes = await fetch(`http://localhost:${PORT}/api/chat/conversations`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const convsAfter = await convsAfterRes.json();
    const convForBAfter = convsAfter.data.find((c) => c._id.toString() === conversationId.toString());
    assert(convForBAfter && convForBAfter.unreadCount === 0, 'Unread count drops to 0 after marking as read');

    // 11. Test Chat Users Directory API
    console.log('\n11. Testing Chat Users Directory API (/api/chat/users)...');
    const directoryRes = await fetch(`http://localhost:${PORT}/api/chat/users`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const directoryData = await directoryRes.json();
    assert(directoryRes.status === 200 && Array.isArray(directoryData.data), 'Chat directory returns user list');
    const selfInList = directoryData.data.some((u) => u._id.toString() === userA._id.toString());
    assert(!selfInList, 'Current user is excluded from chat directory list');

    console.log('\n======================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution encountered an unhandled error:', error);
    process.exit(1);
  } finally {
    if (clientA) clientA.disconnect();
    if (clientB) clientB.disconnect();
    if (clientC) clientC.disconnect();
    if (server) server.close();
    await mongoose.disconnect();
    console.log('Teardown complete.\n');
  }
}

runDirectMessagingTests();
