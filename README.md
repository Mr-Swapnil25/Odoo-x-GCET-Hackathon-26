<div align="center">

# 🚀 Task Manager System

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=1000&color=6366F1&center=true&vCenter=true&width=600&lines=Task+Manager+System;Built+for+Odoo+x+GCET+Hackathon+2026;React+%2B+TypeScript+%2B+Node.js;Mission+Control+Admin+Dashboard)](https://git.io/typing-svg)

<p align="center">
  <em>A modern, full-stack task management system with role-based access control, real-time updates, and an intuitive Mission Control-inspired interface.</em>
</p>

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</div>

---

## 🌟 Overview

Task Manager System is a production-ready web application built for the **Odoo x GCET Hackathon 2026**. It features a stunning Mission Control-inspired UI with glassmorphic design elements, aurora backgrounds, and smooth animations. The system provides comprehensive task management capabilities with role-based access control, making it perfect for teams and organizations.

<div align="center">

### 🐍 Contribution Activity

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Mr-Swapnil25/Mr-Swapnil25/output/github-contribution-grid-snake-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Mr-Swapnil25/Mr-Swapnil25/output/github-contribution-grid-snake.svg">
  <img alt="github contribution grid snake animation" src="https://raw.githubusercontent.com/Mr-Swapnil25/Mr-Swapnil25/output/github-contribution-grid-snake.svg">
</picture>

<sub><em>⚠️ Note: To enable the snake animation, you need to set up the <a href="https://github.com/Platane/snk">Platane/snk</a> GitHub Action in your profile repository (Mr-Swapnil25/Mr-Swapnil25).</em></sub>

</div>

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[👤 Browser Client] -->|HTTPS Requests| B[⚛️ React Frontend]
    B -->|Vite Build System| B1[📦 Tailwind CSS]
    B -->|REST API Calls| C[🖥️ Express API Server]
    
    C -->|SQL Queries| D[(🗄️ PostgreSQL Database)]
    C -->|Token Validation| E[🔐 Auth Module]
    
    E -->|JWT Generation| E1[🔑 JWT Strategy]
    E -->|OAuth Flow| E2[🌐 Google OAuth]
    E2 -->|External Auth| F[📱 Google OAuth Provider]
    
    C -->|Admin Access| G[📊 Admin Reports Dashboard]
    G -->|Analytics| D
    
    subgraph "Task Workflow"
        H[📋 Pending] -->|Start Task| I[⚙️ In Progress]
        I -->|Complete Task| J[✅ Completed]
    end
    
    C -->|Task CRUD| H
    
    style A fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
    style B fill:#61dafb,stroke:#0891b2,stroke-width:2px,color:#000
    style C fill:#68a063,stroke:#3c873a,stroke-width:2px,color:#fff
    style D fill:#336791,stroke:#264e75,stroke-width:2px,color:#fff
    style E fill:#000000,stroke:#333333,stroke-width:2px,color:#fff
    style G fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style H fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    style I fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    style J fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 👤 User Features

- 🔐 **Secure Authentication**
  - Email/Password login with bcrypt encryption
  - Google OAuth integration
  - JWT-based session management
  
- 📝 **Task Management**
  - Create, read, update, and delete tasks
  - Set priority levels (Low, Medium, High)
  - Assign due dates with overdue detection
  - Track task status workflow
  
- 💬 **Collaboration**
  - Add comments to tasks
  - View assigned tasks dashboard
  - Real-time status updates
  
- 🎨 **Modern UI/UX**
  - Mission Control-inspired design
  - Glassmorphic panels
  - Aurora background animations
  - Fully responsive layout

</td>
<td width="50%" valign="top">

### 🛡️ Admin Features

- 👥 **User Management**
  - Create and manage user accounts
  - Role-based access control (Admin/User)
  - Bulk user operations
  
- 📊 **Analytics Dashboard**
  - Task completion rates
  - Overdue task alerts
  - Team productivity metrics
  - Visual reports and charts
  
- 🎯 **Task Oversight**
  - View all tasks across teams
  - Reassign tasks dynamically
  - Monitor task progress
  - Priority-based filtering
  
- ⚙️ **System Administration**
  - Database seeding scripts
  - Migration management
  - Environment configuration
  - Bootstrap admin account

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18.3, TypeScript 5.5, Vite 6.4, Tailwind CSS 4.0 |
| **Backend** | Node.js 20+, Express 4.18, PostgreSQL 16 |
| **Authentication** | JWT, bcrypt, Google OAuth 2.0 |
| **State Management** | Zustand |
| **Form Handling** | React Hook Form, Zod validation |
| **UI Components** | Framer Motion, Lucide React icons |
| **Database ORM** | Prisma 6.1 |
| **Build Tools** | Vite, esbuild, Tailwind |

</div>

---

## 📦 Project Structure

```
Dayflow/
├── 📁 components/            # Reusable React components
│   ├── animations/           # Animation components (3D Tilt, Glass Card, etc.)
│   ├── AnimatedNotification.tsx
│   ├── Layout.tsx           # Main layout wrapper with sidebar
│   ├── UI.tsx               # UI component library
│   └── WaveBackground.tsx   # Animated background
│
├── 📁 lib/                   # Utility libraries
│   ├── api.ts               # API client functions
│   ├── notificationStore.ts # Notification state management
│   ├── ThemeContext.tsx     # Theme provider
│   ├── userService.ts       # User service utilities
│   └── utils.ts             # Helper functions
│
├── 📁 pages/                 # Application pages
│   ├── Auth.tsx             # Login/Register page
│   ├── Dashboard.tsx        # Mission Control dashboard
│   ├── TaskManagement.tsx   # Task creation & listing
│   ├── TaskTracking.tsx     # Task status tracking
│   ├── Users.tsx            # User management (Admin)
│   ├── Reports.tsx          # Analytics reports (Admin)
│   └── UserProfile.tsx      # User profile settings
│
├── 📁 public/                # Static assets
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service worker
│
├── 📁 server/                # Backend application
│   ├── 📁 migrations/        # Database migrations
│   │   └── 001_init.sql
│   ├── 📁 prisma/            # Prisma ORM
│   │   ├── schema.prisma    # Database schema
│   │   ├── seed.ts          # Database seeding
│   │   └── 📁 migrations/
│   ├── 📁 scripts/
│   │   └── migrate.ts       # Migration runner
│   └── 📁 src/
│       ├── index.ts         # Express server entry
│       ├── db.ts            # Database connection
│       ├── prisma.ts        # Prisma client
│       ├── 📁 middleware/
│       │   └── auth.ts      # Auth middleware
│       ├── 📁 routes/
│       │   ├── auth.ts      # Auth endpoints
│       │   ├── tasks.ts     # Task endpoints
│       │   ├── users.ts     # User endpoints
│       │   └── reports.ts   # Report endpoints
│       └── 📁 types/
│           └── express.d.ts # TypeScript definitions
│
├── App.tsx                  # Root component
├── index.tsx                # App entry point
├── store.ts                 # Zustand state store
├── types.ts                 # Global TypeScript types
├── styles.css               # Global styles
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind configuration
└── package.json             # Dependencies
```

---

## 🚀 Getting Started

<details>
<summary><b>📋 Prerequisites</b></summary>

<br>

Ensure you have the following installed:

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **PostgreSQL** 16+ ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn** package manager
- **Git** ([Download](https://git-scm.com/))

</details>

<details>
<summary><b>⚙️ Backend Setup</b></summary>

<br>

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** in `server/` directory
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/task_manager
   JWT_SECRET=your_super_secret_jwt_key_change_this
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   FRONTEND_URL=http://localhost:3000
   BACKEND_URL=http://localhost:4000
   PORT=4000
   ```

4. **Run database migrations**
   ```bash
   npm run migrate
   ```

5. **Seed the database** (creates admin and test users)
   ```bash
   npx tsx prisma/seed.ts
   ```
   
   Default credentials:
   - **Admin**: `admin@taskmanager.com` / `Admin@123`
   - **User 1**: `john@taskmanager.com` / `User@123`
   - **User 2**: `jane@taskmanager.com` / `User@123`

6. **Start the server**
   ```bash
   npm run dev
   ```
   
   Server runs at `http://localhost:4000`

</details>

<details>
<summary><b>🎨 Frontend Setup</b></summary>

<br>

1. **Return to root directory**
   ```bash
   cd ..
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** in root directory
   ```env
   VITE_API_BASE_URL=http://localhost:4000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Application runs at `http://localhost:3000`

5. **Build for production**
   ```bash
   npm run build
   ```

</details>

<details>
<summary><b>🔐 Google OAuth Setup (Optional)</b></summary>

<br>

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:4000/auth/google/callback`
6. Copy Client ID and Client Secret to `server/.env`

</details>

---

## 📸 Screenshots

<div align="center">

### 🎮 Mission Control Dashboard
*Admin dashboard with glassmorphic design and aurora animations*

### 📋 Task Management
*Create and manage tasks with priority levels and deadlines*

### 👥 User Management
*Admin panel for creating and managing team members*

### 📊 Analytics Reports
*Comprehensive task analytics and team productivity metrics*

</div>

---

## 🔑 API Endpoints

<details>
<summary><b>View API Documentation</b></summary>

<br>

### Authentication
- `POST /auth/login` - Email/password login
- `POST /auth/google` - Google OAuth login
- `POST /auth/register` - Register new user (Admin only)
- `GET /auth/me` - Get current user
- `POST /auth/bootstrap-admin` - Create first admin (works only if no users exist)

### Tasks
- `GET /tasks` - Get all tasks (filtered by role)
- `POST /tasks` - Create new task (Admin only)
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task (Admin only)
- `GET /tasks/:id/comments` - Get task comments
- `POST /tasks/:id/comments` - Add comment to task

### Users
- `GET /users` - Get all users (Admin only)
- `POST /users` - Create user (Admin only)
- `PATCH /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)

### Reports
- `GET /reports` - Get analytics summary (Admin only)

</details>

---

## 🎯 Key Highlights

- ✅ **Production Ready** - Built with best practices and scalable architecture
- ✅ **Type Safe** - Full TypeScript coverage for both frontend and backend
- ✅ **Secure** - JWT authentication, bcrypt password hashing, role-based access
- ✅ **Responsive** - Mobile-first design, works on all devices
- ✅ **Modern Stack** - Latest versions of React, Node.js, and PostgreSQL
- ✅ **Developer Friendly** - Hot reload, TypeScript, ESLint, Prettier
- ✅ **PWA Support** - Progressive Web App with offline capabilities
- ✅ **Animated UI** - Smooth animations with Framer Motion
- ✅ **Database Migrations** - Version-controlled schema changes
- ✅ **Seeding Scripts** - Easy database setup for development

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### ⭐ Star this repo if you found it helpful!

<hr>

<p>
  <b>Made with ❤️ for Odoo x GCET Hackathon 2026</b>
</p>

<p>
  <sub>Built by passionate developers pushing the boundaries of modern web development</sub>
</p>

<br>

[![GitHub stars](https://img.shields.io/github/stars/yourusername/task-manager-system?style=social)](https://github.com/yourusername/task-manager-system/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/task-manager-system?style=social)](https://github.com/yourusername/task-manager-system/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/yourusername/task-manager-system?style=social)](https://github.com/yourusername/task-manager-system/watchers)

</div>
