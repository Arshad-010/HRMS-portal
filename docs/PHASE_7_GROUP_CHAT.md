# HRMS Group Chat and Team Management (Phase 7) — Specification & Documentation

## 1. Overview
The **HRMS Group Chat and Team Management** module enables authorized Administrators, HR specialists, and Team Leaders / Managers to create, configure, and manage real-time group conversation channels across their departments and project teams.

---

## 2. Architecture & Data Models

### 2.1 Conversation Model (`backend/src/models/Conversation.js`)
Extended with group channel attributes:
| Field | Type | Description |
|---|---|---|
| `name` | `String` | Channel title (2-100 characters) |
| `description` | `String` | Channel mission / purpose |
| `type` | `String` (`'DIRECT'` \| `'GROUP'`) | Conversation type |
| `groupType` | `String` (`'GENERAL'`, `'DEPARTMENT'`, `'PROJECT'`) | Classification category |
| `creator` | `ObjectId` (ref: `User`) | User who originally created the group |
| `admins` | `[ObjectId]` (ref: `User`) | Array of user IDs authorized to manage the group |
| `participants` | `[ObjectId]` (ref: `User`) | Active channel members |
| `departmentId` | `ObjectId` (ref: `Department`) | Optional department association for department-scoped groups |
| `lastMessage` | `ObjectId` (ref: `Message`) | Pointer to the latest message |
| `lastMessageAt` | `Date` | Timestamp of latest message for sort order |

**Database Indexes:**
- `{ participants: 1, lastMessageAt: -1 }` (compound index for fast user conversation retrieval)
- `{ type: 1, participants: 1 }` (filtered group queries)
- `{ departmentId: 1 }` (department-level indexing)

---

## 3. RBAC & Security Matrix

| Role | Create Groups | Add / Remove Members | Edit Channel Settings | Participate in Chat | Leave Group |
|---|:---:|:---:|:---:|:---:|:---:|
| **ADMIN** | Any across org | Any user across org | Any group across org | Yes | Yes |
| **HR** | Any across org | Any user across org | Any group across org | Yes | Yes |
| **MANAGER** | Authorized team / dept | Authorized team / dept | Groups they admin / created | Yes | Yes |
| **EMPLOYEE** | No (403 Forbidden) | No (403 Forbidden) | No (403 Forbidden) | In joined groups | Yes |

### Real-Time Security Safeguards
1. **Immediate Revocation on Removal:**
   - When a member is removed via `DELETE /api/chat/groups/:id/members/:userId`, the server queries all active Socket.IO connections for that user and forcefully executes `socket.leave('conversation:${id}')`.
   - A `group:removed_you` event is emitted directly to the target user's private room, instructing their client to clear the active conversation and remove the channel.
2. **Double-layer Room Authorization:**
   - On `join_conversation`, the socket checks database membership before admitting the socket to the room. Unauthorized clients receive `socket:error`.
3. **Payload Sanitization & Strict Identification:**
   - User identities are derived strictly from server-verified JWT credentials (`req.user._id` / `socket.user._id`).
   - Message length is validated (1-5000 characters) and persisted to MongoDB *prior* to socket broadcasting.

---

## 4. REST API Reference

All requests require header: `Authorization: Bearer <token>`.

### 4.1 `POST /api/chat/groups`
Creates a new group conversation.
- **Allowed Roles:** `ADMIN`, `HR`, `MANAGER`
- **Request Body:**
  ```json
  {
    "name": "Engineering Core Standup",
    "description": "Daily standup and coordination",
    "groupType": "DEPARTMENT",
    "memberIds": ["6acceca81faa82e60902bb02"]
  }
  ```
- **Response:** `201 Created` with enriched group conversation object.

### 4.2 `GET /api/chat/groups/:id`
Retrieves group details and populated participants.
- **Access:** Only authorized members of the group, or org admins.
- **Response:** `200 OK` with full group metadata, admin lists, and participant employee profiles.

### 4.3 `PUT /api/chat/groups/:id`
Updates group title, description, or group type.
- **Access:** `ADMIN`, `HR`, or group administrators (`admins`).
- **Request Body:**
  ```json
  {
    "name": "Engineering Core Team",
    "description": "Updated channel description"
  }
  ```
- **Response:** `200 OK`. Broadcasts `group:updated` over Socket.IO to room members.

### 4.4 `POST /api/chat/groups/:id/members`
Adds new members to an existing group.
- **Access:** `ADMIN`, `HR`, or group administrators. Managers can only add eligible team/department members.
- **Request Body:**
  ```json
  {
    "memberIds": ["6acceca81faa82e60902baff"]
  }
  ```
- **Response:** `200 OK`. Broadcasts `group:members_added` to room and `conversation:new` to new members.

### 4.5 `DELETE /api/chat/groups/:id/members/:userId`
Removes a member from the group.
- **Access:** `ADMIN`, `HR`, or group administrators. Creator cannot be removed by non-admins.
- **Response:** `200 OK`. Immediately revokes socket room access and emits `group:member_removed`.

### 4.6 `POST /api/chat/groups/:id/leave`
Voluntarily leaves a group.
- **Access:** Any active group member.
- **Response:** `200 OK`. Emits `group:member_left` to remaining participants.

### 4.7 `GET /api/chat/conversations?type=GROUP`
Retrieves all group channels the current user belongs to, with real-time unread counts.

---

## 5. Real-Time Socket.IO Protocol

| Event | Direction | Payload | Description |
|---|:---:|---|---|
| `group:updated` | Server -> Room | `conversation` object | Emitted to `conversation:${id}` when group title or description is updated. |
| `group:members_added` | Server -> Room | `{ conversationId, newMemberIds, conversation }` | Emitted when new members join the group. |
| `group:member_removed` | Server -> Room | `{ conversationId, userId, conversation }` | Emitted when a member is removed by an admin. |
| `group:removed_you` | Server -> User | `{ conversationId }` | Emitted to removed user's private room to immediately clear active view. |
| `group:member_left` | Server -> Room | `{ conversationId, userId }` | Emitted when a participant voluntarily departs. |
| `message:new` | Server -> Room | `message` object | Real-time message broadcast to all active room members. |
| `chat:unread_update` | Server -> User | `{ conversationId }` | Emitted to each member's private room to update sidebar unread badges. |

---

## 6. Frontend UI Components

1. **`ChatSidebar.jsx`:**
   - Filter segmented controls: **All**, **Direct**, **Groups**, and **Directory**.
   - Distinctive visual treatment for group channels with group icons, member count pills, and sender prefixes in latest message previews (`Alice: Standup in 10 mins`).
   - Prominent **"+ New Group"** launcher button visible to authorized roles (`ADMIN`, `HR`, `MANAGER`).
2. **`CreateGroupModal.jsx`:**
   - Channel creation dialog with name, category dropdown (`General`, `Department`, `Project`), and description.
   - Searchable teammate picker with department filter and selection counters.
3. **`GroupDetailsDrawer.jsx`:**
   - Slide-over channel panel.
   - Shows participant list with `Creator` and `Admin` status badges, designations, and live presence dots.
   - In-line member search to add new colleagues.
   - Member removal action for authorized admins.
   - Channel renaming and description editor.
   - "Leave Channel" button with confirmation modal.
4. **`ChatWindow.jsx`:**
   - Group-aware header displaying channel title, member count, and trigger button for Channel Details Drawer.
   - Sender names prominently rendered on message bubbles to easily distinguish multiple speakers.

---

## 7. Automated Test Results

Run group chat tests:
```bash
npm run test:groups
```

```
======================================================
🧪 HRMS GROUP CHAT & TEAM MANAGEMENT (PHASE 7) TESTS
======================================================
1. Connecting to MongoDB...                             ✅ PASS
2. Starting HTTP & Socket.IO test server on port 5097...✅ PASS
3. Setting up test departments, employees & users...    ✅ PASS
4. Testing Group Creation RBAC Permissions:
   - Employees blocked from creating groups (403)       ✅ PASS
   - Managers restricted to authorized team/dept (403)  ✅ PASS
   - Manager creates authorized team group (201)        ✅ PASS
   - Admin creates organization-wide group (201)        ✅ PASS
5. Testing Group Details & Membership Access:
   - Authorized member reads group details (200)        ✅ PASS
   - Unauthorized non-member denied group details (403) ✅ PASS
6. Testing Real-time Socket.IO & Room Authorization:
   - Sockets authenticated with JWT                     ✅ PASS
   - Unauthorized user denied group socket room         ✅ PASS
7. Testing Group Message Sending & Delivery:
   - Group message posted and persisted in MongoDB      ✅ PASS
   - Message delivered in real time to member           ✅ PASS
   - Message NOT delivered to non-member                ✅ PASS
   - Non-member cannot post to group (403)              ✅ PASS
8. Testing Adding/Removing Members & Revocation:
   - Non-admin member cannot add users (403)            ✅ PASS
   - Admin adds new member (200)                        ✅ PASS
   - Group admin removes member (200)                   ✅ PASS
   - Removed member immediately denied messages (403)   ✅ PASS
9. Testing Group Name & Description Updates:
   - Regular member cannot rename group (403)           ✅ PASS
   - Group admin successfully renames group (200)       ✅ PASS
   - Real-time group:updated event broadcast            ✅ PASS
10. Testing Voluntary Leaving of Group:
   - Member successfully leaves group (200)             ✅ PASS
   - Real-time group:member_left event received         ✅ PASS
   - User who left cannot post to group (403)           ✅ PASS
======================================================
🎉 TEST SUMMARY: 24 PASSED, 0 FAILED
======================================================
```
