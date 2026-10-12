# HRMS Portal — Comprehensive API Documentation

> **API Version**: 1.0.0  
> **Base URL**: `http://localhost:5001/api` (Production: `https://your-domain.com/api`)  
> **Socket.IO Endpoint**: `ws://localhost:5001` (Production: `wss://your-domain.com`)  
> **Authentication**: Bearer Token in `Authorization` header (`Bearer <JWT>`)

---

## Table of Contents
1. [Authentication & Security](#1-authentication--security)
2. [Employees & Profile Management](#2-employees--profile-management)
3. [Departments](#3-departments)
4. [Attendance Tracking](#4-attendance-tracking)
5. [Leave Management](#5-leave-management)
6. [Task Delegation & Lifecycle](#6-task-delegation--lifecycle)
7. [Notifications (REST)](#7-notifications-rest)
8. [Direct Messaging & Group Chat (REST)](#8-direct-messaging--group-chat-rest)
9. [Activity & Audit Logs](#9-activity--audit-logs)
10. [Dashboard & Analytics](#10-dashboard--analytics)
11. [Socket.IO Real-Time Protocol Specification](#11-socketio-real-time-protocol-specification)
12. [Standard Response & Error Codes](#12-standard-response--error-codes)

---

## 1. Authentication & Security

### `POST /auth/login`
Authenticates a user with email and password or triggers 2FA challenge.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "employee@example.com",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "6accf29202929ba16bc410df",
      "email": "employee@example.com",
      "role": "EMPLOYEE",
      "twoFactorEnabled": false
    }
  }
  ```

### `POST /auth/google`
Authenticates using Firebase Google SSO idToken.
- **Access**: Public
- **Request Body**: `{ "idToken": "firebase_id_token" }`
- **Response `200 OK`**: `{ "success": true, "token": "...", "user": { ... } }`

### `GET /auth/me`
Retrieves current authenticated session profile.
- **Access**: Private (Authenticated)
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: User document with linked Employee object (salary redacted for regular employees).

### `POST /auth/change-password`
Updates user password after validating current password.
- **Access**: Private (Authenticated)
- **Request Body**: `{ "currentPassword": "...", "newPassword": "..." }`
- **Response `200 OK`**: `{ "success": true, "message": "Password changed successfully" }`

### `POST /auth/2fa/setup` & `POST /auth/2fa/verify`
Initializes TOTP QR code and enables two-factor authentication.
- **Access**: Private (Authenticated)

---

## 2. Employees & Profile Management

### `GET /employees`
Lists organization employees with pagination, filtering, and role scoping.
- **Access**: Private (`ADMIN`, `HR`, `MANAGER`)
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `department`: Filter by Department ID
  - `status`: `ACTIVE`, `INACTIVE`, `TERMINATED`, `ON_LEAVE`
  - `search`: Filter by name, code, or email
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "employees": [...],
      "total": 45,
      "page": 1,
      "pages": 5
    }
  }
  ```

### `GET /employees/:id`
Retrieves detailed profile of a single employee.
- **Access**: Private (Owner, Manager of employee, `ADMIN`, `HR`)
- **Response `200 OK`**: Full employee profile. *Note: `salary` is stripped unless requester is `ADMIN` or `HR`.*

### `POST /employees`
Onboards a new employee record and seeds User credentials.
- **Access**: Private (`ADMIN`, `HR`)
- **Request Body**:
  ```json
  {
    "firstName": "Alex",
    "lastName": "Morgan",
    "email": "alex.morgan@company.com",
    "departmentId": "6ac8bfe9ac5def181e96a800",
    "designation": "Software Engineer",
    "joiningDate": "2026-10-15",
    "salary": 95000,
    "reportingManagerId": "6ac8bfecac5def181e96a84e"
  }
  ```
- **Response `201 Created`**: Created employee document with auto-generated `employeeCode` (`EMP-100X`).

### `PUT /employees/:id`
Updates employee record.
- **Access**: Private (`ADMIN`, `HR`)

### `DELETE /employees/:id`
Soft deactivates or archives an employee.
- **Access**: Private (`ADMIN`)

---

## 3. Departments

### `GET /departments`
Lists all company departments.
- **Access**: Private (All Authenticated)
- **Response `200 OK`**: Array of departments with manager populate.

### `POST /departments`
Creates an organizational department.
- **Access**: Private (`ADMIN`, `HR`)
- **Request Body**: `{ "name": "Engineering", "code": "ENG", "description": "Tech & R&D" }`

### `PUT /departments/:id` & `DELETE /departments/:id`
Modify or deactivate departments.
- **Access**: Private (`ADMIN`)

---

## 4. Attendance Tracking

### `POST /attendance/check-in`
Self-service daily punch-in. Records timestamp and marks status `PRESENT`.
- **Access**: Private (Authenticated Employees)
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": {
      "status": "PRESENT",
      "checkIn": "2026-10-12T09:00:00.000Z",
      "date": "2026-10-12T00:00:00.000Z"
    }
  }
  ```

### `POST /attendance/check-out`
Self-service daily punch-out. Automatically calculates decimal `workHours`.
- **Access**: Private (Authenticated Employees)
- **Response `200 OK`**: Returns updated record with `checkOut` and `workHours: 8.5`.

### `GET /attendance/my`
Retrieves current user's attendance punch status for today and recent logs.
- **Access**: Private (Authenticated Employees)

### `GET /attendance`
List attendance logs scoped by role and filterable by date, status, department.
- **Access**: Private (`ADMIN`, `HR`, `MANAGER`, `EMPLOYEE` own only)

### `POST /attendance` (Manual Entry)
Administrative punch override.
- **Access**: Private (`ADMIN`, `HR`)

---

## 5. Leave Management

### `POST /leaves`
Submits a leave request with balance verification and overlapping date collision protection.
- **Access**: Private (Authenticated Employees)
- **Request Body**:
  ```json
  {
    "leaveType": "CASUAL",
    "startDate": "2026-11-10",
    "endDate": "2026-11-12",
    "reason": "Family vacation"
  }
  ```
- **Response `201 Created`**: Leave document created with status `PENDING` and server-calculated `numberOfDays: 3`.

### `GET /leaves/my`
Lists current employee's leave balance quotas and submitted leave requests.
- **Access**: Private (Authenticated Employees)

### `GET /leaves`
Retrieves pending and historic leave requests with role-scoped visibility.
- **Access**: Private (`ADMIN`, `HR`, `MANAGER`, `EMPLOYEE` own only)

### `PATCH /leaves/:id/approve`
Approves a pending leave request, atomically deducts quota, and updates daily Attendance to `ON_LEAVE`.
- **Access**: Private (Reporting `MANAGER`, `ADMIN`, `HR`)
- **Request Body**: `{ "reviewerComment": "Approved. Enjoy your break!" }`
- **Response `200 OK`**: Updated leave document.

### `PATCH /leaves/:id/reject`
Rejects a leave request with mandatory or optional reason.
- **Access**: Private (Reporting `MANAGER`, `ADMIN`, `HR`)

### `POST /leaves/:id/cancel`
Cancels an approved or pending leave, restoring deducted quotas atomically.
- **Access**: Private (Leave Owner or `ADMIN`)

---

## 6. Task Delegation & Lifecycle

### `POST /tasks`
Creates and delegates a task to an employee in an authorized department.
- **Access**: Private (`ADMIN`, `HR`, `MANAGER`)
- **Request Body**:
  ```json
  {
    "title": "Upgrade Socket.IO Gateway",
    "description": "Implement heartbeat ping/pong and reconnection backoff",
    "department": "6ac8bfe9ac5def181e96a800",
    "assignedTo": "6ac8bfecac5def181e96a84e",
    "priority": "HIGH",
    "dueDate": "2026-10-25"
  }
  ```
- **Response `201 Created`**: Task document initialized with status `TODO`.

### `GET /tasks` & `GET /tasks/my`
Retrieve tasks with multi-field filters (`status`, `priority`, `department`, `overdue`).
- **Access**: Private (Role-scoped)

### `PATCH /tasks/:id/status`
Advances task through lifecycle (`TODO` -> `IN_PROGRESS` -> `REVIEW` -> `COMPLETED`).
- **Access**: Private (Assignee, Task Creator, `MANAGER`, `HR`, `ADMIN`)
- **Request Body**: `{ "status": "COMPLETED" }`
- **Response `200 OK`**: Updated task; automatically populates `completedAt`.

### `PUT /tasks/:id` & `DELETE /tasks/:id`
Modify or delete tasks.
- **Access**: Private (`ADMIN`, `HR`, Creator `MANAGER`)

---

## 7. Notifications (REST)

### `GET /notifications`
Retrieves paginated notifications for the current authenticated user.
- **Access**: Private (Owner only)
- **Query Parameters**: `page=1`, `limit=20`, `unreadOnly=false`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "notifications": [...],
      "total": 12,
      "unreadCount": 3,
      "page": 1,
      "pages": 1
    }
  }
  ```

### `GET /notifications/unread`
Returns real-time unread count.
- **Access**: Private (Owner only)
- **Response `200 OK`**: `{ "success": true, "unreadCount": 3 }`

### `PATCH /notifications/:id/read`
Marks a specific notification as read and emits synchronized Socket.IO unread count update.
- **Access**: Private (Owner only)

### `PATCH /notifications/read-all`
Marks all user notifications as read.
- **Access**: Private (Owner only)

### `DELETE /notifications/:id`
Deletes notification from inbox.
- **Access**: Private (Owner only)

---

## 8. Direct Messaging & Group Chat (REST)

### `GET /chat/users`
Lists eligible employees available for starting direct conversations.
- **Access**: Private (Authenticated)
- **Response `200 OK`**: List of active employees with IDs, names, designations, and departments (excludes requester).

### `POST /chat/conversations`
Creates or retrieves an existing one-to-one direct conversation (idempotent).
- **Access**: Private (Authenticated)
- **Request Body**: `{ "participantId": "6accf29202929ba16bc410f2" }`
- **Response `200 OK`**: Returns existing or created conversation document.

### `GET /chat/conversations`
Lists all conversations (direct and group) belonging to the authenticated user.
- **Access**: Private (Authenticated)
- **Response `200 OK`**: Conversations sorted by `updatedAt` with `lastMessage` and `unreadCount`.

### `GET /chat/conversations/:id/messages`
Retrieves paginated messages for a conversation.
- **Access**: Private (Authorized Conversation Member only; returns `403` otherwise)
- **Query Parameters**: `limit=50`, `before=<messageId>`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "messages": [...],
      "hasMore": false
    }
  }
  ```

### `POST /chat/conversations/:id/messages`
Sends a message to a direct conversation or group channel.
- **Access**: Private (Authorized Conversation Member only)
- **Request Body**:
  ```json
  {
    "text": "The release builds are verified and passing.",
    "attachments": []
  }
  ```
- **Response `201 Created`**: Persisted message object; simultaneously broadcasts to socket room.

### `PUT /chat/conversations/:id/read`
Marks all incoming messages in the conversation as read by current user.
- **Access**: Private (Authorized Conversation Member only)
- **Response `200 OK`**: Clears unread badge count for this channel.

### `POST /chat/groups`
Creates a new team or department group conversation.
- **Access**: Private (`ADMIN`, `HR`, `MANAGER`)
  - *Note: `EMPLOYEE` is restricted (`403 Forbidden`).*
  - *Note: `MANAGER` can only add team members within their department/direct reports.*
- **Request Body**:
  ```json
  {
    "name": "Backend Engineering",
    "description": "Core API discussions & release updates",
    "members": ["6accf29202929ba16bc410df", "6accf29202929ba16bc410f2"]
  }
  ```
- **Response `201 Created`**: New Group conversation document with creator set as admin.

### `GET /chat/groups/:id`
Retrieves group details and full member list with designations.
- **Access**: Private (Group Members, `ADMIN`, `HR`)

### `PUT /chat/groups/:id`
Updates group title or description.
- **Access**: Private (Group Admins, `ADMIN`, `HR`)

### `POST /chat/groups/:id/members`
Adds new members to the group.
- **Access**: Private (Group Admins, `ADMIN`, `HR`)
- **Request Body**: `{ "memberIds": ["6accf29202929ba16bc410e5"] }`

### `DELETE /chat/groups/:id/members/:userId`
Removes a member from the group. Immediately evicts user from real-time socket room.
- **Access**: Private (Group Admins, `ADMIN`, `HR`)

### `POST /chat/groups/:id/leave`
Voluntarily exits the group.
- **Access**: Private (Active Group Members)

---

## 9. Activity & Audit Logs

### `GET /activity`
Retrieves tamper-evident organizational activity logs.
- **Access**: Private (Role-scoped: `ADMIN` sees all; `HR` sees org/personnel; `MANAGER` sees team; `EMPLOYEE` sees self)
- **Query Parameters**: `page=1`, `limit=20`, `action=LEAVE_APPROVED`, `startDate=`, `endDate=`

---

## 10. Dashboard & Analytics

### `GET /dashboard/stats`
Organization-wide summary KPIs (total staff, present count, leaves today, tasks).
- **Access**: Private (`ADMIN`, `HR`)

### `GET /dashboard/manager`
Team management metrics (direct reports present, pending leaves, overdue tasks).
- **Access**: Private (`MANAGER`)

### `GET /dashboard/employee`
Employee self-service dashboard summary (today's clock-in, leave balances, pending tasks).
- **Access**: Private (All Authenticated)

### `GET /analytics/attendance` & `GET /analytics/leaves`
Aggregated trends and department distributions.
- **Access**: Private (`ADMIN`, `HR`)

---

## 11. Socket.IO Real-Time Protocol Specification

### 11.1 Connection & Handshake Authentication
Client connects with a verified JWT token in the auth payload or query parameters:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
  auth: { token: localStorage.getItem('token') },
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});
```

The server automatically joins the socket to the user's isolated private personal room:
`socket.join(user._id.toString())`.

### 11.2 Client Emitted Events

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `join_conversation` | `conversationId: string` | Verifies participant authorization. If authorized, joins `conversation:<id>`. |
| `leave_conversation` | `conversationId: string` | Leaves room `conversation:<id>`. |
| `typing:start` | `conversationId: string` | Broadcasts typing indicator to other room members. |
| `typing:stop` | `conversationId: string` | Clears typing indicator in room. |
| `message:read` | `{ conversationId, messageIds }` | Broadcasts read status to other room members. |

### 11.3 Server Emitted Events

| Event Name | Target Room | Payload | Description |
| :--- | :--- | :--- | :--- |
| `notification:new` | `<userId>` | Notification Document | Pushes persisted notification to user. |
| `notification:unread_count`| `<userId>` | `{ unreadCount: number }` | Synchronizes live unread notification badge. |
| `message:new` | `conversation:<id>` | `{ conversationId, message }` | Delivers new chat message to active viewers. |
| `message:read` | `conversation:<id>` | `{ conversationId, userId, readAt }`| Updates read receipts in chat view. |
| `typing:start` | `conversation:<id>` | `{ conversationId, userId, user }` | Displays "User is typing..." indicator. |
| `typing:stop` | `conversation:<id>` | `{ conversationId, userId }` | Hides typing indicator. |
| `presence:online` | Global broadcast | `{ userId }` | Notifies user connection status. |
| `presence:offline` | Global broadcast | `{ userId, lastSeen }` | Notifies user disconnection status. |
| `group:updated` | `conversation:<id>` | Group conversation document | Broadcasts rename or details modification. |
| `group:member_added` | `conversation:<id>` | `{ member }` | Notifies that a member joined the group. |
| `group:member_removed` | `conversation:<id>` | `{ userId }` | Notifies group members of removal. |
| `group:removed_you` | `<userId>` | `{ conversationId }` | Direct event to evicted user to close view. |
| `group:member_left` | `conversation:<id>` | `{ userId }` | Notifies members that a user voluntarily left. |

---

## 12. Standard Response & Error Codes

All REST API endpoints adhere to consistent JSON structures:

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response (`400`, `401`, `403`, `404`, `500`)
```json
{
  "success": false,
  "message": "Detailed error message explanation",
  "error": "OPTIONAL_ERROR_CODE"
}
```

| HTTP Status | Meaning | Typical Scenario |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Retrieval, update, or successful action. |
| `201 Created` | Resource created | Created employee, leave request, message, task, or group. |
| `400 Bad Request` | Validation failure | Missing required fields, duplicate punch, invalid date range. |
| `401 Unauthorized` | Authentication required | Missing, expired, or invalid JWT token. |
| `403 Forbidden` | Insufficient permissions | Role restricted (e.g. employee creating group, accessing other salary). |
| `404 Not Found` | Entity not found | Invalid entity ID or deleted resource. |
| `409 Conflict` | Unique constraint | Duplicate check-in on the same date. |
| `500 Server Error` | Unhandled exception | Database failure or unhandled server error. |
