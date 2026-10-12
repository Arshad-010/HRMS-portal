# HRMS Direct Messaging (Phase 6) — Specification & Documentation

## 1. Overview
The **HRMS Direct Messaging** module enables secure, real-time, one-to-one communication between employees within the HRMS portal. It is built directly into the existing JWT authentication and Socket.IO infrastructure, ensuring end-to-end security, instant message delivery, accurate read receipts, unread message badges, and responsive UI across desktop and mobile devices.

---

## 2. Architecture & Data Models

### 2.1 Conversation Model (`backend/src/models/Conversation.js`)
| Field | Type | Description |
|---|---|---|
| `participants` | `[ObjectId]` (ref: `User`) | Array of user IDs authorized in the conversation |
| `type` | `String` (`'DIRECT'` \| `'GROUP'`) | Conversation type (Phase 6 focuses on `'DIRECT'`) |
| `lastMessage` | `ObjectId` (ref: `Message`) | Pointer to the latest message in the conversation |
| `lastMessageAt` | `Date` | Timestamp of the latest message for sorted conversation list |
| `unreadCount` | `Map` | Real-time map of unread counters per participant |

**Indexes:**
- Compound index `{ participants: 1, lastMessageAt: -1 }` for high-throughput authorized conversation listing.

### 2.2 Message Model (`backend/src/models/Message.js`)
| Field | Type | Description |
|---|---|---|
| `conversationId` | `ObjectId` (ref: `Conversation`) | Conversation reference |
| `sender` | `ObjectId` (ref: `User`) | Authenticated sender user ID |
| `text` | `String` | Message content (max 5000 characters) |
| `type` | `String` (`'TEXT'`, `'TASK'`, `'MEETING'`, `'FILE'`) | Message type |
| `readBy` | `[{ user: ObjectId, readAt: Date }]` | Read receipts with reader ID and timestamp |
| `isEdited` | `Boolean` | True if the message has been edited |
| `isDeleted` | `Boolean` | True if soft-deleted (text replaced with 'This message was deleted') |
| `reactions` | `[{ user: ObjectId, emoji: String }]` | Emoji reactions per message |
| `createdAt` / `updatedAt` | `Date` | Automatic Mongoose timestamps |

**Indexes:**
- Compound index `{ conversationId: 1, createdAt: -1 }` for optimized pagination queries.

---

## 3. Security Implementation

1. **Authentication:**
   - All REST routes are protected by `protect` JWT middleware.
   - Socket connections require verified JWT tokens passed via handshake auth/headers.
   - Client-supplied user IDs are **never trusted**; identities are strictly resolved via `req.user._id` or `socket.user._id`.
2. **Conversation Authorization:**
   - Every read (`GET /messages`), write (`POST /messages`), update (`PUT /messages/:msgId`), delete (`DELETE /messages/:msgId`), and read receipt (`PUT /read`) strictly checks `participants: req.user._id`.
   - Any attempt to access, post to, or modify a conversation without membership returns `403 Forbidden`.
   - On Socket.IO, joining a conversation room (`join_conversation`) checks database membership; non-members are rejected with a `socket:error` event.
3. **Payload Validation:**
   - Message text is trimmed and cannot be empty (returns `400 Bad Request`).
   - Message text length is capped at 5000 characters (returns `400 Bad Request`).
   - Self-conversations are prohibited (returns `400 Bad Request`).
4. **Data Privacy:**
   - Participant details only expose name, designation, department, and profile image. Sensitive fields (passwords, salts, banking info) are excluded.

---

## 4. REST API Reference

All routes require header: `Authorization: Bearer <token>`.

### 4.1 `GET /api/chat/conversations`
Retrieves all direct conversations where the authenticated user is a participant, sorted by `lastMessageAt` descending. Each item includes populated participants, latest message, and user-specific `unreadCount`.

### 4.2 `POST /api/chat/conversations`
Creates or retrieves an existing direct conversation with an eligible employee.
- **Request Body:**
  ```json
  { "userId": "6acce7af1faa82e60902a892" }
  ```
- **Response:** `200 OK` with conversation object.

### 4.3 `GET /api/chat/conversations/:id/messages`
Fetches paginated message history for an authorized conversation.
- **Query Parameters:**
  - `limit`: Number of messages (default: `50`, max: `100`).
  - `page`: Page index (default: `1`).
  - `before`: ISO 8601 timestamp cursor for infinite scrolling / loading earlier messages.
- **Response:**
  ```json
  {
    "success": true,
    "data": [...messages],
    "pagination": { "total": 42, "count": 20, "hasMore": true, "page": 1, "limit": 20 }
  }
  ```

### 4.4 `POST /api/chat/conversations/:id/messages`
Sends a message to an authorized conversation. Persists message in MongoDB before broadcasting over Socket.IO.
- **Request Body:**
  ```json
  { "text": "Hello, Bob!" }
  ```
- **Response:** `201 Created` with formatted message object.

### 4.5 `PUT /api/chat/conversations/:id/read`
Marks all unread messages in the conversation as read by the authenticated user.
- Emits `message:read` event to the conversation room.
- **Response:** `200 OK` `{ "success": true, "message": "Conversation marked as read" }`.

### 4.6 `PUT /api/chat/conversations/:id/messages/:msgId`
Edits a message sent by the authenticated user.
- **Request Body:** `{ "text": "Updated message" }`
- Emits `message:update` event to the conversation room.

### 4.7 `DELETE /api/chat/conversations/:id/messages/:msgId`
Soft-deletes a message sent by the authenticated user.
- Emits `message:delete` event to the conversation room.

### 4.8 `GET /api/chat/users`
Lists active employees eligible for direct messaging (excludes the requesting user).

---

## 5. Real-Time Socket.IO Protocol

### 5.1 Client -> Server Events
| Event | Payload | Behavior |
|---|---|---|
| `join_conversation` | `conversationId` | Verifies user membership in database before joining room `conversation:${id}`. Emits `socket:error` if unauthorized. |
| `leave_conversation` | `conversationId` | Leaves socket room `conversation:${id}`. |
| `typing:start` | `conversationId` | Emits typing state to other room participants. |
| `typing:stop` | `conversationId` | Emits stop-typing state to other room participants. |
| `message:read` | `{ conversationId, messageIds }` | Broadcasts read status to participants. |

### 5.2 Server -> Client Events
| Event | Room / Destination | Payload | Description |
|---|---|---|---|
| `message:new` | `conversation:${id}` | Message object | Delivered in real-time to active conversation participants. |
| `chat:unread_update` | `<userId>` (Private) | `{ conversationId }` | Emitted to recipients' private rooms to increment unread counter. |
| `message:read` | `conversation:${id}` | `{ conversationId, userId, messageIds, readAt }` | Informs sender of message read status. |
| `message:update` | `conversation:${id}` | Updated message object | Informs participants of edited text or reaction. |
| `message:delete` | `conversation:${id}` | `{ messageId, conversationId }` | Informs participants of message deletion. |
| `typing:start` | `conversation:${id}` | `{ conversationId, userId, user }` | Typing animation trigger. |
| `typing:stop` | `conversation:${id}` | `{ conversationId, userId }` | Stop typing animation. |
| `presence:online` | Global broadcast | `{ userId }` | Sets user presence dot to green. |
| `presence:offline` | Global broadcast | `{ userId, lastSeen }` | Sets user presence dot to offline. |
| `socket:error` | Calling socket | `{ message }` | Emitted when an unauthorized room join or error occurs. |

---

## 6. Frontend Components

- **`Chat.jsx` (`frontend/src/pages/Chat.jsx`):**
  Full-height split layout with conversation sidebar and active chat window. Supports responsive mobile view with one-click back button navigation.
- **`ChatSidebar.jsx` (`frontend/src/components/chat/ChatSidebar.jsx`):**
  - Search conversation & employee filter.
  - Active tabs: "Chats" (recent conversations with unread pills and timestamps) and "Directory" (all eligible employees with role badges).
  - Online/offline presence indicators.
- **`ChatWindow.jsx` (`frontend/src/components/chat/ChatWindow.jsx`):**
  - "Load earlier messages" cursor pagination button.
  - Real-time typing indicators (`typingUsers`).
  - Read receipts (double blue checkmarks when read).
  - Offline warning banner when socket disconnects.
  - Quick action toolbar (call-out tasks, meetings, emoji reactions).
- **`MessageComposer.jsx` (`frontend/src/components/chat/MessageComposer.jsx`):**
  - Multi-line textarea with auto-resizing.
  - Typing indicator emitter with debounce.
  - Enter to send, Shift+Enter for new line.
- **`Sidebar.jsx` (`frontend/src/components/layout/Sidebar.jsx`):**
  - Chat navigation item dynamically displays `totalUnreadChatCount` badge pill.

---

## 7. Verification & Automated Tests

Run backend direct messaging test suite:
```bash
npm run test:chat
```

### Test Results Summary:
```
======================================================
🧪 HRMS DIRECT MESSAGING (PHASE 6) INTEGRATION TESTS
======================================================
1. Connecting to MongoDB...                             ✅ PASS
2. Starting HTTP & Socket.IO test server...             ✅ PASS
3. Setting up test users (Alice, Bob, Charlie)...       ✅ PASS
4. Conversation Creation & Authorization Rules:
   - Self-conversation blocked (400)                    ✅ PASS
   - Non-existent user blocked (404)                    ✅ PASS
   - Direct conversation creation (200)                 ✅ PASS
   - Idempotent conversation lookup                     ✅ PASS
5. Real-time Socket.IO & Room Authorization:
   - Authenticated socket connections                   ✅ PASS
   - Unauthorized User C denied room access             ✅ PASS
6. Message Sending, Persistence & Delivery:
   - Message persisted in MongoDB                       ✅ PASS
   - Real-time delivery to recipient User B             ✅ PASS
   - Unauthorized User C receives no message           ✅ PASS
7. Message Validation Rules:
   - Empty message text rejected (400)                  ✅ PASS
   - Exceeding 5000 characters rejected (400)           ✅ PASS
8. Message History & Server-Side Pagination:
   - Limit-based query respects pagination              ✅ PASS
   - Metadata accurately reports hasMore                ✅ PASS
9. Security & Unauthorized Access Rejection:
   - User C cannot read messages (403)                  ✅ PASS
   - User C cannot post messages (403)                  ✅ PASS
   - User C cannot mark conversation as read (403)      ✅ PASS
   - User C cannot delete messages (403)                ✅ PASS
10. Read Receipts & Unread Counts:
   - Unread count computed per user                     ✅ PASS
   - Conversation marked as read (200)                  ✅ PASS
   - Socket.IO message:read event emitted               ✅ PASS
   - Unread count drops to 0                            ✅ PASS
11. Chat Users Directory API:
   - Returns active eligible employees                  ✅ PASS
   - Current user excluded from list                    ✅ PASS
======================================================
🎉 TEST SUMMARY: 25 PASSED, 0 FAILED
======================================================
```
