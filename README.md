# IKODI Sponsorship & Scholarship Management System
> **Empowering Futures, One Student at a Time** — *"With you, forward"*

The **IKODI Sponsorship & Scholarship Management System** is a unified, multi-role web platform designed to streamline student sponsorship, scholarship administration, committee review workflows, communications, and student ID card production.

---

## 🏛️ System Architecture & Workflow

Based on the official IKODI system workflow diagram:

```mermaid
flowchart LR
    A1["1. Applicant\n(Registers, uploads results/photo)"] --> A2["2. Admin\n(Validates profile & ID card)"]
    A2 --> A3["3. Sponsor\n(Defines & funds opportunities)"]
    A3 --> A4["4. Reviewer\n(Evaluates, scores, recommends)"]
    A4 --> A5["5. Admin\n(Approves & notifies)"]
    A5 --> A6["6. Award & Enrollment\n(Funds committed)"]
    A6 --> A7["7. Parent\n(Follows progress, feedback)"]
    A2 --> A8["8. ID Card Production\n(Print verified credential)"]
```

### Core Roles & Capabilities
1. **Applicant / Beneficiary**:
   - Register, upload multi-format academic results (PDF/images) & profile photo.
   - Search scholarships, submit applications, track review status, receive digital student ID card.
2. **Administrator Group (Super Admin, Admin, Secretary)**:
   - **Super Admin**: Full system access, all user management, audit logs, and settings.
   - **Admin**: Verify sponsor organizations, oversee candidate queues, approve awards, generate reports.
   - **Secretary**: Manage records, update information, view oversight metrics.
3. **Sponsor / Funding Organization**:
   - Create specialized scholarship opportunities, set custom criteria.
   - Review incoming applications, select beneficiaries, track funded learners.
4. **Reviewer / Selection Committee**:
   - Access assigned applications, score applicants using a 100-point rubric (Academics, Need, Community, Readiness out of 25 each).
   - Record formal recommendations: *Shortlist*, *Recommend*, *Pending*, or *Do not recommend*.
5. **Parent / Guardian Group**:
   - Receive updates and milestone notifications, monitor student progress.
6. **Communications & Messaging Hub**:
   - Multi-channel delivery (In-app, simulated Email, SMS) for individual or group broadcasts.
7. **System Utilities**:
   - **Student ID Card Production**: Instant preview and verified `@media print` physical card layout.
   - **Session Histories**: Comprehensive tracking of user sessions (who, what, when logged in/out, IP, device).
   - **Reports & Analytics**: Interactive charts (Recharts) with CSV data export and print-friendly layouts.

---

## 📁 Repository Directory Structure

```
ikodi-sponsorship-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # PostgreSQL connection pool with Supabase connection string & fallback
│   │   ├── controllers/
│   │   │   ├── authController.js     # Login, logout, session tracking & audit logs
│   │   │   ├── studentController.js  # Result uploads, profile pictures, & ID card generation
│   │   │   ├── sponsorController.js  # Sponsor organizations & scholarship criteria
│   │   │   ├── adminController.js    # Audit logs, role modifications, session history & stats
│   │   │   ├── messageController.js  # Messaging hub (In-app, Email, SMS)
│   │   │   └── reviewController.js   # Committee scoring rubric & candidate recommendations
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # JWT validation and Role-Based Access Control (RBAC)
│   │   │   └── auditMiddleware.js    # Tracks user login time, logout time, and actions performed
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # /api/auth/*
│   │   │   ├── studentRoutes.js      # /api/students/*
│   │   │   ├── sponsorRoutes.js      # /api/sponsors/*
│   │   │   ├── adminRoutes.js        # /api/admin/*
│   │   │   ├── messageRoutes.js      # /api/messages/*
│   │   │   └── reviewRoutes.js       # /api/reviews/*
│   │   └── server.js                 # Main Express app, CORS, static uploads, & Railway PORT binding
│   ├── .env.example                  # Environment variables template
│   ├── package.json                  # Backend dependencies (express, pg, cors, dotenv, jsonwebtoken, multer)
│   └── Procfile                      # Railway deployment process file (web: node src/server.js)
│
├── artifacts/
│   ├── ikodi-sponsorship-frontend/   # React + Vite TypeScript SPA
│   │   ├── src/
│   │   │   ├── lib/api.ts            # Centralized API wrapper pointing to backend with JWT & cache fallback
│   │   │   ├── index.css             # Global Tailwind styling + @media print rules for ID cards & reports
│   │   │   ├── App.tsx               # Main multi-role dashboard and interactive portal
│   │   │   └── pages/reports.tsx     # Recharts analytics with CSV export
│   │   ├── netlify.toml              # Netlify configuration & SPA routing rules
│   │   └── vite.config.ts            # Vite configuration with safe defaults
│   └── api-server/                   # Express workspace server integrated with backend routes
│
├── schema.sql                        # Complete PostgreSQL database schema ready for Supabase SQL Editor
├── netlify.toml                      # Root Netlify deployment configuration
└── README.md                         # Full database schema setup guide and deployment instructions
```

---

## 🗄️ Supabase PostgreSQL Setup Guide

The database will be hosted on **Supabase** as PostgreSQL. Follow these steps when you are ready to connect live database persistence:

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and sign in.
   - Click **New Project**, choose your organization, name your project (e.g. `ikodi-database`), set a database password, and choose your preferred region.

2. **Execute the Database Schema**:
   - In your Supabase dashboard, click on the **SQL Editor** tab on the left sidebar.
   - Open [`schema.sql`](file:///C:/Users/SIR.JOSPHAT/.gemini/antigravity/scratch/I-AM-WITH-YOU-2026/schema.sql) in this repository.
   - Copy the entire contents of `schema.sql` and paste them into the Supabase SQL Editor.
   - Click **Run**. This will create:
     - `users`, `sessions`, `audit_logs`
     - `students`, `student_documents`
     - `sponsors`, `opportunities`, `applications`
     - `reviews`, `messages`
     - All necessary indexes and default seed data.

3. **Obtain Your PostgreSQL Connection String**:
   - In Supabase, go to **Project Settings** -> **Database**.
   - Under **Connection string**, select **URI** (or **Session Pooler**).
   - Copy the connection string:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with the database password you chose during project creation.

---

## 🌐 Netlify Backend Deployment Guide

The backend can be deployed as a Netlify Function. Create a **separate Netlify
site** for the backend and configure it as follows:

1. Import this GitHub repository into Netlify.
2. Set the **Base directory** to `backend`.
3. Netlify will use [`backend/netlify.toml`](<C:/Users/SIR.JOSPHAT/Desktop/I AM WITH YOU/I-AM-WITH-YOU-2026/backend/netlify.toml>).
4. Add these environment variables to the backend site:
   - `DATABASE_URL`: the Supabase PostgreSQL connection string.
   - `JWT_SECRET`: a secure random secret.
   - `NODE_ENV`: `production`.
   - `SUPABASE_URL`: the Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: server-only Supabase service-role key.
   - `SUPABASE_STORAGE_BUCKET`: the private bucket used for uploads.
5. Deploy the site. The backend URL will expose the existing API under
   `https://YOUR-BACKEND-SITE.netlify.app/api/...`.
6. On the frontend Netlify site, set `VITE_API_URL` to
   `https://YOUR-BACKEND-SITE.netlify.app/api`.

The health check is:

```text
https://YOUR-BACKEND-SITE.netlify.app/api/healthz
```

Supabase Storage is required for durable production uploads. Netlify Functions
have ephemeral local filesystems, so the service-role key must remain on the
backend site and must never be exposed to the frontend.

## 🚂 Railway Backend Deployment Guide

Deploying the Express backend to **Railway**:

1. Log into [railway.app](https://railway.app).
2. Create a **New Project** and select **Deploy from GitHub repo**.
3. Select this repository.
4. Set the **Root Directory** to `backend`.
5. Under **Variables**, add the following environment variables:
   - `DATABASE_URL`: Your Supabase connection string from the previous section.
   - `JWT_SECRET`: A secure random secret string.
   - `NODE_ENV`: `production`
6. Railway will automatically detect [`backend/Procfile`](file:///C:/Users/SIR.JOSPHAT/.gemini/antigravity/scratch/I-AM-WITH-YOU-2026/backend/Procfile) (`web: node src/server.js`) and assign `PORT`.
7. Once deployed, Railway provides a public URL (e.g. `https://ikodi-backend-production.up.railway.app`). Note this URL!

---

## 🌐 Netlify Frontend Deployment Guide

Deploying the React frontend to **Netlify**:

1. Log into [netlify.com](https://netlify.com).
2. Click **Add new site** -> **Import an existing project** from GitHub.
3. Select this repository.
4. Netlify will automatically detect [`netlify.toml`](file:///C:/Users/SIR.JOSPHAT/.gemini/antigravity/scratch/I-AM-WITH-YOU-2026/netlify.toml):
   - **Base directory**: `artifacts/ikodi-sponsorship-frontend`
   - **Build command**: `pnpm run build`
   - **Publish directory**: `dist/public`
5. In **Site Configuration** -> **Environment Variables**, add:
   - `VITE_API_URL`: Your Railway backend URL with `/api` appended (e.g. `https://ikodi-backend-production.up.railway.app/api`).
6. Click **Deploy Site**. Netlify will build and deploy the single-page application with complete client-side routing.

---

## 💻 Local Development Setup

To run the application locally on your machine:

### 1. Run Backend Server
```bash
cd backend
npm install
npm start
```
*The backend server will start on `http://localhost:5000`.*
*Health check: `http://localhost:5000/api/healthz`*

### 2. Run Frontend Application
```bash
# From repository root
pnpm --filter @workspace/ikodi-sponsorship-frontend run dev
```
*The frontend Vite development server will start on `http://localhost:3000`.*

---

## 📄 License
MIT License. IKODI Sponsorship & Scholarship Management System.
