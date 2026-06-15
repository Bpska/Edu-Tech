# Nexus Academy - EdTech Exam Platform

Welcome to the **Nexus Academy** (formerly ExamTest) repository. This is a premium educational exam practice and management application built using a modern React frontend and an Express/PostgreSQL backend.

This document serves as a complete overview of the codebase, its architectural patterns, configuration, and setup guides.

---

## 🏗️ Architecture Overview

The project is structured as a monorepo containing two main parts:
1. **Frontend**: A React application built with **Vite** and styled using **Vanilla CSS** + custom modern themes.
2. **Backend**: A Node.js / Express API utilizing **Prisma ORM** connected to a **PostgreSQL** database.

```mermaid
graph TD
    Client[React Frontend - Port 6001] -->|Vite Proxy /api| Backend[Express Backend - Port 6002]
    Backend -->|Prisma Client| DB[(PostgreSQL Database - Port 5400)]
```

---

## 📂 Project Directory Structure

```text
examtest--main/
├── docker-compose.yml       # Production-ready Multi-container configuration
├── DEPLOYMENT.md            # Detailed VPS server setup & deployment documentation
├── frontend/                # React/Vite Client
│   ├── src/
│   │   ├── components/      # Reusable UI parts (Bell dropdown, Floating Feedback, etc.)
│   │   ├── pages/           # Pages (Dashboard, Courses, Admin panel, Login)
│   │   ├── App.jsx          # Routing configuration
│   │   ├── index.css        # Core design system (White & Blue palette)
│   │   └── main.jsx
│   ├── vite.config.js       # Dev server ports, PWA setup, and proxy rules
│   └── package.json
└── backend/                 # Express API / Prisma Server
    ├── prisma/
    │   └── schema.prisma    # Prisma schemas & DB Relationships
    ├── src/
    │   ├── index.js         # Express app root, CORS, and endpoint mounting
    │   ├── db.js            # Prisma Client instantiation
    │   └── routes/          # API Handlers (auth, users, tests, courses, payments, etc.)
    ├── .env                 # Database URI, Secrets, Razorpay & Google credentials
    └── package.json
```

---

## 🗄️ Database Models (Prisma)

The application uses PostgreSQL with the following core database tables managed through **Prisma**:

*   **User**: Handles student and admin accounts (stores `email`, `role`, `password_hash`, and links to notifications & feedback).
*   **Profile**: Relational model storing onboarding settings (weak subjects, target study hours, etc.).
*   **Course**: Online courses containing tests and resources.
*   **Test**: Exams containing multiple questions and associated timer durations.
*   **Question**: Individual multiple-choice questions belonging to a specific Test.
*   **ExamHistory**: Tracks user exam scores and responses.
*   **Notification**: Administrative notification broadcast system (handles site-wide alerts and specific user target IDs).
*   **Feedback**: Student rating and feedback comments submitted directly to the Admin portal.

---

## 🔌 API Endpoints & Routes

The Express backend routes are mounted under `/api` (rewritten on the frontend from `/api/` to `/`):

| Router Prefix | Purpose | Key Endpoints |
| :--- | :--- | :--- |
| `/auth` | Authentication & SSO | `POST /login`, `POST /register`, `GET /me`, `POST /google-login` |
| `/courses` | Student/Course content | `GET /`, `GET /:id` |
| `/tests` | Exams and Questions | `GET /course/:courseId`, `GET /:id` |
| `/exam` | Exam submissions | `POST /submit` |
| `/user` | Notifications & Feedback | `GET /notifications`, `PATCH /notifications/read-all`, `POST /feedback` |
| `/admin` | Administration panel | `POST /notifications` (Send broadcasts), `GET /feedback` (View comments) |

---

## ⚙️ Configuration & Environment Variables

### Backend Environment (`backend/.env`)
Create a `.env` file inside the `backend` folder:
```env
# Database connection string
DATABASE_URL="postgresql://postgres:bps@localhost:5432/examtest_db?schema=public"

# Auth secrets
JWT_SECRET="your-jwt-signing-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"

# Backend server Port
PORT=6002

# Razorpay credentials for payment gateway
RAZORPAY_KEY_ID="rzp_test_xxxxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"

# Google Authentication credentials
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
```

### Frontend Configuration (`frontend/vite.config.js`)
*   **Local Port**: Frontend runs on port `6001`.
*   **Local Proxy**: Proxies `/api` requests to the Express backend running on `http://localhost:6002`.

---

## 🚀 Getting Started

### 1. Prerequisite Checklist
*   Node.js (v18 or higher recommended)
*   PostgreSQL running locally or via Docker (port `5400` mapped internally to `5432`)

### 2. Database Sync & Client Generation
Navigate to the `backend` folder and run the Prisma commands to sync your DB schema and generate the client code:
```bash
cd backend
npx prisma db push
npx prisma generate
```

### 3. Running Locally

*   **Start the Backend API Server**:
    ```bash
    cd backend
    npm run dev
    # Server will run on http://localhost:6002
    ```

*   **Start the React Frontend**:
    ```bash
    cd frontend
    npm run dev
    # Client will run on http://localhost:6001
    ```

### 4. Running via Docker Compose
To run the entire stack (Frontend + Backend + PostgreSQL) inside Docker containers:
```bash
# Build and run container services in detached mode
docker-compose up -d --build
```
*   **Frontend**: accessible at `http://localhost:6001`
*   **Backend**: running on `http://localhost:6002`
*   **Postgres**: listening on port `5400`
