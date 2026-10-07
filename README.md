# HRMS Portal

A modern, production-style Human Resource Management System (HRMS) built with React 19, Vite, Tailwind CSS, Node.js, Express, and MongoDB.

---

## 🏗️ Architecture Overview

The application is structured as a decoupled full-stack architecture:

```text
HRMS Portal/
├── frontend/             # React 19 + Vite + Tailwind CSS SPA
│   ├── public/           # Static public assets
│   ├── src/
│   │   ├── api/          # Axios instance and API service calls
│   │   ├── assets/       # Icons and SVGs
│   │   ├── components/   # Reusable UI primitives and layout components
│   │   │   ├── common/
│   │   │   └── layout/
│   │   ├── context/      # React Context API providers (Auth, UI)
│   │   ├── hooks/        # Custom reusable React hooks
│   │   ├── pages/        # Route page views
│   │   ├── routes/       # React Router declarations
│   │   ├── utils/        # Frontend utility and helper functions
│   │   ├── App.jsx       # App layout wrapper
│   │   ├── main.jsx      # React DOM entry point
│   │   └── index.css     # Tailwind CSS styles and theme tokens
│   ├── package.json
│   └── vite.config.js
│
├── backend/              # Node.js + Express REST API (ES Modules)
│   ├── src/
│   │   ├── config/       # Database & environment configurations
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Custom middlewares (auth, errors, 404)
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # Express route handlers
│   │   ├── services/     # Business logic layer
│   │   ├── utils/        # Logger and helper utilities
│   │   ├── app.js        # Express app initialization
│   │   └── server.js     # Server entry point & DB connection
│   └── package.json
│
├── .gitignore
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18+ (tested on v24.x)
* **npm**: v9+ (tested on v11.x)
* **MongoDB**: local instance or MongoDB Atlas URI

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
5. Check backend health:
   ```bash
   curl http://localhost:5000/api/health
   ```

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:5173`.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, Vite, React Router v7, Tailwind CSS v4, Axios, Lucide React, Recharts
* **Backend**: Node.js, Express.js (ES Modules), JWT (`jsonwebtoken`), bcrypt (`bcryptjs`), Mongoose
* **Database**: MongoDB
