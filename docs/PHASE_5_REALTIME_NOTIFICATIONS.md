# Phase 5 — Real-Time Notification System Architecture

This document describes the design, security, event specifications, and deployment requirements for the Socket.IO real-time notification system in the HRMS Portal.

---

## 1. Architecture Overview

The real-time notification system integrates Socket.IO with the existing Express backend, JWT authentication, and MongoDB `Notification` collection.

```
┌────────────────────────────────────────────────────────┐
│                   Frontend Client                      │
│                                                        │
│  ┌─────────────────┐ ┌───────────────────────────────┐ │
│  │  SocketContext  │ │      NotificationContext      │ │
│  │ (Single WS Conn)│ │ (Toasts, Unread Badge, State) │ │
│  └────────┬────────┘ └───────────────▲───────────────┘ │
└───────────┼──────────────────────────┼─────────────────┘
            │ WS (Bearer JWT)          │ Socket Events
            ▼                          │
┌────────────────────────────────────────────────────────┐
│                   Backend Server                       │
│                                                        │
│  ┌─────────────────┐         ┌───────────────────────┐ │
│  │ Socket.IO Server│────────►│  Verified User Room   │ │
│  │  (JWT Auth MW)  │         │  (socket.join(userId))│ │
│  └────────▲────────┘         └───────────────▲───────┘ │
│           │                                  │         │
│           │ Emits via io.to(userId)          │         │
│  ┌────────┴──────────────┐                   │         │
│  │  notificationService  │───────────────────┘         │
│  └────────▲──────────────┘                             │
│           │ Persist First                              │
│  ┌────────┴──────────────┐                             │
│  │    MongoDB Storage    │                             │
│  └───────────────────────┘                             │
└────────────────────────────────────────────────────────┘
```

### Guiding Principles
1. **Zero Client Spoofing:** Sockets are authenticated exclusively via cryptographically verified JWT tokens. Client-provided user IDs are never trusted for room assignment or event emission.
2. **Strict User Isolation:** Each authenticated socket joins a room uniquely identified by the user's verified MongoDB `_id` (`userId.toString()`). Private notifications are never broadcast to other users.
3. **Persist Before Emit:** All notifications are saved to MongoDB before emitting over WebSocket. If a recipient is offline or temporarily disconnected, the notification is safely stored and retrievable upon reconnect.
4. **Offline Reconnection Catch-Up:** When the socket reconnects after being offline, the frontend immediately queries `/api/notifications/unread` and `/api/notifications` to fetch missed notifications.
5. **Deduplication Safeguard:** A 5-second sliding window prevents duplicate notifications from being created or emitted.

---

## 2. Authentication & Connection Security

- **Handshake Authentication:** The client sends the JWT via `auth: { token }` (or `Authorization: Bearer <token>` header).
- **Validation:**
  ```javascript
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');
  if (!user || user.isActive === false) throw new Error('Authentication error');
  socket.user = user;
  socket.join(user._id.toString());
  ```
- **Credentials Protection:** Raw JWT tokens and credentials are never printed to server logs.
- **CORS Protection:** Dynamic origin verification allows configured origins (`CORS_ORIGIN`, `FRONTEND_URL`) and localhost ports (`5173`, `5174`).

---

## 3. Real-Time Event Catalog

### Server-to-Client Events

| Event Name | Recipient Room | Payload Structure | Trigger Scenario |
| :--- | :--- | :--- | :--- |
| `notification:new` | `userId` | `Notification` document (`_id`, `type`, `title`, `message`, `relatedEntityType`, `relatedEntityId`, `isRead`, `createdAt`) | New notification created and saved in DB |
| `notification:unread_count` | `userId` | `{ unreadCount: Number }` | Unread count changes (new alert, marked read, deleted) |
| `notification:read` | `userId` | `{ notificationId: String, unreadCount: Number }` | Single notification marked as read in any tab/device |
| `notification:all_read` | `userId` | `{ unreadCount: 0 }` | All notifications marked as read |
| `notification:deleted` | `userId` | `{ notificationId: String, unreadCount: Number }` | Notification deleted from inbox |
| `message:new` | `conversation:id` | `Message` document | Direct or group chat message sent |
| `presence:online` | Broadcast | `{ userId: String }` | User connected to WebSocket |
| `presence:offline` | Broadcast | `{ userId: String, lastSeen: Date }` | User disconnected from WebSocket |

### Client-to-Server Events

| Event Name | Payload | Security Validation |
| :--- | :--- | :--- |
| `join_conversation` | `conversationId` | Verified against MongoDB `Conversation.participants` |
| `leave_conversation`| `conversationId` | Removes socket from `conversation:id` room |
| `typing:start` | `conversationId` | Broadcasts only to participants in that conversation room |
| `typing:stop` | `conversationId` | Broadcasts only to participants in that conversation room |
| `message:read` | `{ conversationId, messageIds }` | Broadcasts read receipts to conversation participants |

---

## 4. Business Event Triggers

1. **Leave Management (`leaveController.js`):**
   - Employee submits leave &rarr; HR and Reporting Manager notified (`LEAVE_APPLIED`)
   - Manager/HR approves leave &rarr; Employee notified (`LEAVE_APPROVED`)
   - Manager/HR rejects leave &rarr; Employee notified with reviewer reason (`LEAVE_REJECTED`)
   - Approved leave cancelled &rarr; Reviewer notified (`LEAVE_CANCELLED`)

2. **Task Management (`taskController.js`):**
   - Manager assigns task &rarr; Assignee notified with title & priority (`TASK_ASSIGNED`)
   - Status updated or completed &rarr; Assigner notified (`TASK_STATUS_CHANGED` / `TASK_COMPLETED`)

3. **Chat & Team Communication (`chatController.js`):**
   - Direct message received &rarr; Recipient notified with sender name & preview (`DIRECT_MESSAGE`)
   - Group message received &rarr; Group participants notified with group name (`GROUP_MESSAGE`)

4. **Attendance (`attendanceController.js`):**
   - Workday check-in &rarr; Employee notified (`ATTENDANCE_CHECKIN`)
   - Workday check-out &rarr; Employee notified with total shift duration (`ATTENDANCE_CHECKOUT`)
   - System reminders &rarr; Scheduled shifts (`ATTENDANCE_REMINDER`)

---

## 5. Frontend UI Components

1. **`SocketContext.jsx`:**
   - Centralized singleton WebSocket connection using `socket.io-client`.
   - Reusable across notifications and chat (prevents multiple duplicate connections).
   - Manages automatic reconnection and reconnection state.

2. **`NotificationContext.jsx`:**
   - Listens to `notification:new`, `notification:unread_count`, `notification:read`, `notification:all_read`, and `notification:deleted`.
   - Catches up and refreshes state on `connect` and `reconnect`.
   - Dispatches DOM events (`hrms:notification:new`) for active pages.

3. **`NotificationToast.jsx`:**
   - Modern enterprise floating toast in the top-right corner.
   - Dynamic icon and color badge based on notification type.
   - 5-second auto-dismiss with progress bar animation and hover-pause support.
   - Clicking navigates directly to `/leaves`, `/tasks`, `/chat`, `/attendance`, or `/notifications`.

4. **`Navbar.jsx`:**
   - Live badge counter on bell icon (`unreadCount`) with animated pulse.
   - Real-time indicator dot showing active WebSocket connection.
   - Popover list supporting direct navigation to chat and details.

5. **`Notifications.jsx`:**
   - Real-time list updates dynamically without page reloads.

---

## 6. Environment Variables

### Backend (`backend/.env`)
```env
PORT=5001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret_key_hrms_portal_2026
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5001/api
```

---

## 7. Testing & Verification

A dedicated automated test suite is provided in `backend/src/scripts/testNotificationsRealtime.js`:

```bash
# Run real-time notification integration tests:
cd backend
npm run test:notifications
```

### Verification Checklist Covered:
- [x] Socket connection rejected without token.
- [x] Socket connection rejected with malformed/forged token.
- [x] Authenticated recipient receives targeted notification in real time.
- [x] Unauthorized user does NOT receive other users' private notifications.
- [x] REST unread count API returns accurate count in real time.
- [x] Marking single notification as read updates database and emits sync event.
- [x] Marking all notifications as read updates database and resets unread count.
- [x] Offline user retrieves persisted notifications upon reconnecting.
- [x] Duplicate notification prevention within 5-second window.
