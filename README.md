# Task Manager System

A Task Manager web app with role-based access, task assignment, priorities, status tracking, comments, and reports. Built with React + TypeScript on the frontend and Node/Express + Postgres on the backend.

## Features
- Email/password login (bcrypt + JWT)
- Google OAuth login
- Admin-only user management
- Task CRUD with priority and due dates
- Task status workflow (Pending -> In Progress -> Completed)
- Task comments
- Admin reports dashboard

## Tech Stack
- Frontend: React, TypeScript, Vite, Tailwind
- Backend: Node.js, Express, PostgreSQL
- Auth: JWT + bcrypt, Google OAuth

## Project Structure
```
task-manager-system/
|-- components/
|-- lib/
|-- pages/
|-- public/
|-- server/
|   |-- migrations/
|   |-- scripts/
|   `-- src/
`-- App.tsx
```

## Environment Variables

### Frontend (`.env`)
```
VITE_API_BASE_URL=http://localhost:4000
```

### Backend (`server/.env`)
```
DATABASE_URL=postgres://user:password@localhost:5432/task_manager
JWT_SECRET=change_me
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
PORT=4000
```

## Setup

### Backend
```
cd server
npm install
npm run migrate
npm run dev
```

### Bootstrap First Admin
Use this once (only works when no users exist):
```
POST http://localhost:4000/auth/bootstrap-admin
{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

### Frontend
```
npm install
npm run dev
```

Open `http://localhost:5173`.

## Notes
- Admins create users; public sign-up is disabled.
- Reports are admin-only.
- Real-time updates are not enabled in MVP.
