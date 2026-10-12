# HRMS Portal — Enterprise Human Resource Management System

A modern, production-grade Human Resource Management System (HRMS) built with React 19, Vite, Tailwind CSS, Node.js, Express, Socket.IO, and MongoDB.

---

## 🌟 Key Features

### 1. Identity, Authentication & Security
- **Role-Based Access Control (RBAC)**: Fine-grained access across `ADMIN`, `HR`, `MANAGER`, and `EMPLOYEE` roles.
- **Dual Authentication**: Secure email & salted `bcryptjs` password login, plus Google Single Sign-On (SSO) via Firebase Admin SDK.
- **Two-Factor Authentication (2FA)**: Time-based One-Time Password (TOTP) QR code setup with backup recovery.
- **Zero Client Trust**: All user identities and permissions are derived strictly from cryptographically verified JSON Web Tokens (JWT). Client-supplied IDs are never trusted.
- **Field-Level Data Protection**: Sensitive employee compensation (salaries) and emergency contacts are stripped from responses for unauthorized roles.

### 2. Modern Design System & Dynamic Theming
- **Curated Palette**: Cohesive Indigo/Slate aesthetic with rich gradients and micro-interactions.
- **Light & Dark Themes**: Persistent theme engine with automatic OS preference detection and smooth transitions.
- **Responsive Layout**: Designed for high-density desktop displays, responsive tablets, and single-pane mobile viewports with drawer slide-overs.
- **Standardized States**: Unified skeleton loaders, empty states with illustrations, and contextual error alerts.

### 3. Personnel & Department Management
- **Employee Directory**: Paginated directory with search, department filtering, status filters (`ACTIVE`, `ON_LEAVE`, `TERMINATED`), and CSV import/export.
- **Atomic Code Generator**: Automatic sequential employee IDs (`EMP-1001`, `EMP-1002`, etc.) via MongoDB atomic counters.
- **Department Structure**: Organizational hierarchy mapping managers, staff rosters, and cross-department collaboration rules.

### 4. Time, Clock & Attendance Tracking
- **Digital Punch Clock**: Real-time interactive punch-in and punch-out widget.
- **Automatic Work Hours**: Exact decimal work duration calculated strictly on the backend to prevent client clock manipulation.
- **Daily Summaries & Scoping**: Managers view direct report attendance metrics; organization admins monitor company-wide trends.

### 5. Leave Management & Quotas
- **Multi-Category Quotas**: Annual balances for Casual, Sick, Earned/Paid, and Special leaves.
- **Atomic Quota Adjustments**: Automatic balance deductions upon manager/HR approval, with balance restoration upon cancellation.
- **Attendance Synchronization**: Approved leaves automatically flag corresponding calendar days as `ON_LEAVE`.
- **Collision Protection**: Prevents duplicate or overlapping leave dates and checks balance sufficiency before submission.

### 6. Task Management & Workflows
- **Kanban & Priority Tracking**: Interactive task board categorized by `TODO`, `IN_PROGRESS`, `REVIEW`, and `COMPLETED`.
- **Department Scoping**: Tasks delegated within authorized teams; managers restricted from cross-department assignments.
- **Lifecycle Timestamps**: Automated server-side `completedAt` timestamp recording and dynamic overdue calculations.

### 7. Real-Time Notifications
- **Socket.IO Gateway**: Real-time event delivery authenticated via JWT handshake.
- **User-Isolated Rooms**: Each socket automatically joins a private personal room (`socket.join(user._id)`). No cross-user notification leakage.
- **Live Navbar Badge & Toasts**: Instant counter updates without page refreshes, accompanied by non-intrusive toast popups.
- **Offline Persistence**: Notifications persist to MongoDB before socket emission, allowing offline users to retrieve missed alerts upon reconnecting.

### 8. Direct Messaging & Team Group Chat
- **1-on-1 Direct Messaging**: Private conversations with eligible colleagues, MongoDB message persistence before broadcasting, and read receipts.
- **Group Channels**: Administrative and team channels created by authorized Managers (`team-scoped`) and Admins (`org-wide`).
- **Real-Time Dynamic Eviction**: Removing a group member immediately evicts their active sockets from the room (`socket.leave`), instantly revoking message access.
- **Typing Indicators & Online Presence**: Live typing broadcasts and user online/offline status notifications.

---

## 🏗️ Architecture Overview

```text
HRMS Portal/
├── frontend/                     # React 19 + Vite Single Page Application
│   ├── src/
│   │   ├── api/                  # Axios instance and API service calls
│   │   ├── components/           # UI primitives, chat modules, and layouts
│   │   │   ├── chat/             # ChatSidebar, ChatWindow, CreateGroupModal, GroupDetailsDrawer
│   │   │   ├── common/           # BrandLogo, NotificationToast, EmptyState, ProtectedRoute
│   │   │   ├── dashboard/        # Role-tailored dashboards (Admin, HR, Manager)
│   │   │   └── layout/           # Navbar, Sidebar, Page Shell
│   │   ├── config/               # Brand configuration and Design Tokens
│   │   ├── context/              # AuthContext, ThemeContext, SocketContext, NotificationContext, ChatContext
│   │   ├── pages/                # Route views (Dashboard, Employees, Attendance, Leaves, Tasks, Chat, etc.)
│   │   └── index.css             # Tailwind CSS tokens and theme variables
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Node.js + Express REST API & Socket.IO Gateway
│   ├── src/
│   │   ├── config/               # Database, Firebase Admin, and Cloudinary configurations
│   │   ├── controllers/          # Business logic handlers (auth, chat, attendance, leave, tasks, etc.)
│   │   ├── middleware/           # authMiddleware, RBAC guards, notFound, errorHandler
│   │   ├── models/               # Mongoose schemas (User, Employee, Attendance, Leave, Task, Conversation, Message, etc.)
│   │   ├── routes/               # Express route declarations
│   │   ├── scripts/              # Integration test suites and database seed scripts
│   │   ├── services/             # NotificationService, ActivityService, LeaveAttendanceService
│   │   ├── socket.js             # Socket.IO gateway, JWT authentication, and room lifecycle
│   │   ├── app.js                # Express app setup and CORS configuration
│   │   └── server.js             # HTTP server listener and DB connection
│   └── package.json
│
├── docs/                         # Technical documentation
│   ├── ARCHITECTURE.md           # System design, data models, ERD, and deployment topology
│   └── API.md                    # Full REST API and Socket.IO protocol specification
├── .env.example                  # Monorepo environment variables template
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node.js v24.x)
- **npm**: v9+ (tested on npm v11.x)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
4. Seed the initial database (Admin account, departments, and demo employees):
   ```bash
   npm run seed
   ```
5. Start the backend development server (runs on `http://localhost:5001`):
   ```bash
   npm run dev
   ```
6. Verify backend health:
   ```bash
   curl http://localhost:5001/api/health
   ```

---

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. Access the application in your browser at `http://localhost:5173` (or `http://localhost:5174`).

---

## 🧪 Automated Test Suites

The backend includes 7 comprehensive integration test suites covering all business domains, RBAC guards, and real-time Socket.IO protocols.

### Run All Backend Tests Sequentially
```bash
cd backend
npm run test:all
```

### Run Individual Test Suites
| Command | Test Suite | Tests | Scope |
| :--- | :--- | :---: | :--- |
| `npm run test:auth` | Authentication & RBAC | 8 | Login, JWT tokens, password hashing, 401 rejection, salary stripping |
| `npm run test:attendance` | Attendance Management | 15 | Punch clock, workHours calculation, duplicate rejection, manager scoping |
| `npm run test:leave` | Leave & Quotas | 21 | Balance deduction, manager/HR/Admin approvals, attendance sync, cancellation |
| `npm run test:task` | Tasks & Workflow | 21 | Status lifecycle, completedAt timestamps, department mismatch checks |
| `npm run test:notifications`| Real-Time Notifications | 9 | Socket auth, isolated user rooms, unread counts, offline catch-up, deduplication |
| `npm run test:chat` | Direct Messaging | 25 | Idempotent conversations, message persistence, room authorization, read receipts |
| `npm run test:groups` | Group Chat & Teams | 24 | RBAC group creation, dynamic room eviction, group rename, voluntary leave |

---

## 📦 Frontend Production Build

Validate and bundle the frontend client for production deployment:
```bash
cd frontend
npm run build
```
Build output is generated into `frontend/dist/`.

---

## 🚢 Production Deployment Instructions

### 1. Environment Configuration
Ensure production `.env` files contain secure, strong secrets:
- `NODE_ENV=production`
- `PORT=5001`
- `CORS_ORIGIN=https://hrms.yourcompany.com`
- `FRONTEND_URL=https://hrms.yourcompany.com`
- `JWT_SECRET`: Random string of 64+ characters
- `MONGODB_URI`: Secure connection string with SSL enabled (`ssl=true`)

### 2. Process Management with PM2
Run the backend with PM2 to ensure auto-restarts and zero-downtime clustering:
```bash
# In backend/ directory
npm install -g pm2
pm2 start src/server.js --name "hrms-backend" -i max --env production
pm2 save
pm2 startup
```

### 3. Nginx Reverse Proxy Configuration (HTTP & WebSocket Support)
Deploy Nginx to serve the frontend SPA and proxy API and WebSocket connections to the Node.js backend:

```nginx
server {
    listen 80;
    server_name hrms.yourcompany.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hrms.yourcompany.com;

    ssl_certificate /etc/letsencrypt/live/hrms.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hrms.yourcompany.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend Single Page Application
    root /var/www/hrms-portal/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend REST API
    location /api/ {
        proxy_pass http://127.0.0.1:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Real-Time Socket.IO (WebSocket Upgrade)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

## 🔒 Security & Release Audit Summary

- **Secrets Audit**: Confirmed zero secrets committed. `.gitignore` strictly protects `.env`, `.env.local`, and build artifacts.
- **CORS Hardening**: Strict domain whitelisting configured in `app.js` and `socket.js`.
- **Socket Isolation**: Zero trust for client IDs. All room assignments originate from verified JWT identities.
- **Dynamic Eviction**: Immediate eviction of removed group members from active socket rooms prevents message interception.
- **Comprehensive Documentation**: Complete specifications available in [ARCHITECTURE.md](file:///Users/arshad_010/Desktop/HRMS-PORTAL/docs/ARCHITECTURE.md) and [API.md](file:///Users/arshad_010/Desktop/HRMS-PORTAL/docs/API.md).

---

## 📄 License
This project is licensed under the MIT License.
