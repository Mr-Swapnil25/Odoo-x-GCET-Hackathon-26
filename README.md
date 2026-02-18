<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:4F46E5,50:6366F1,100:8B5CF6&height=200&section=header&text=Task+Manager&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=🗂️%20Role-Based%20Task%20Management%20for%20Teams&descSize=20&descAlignY=55" width="100%">

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=6366F1&center=true&vCenter=true&width=800&lines=JWT+Auth+%2B+Google+OAuth+🔐;Assign+Tasks+%7C+Track+Progress+%7C+Report+📊;Built+for+Odoo+x+GCET+Hackathon+2026+🚀)](https://git.io/typing-svg)

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/🚀-Get%20Started-4F46E5?style=for-the-badge&labelColor=1e1b4b" alt="Get Started"></a>
  <a href="#-features"><img src="https://img.shields.io/badge/✨-Features-6366F1?style=for-the-badge&labelColor=1e1b4b" alt="Features"></a>
  <a href="#️-architecture"><img src="https://img.shields.io/badge/🏗️-Architecture-8B5CF6?style=for-the-badge&labelColor=1e1b4b" alt="Architecture"></a>
  <a href="#-contributing"><img src="https://img.shields.io/badge/🤝-Contribute-A855F7?style=for-the-badge&labelColor=1e1b4b" alt="Contribute"></a>
</p>

<img src="https://skillicons.dev/icons?i=react,typescript,nodejs,express,postgres,tailwind,vite&theme=dark">

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" alt="Build Status">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome">
</p>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<p align="center">
  <img src="https://raw.githubusercontent.com/platane/snk/output/github-contribution-grid-snake-dark.svg" width="100%" alt="Snake animation">
</p>

</div>

---

<details open>
<summary><b>📑 Table of Contents</b></summary>

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🎯 Overview                                                ║
║   ✨ Features                                                ║
║   🏗️ Architecture                                            ║
║   🚀 Quick Start                                             ║
║   📦 Installation                                            ║
║   🔧 Configuration                                           ║
║   📱 Usage                                                   ║
║   🔒 Security                                                ║
║   🗺️ Roadmap                                                 ║
║   🤝 Contributing                                            ║
║   📄 License                                                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

</details>

---

<h2 id="overview">
  <img src="https://media.giphy.com/media/ObNTw8Uzwy6KQ/giphy.gif" width="30">
  &nbsp;Overview
</h2>

**Task Manager System** is a production-ready web application designed for the **Odoo x GCET Hackathon 2026**. It provides comprehensive task management capabilities with role-based access control, featuring a stunning Mission Control-inspired UI with glassmorphic design elements and aurora backgrounds.

<div align="center">

### 👤 For Users vs 🛡️ For Admins

| 👤 **User Features** | 🛡️ **Admin Features** |
|---------------------|----------------------|
| 🔐 Email/Password + Google OAuth login | 👥 Full user management & creation |
| 📋 View assigned tasks | 📊 Comprehensive analytics dashboard |
| 💬 Add comments on tasks | 🎯 Complete task CRUD with assignments |
| 🔄 Update task status workflow | 📈 Monitor all team tasks & progress |
| 📖 View personal task history | ⚙️ System administration & reports |

</div>

<br>

```diff
+ ✅ Role-based access — Admins and Users see only what they need
+ ✅ Task workflow — Pending → In Progress → Completed with visual tracking
+ ✅ Real-time status updates — No page refresh needed
+ ✅ Secure authentication — JWT + bcrypt hashing + OAuth 2.0
+ ✅ Modern UI/UX — Mission Control design with animations
+ ✅ Mobile responsive — Works seamlessly on all devices

- ❌ No more manually tracking tasks in spreadsheets
- ❌ No confusion about task ownership or status
- ❌ No security vulnerabilities from plain text passwords
- ❌ No ugly, outdated interfaces
```

---

<h2 id="features">
  <img src="https://media.giphy.com/media/WUlplcMpOCEmTGBtBW/giphy.gif" width="30">
  &nbsp;Features
</h2>

<table>
<tr>
<td width="50%" valign="top">

### 🎨 User Portal

<details>
<summary><b>🔐 Login & Auth</b></summary>

<br>

- Email/Password authentication with bcrypt
- Google OAuth 2.0 integration
- JWT token-based sessions
- Secure password reset flow
- Persistent login state

</details>

<details>
<summary><b>📋 Task View</b></summary>

<br>

- View all assigned tasks
- Filter by status (Pending/In Progress/Completed)
- Sort by priority and due date
- Search tasks by title/description
- Task detail modal with full information

</details>

<details>
<summary><b>💬 Comments</b></summary>

<br>

- Add comments to tasks
- View comment history
- Real-time comment updates
- Markdown support
- Mention other users

</details>

<details>
<summary><b>🔄 Status Tracking</b></summary>

<br>

- Update task status: Pending → In Progress → Completed
- Visual progress indicators
- Task history timeline
- Due date notifications
- Overdue task alerts

</details>

</td>
<td width="50%" valign="top">

### ⚙️ Admin Dashboard

<details>
<summary><b>👥 User Management</b></summary>

<br>

- Create new user accounts
- Edit user profiles & roles
- Delete user accounts
- View user activity logs
- No public signup (admin-controlled)

</details>

<details>
<summary><b>📝 Task CRUD</b></summary>

<br>

- Create tasks with title, description, priority
- Assign tasks to specific users
- Set due dates and priorities
- Edit task details
- Delete tasks with confirmation

</details>

<details>
<summary><b>📊 Reports Dashboard</b></summary>

<br>

- Task completion analytics
- User productivity metrics
- Overdue task tracking
- Status distribution charts
- Export reports to PDF/CSV

</details>

<details>
<summary><b>🎯 Task Assignment</b></summary>

<br>

- Assign/reassign tasks to users
- Bulk task operations
- Priority-based task filtering
- Task load balancing view
- Assignment history

</details>

</td>
</tr>
</table>

<br>

### 🎯 Feature Status

| Feature | Description | Status |
|---------|-------------|--------|
| **Authentication** | JWT + bcrypt + Google OAuth | ✅ Live |
| **User Management** | Admin-only user creation & management | ✅ Live |
| **Task CRUD** | Create, read, update, delete tasks | ✅ Live |
| **Role-Based Access** | Admin vs User permissions | ✅ Live |
| **Task Comments** | Collaborate on tasks with comments | ✅ Live |
| **Status Workflow** | Pending → In Progress → Completed | ✅ Live |
| **Admin Reports** | Analytics & productivity dashboard | ✅ Live |
| **Mission Control UI** | Glassmorphic design with animations | ✅ Live |
| **Real-time Updates** | WebSocket notifications | 🚧 Planned |
| **Email Notifications** | Task assignment & due date alerts | 🚧 Planned |

---

<h2 id="architecture">
  <img src="https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif" width="30">
  &nbsp;Architecture
</h2>

### System Architecture

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#6366f1', 'primaryTextColor': '#fff', 'primaryBorderColor': '#818cf8', 'lineColor': '#a5b4fc', 'secondaryColor': '#1e1b4b', 'tertiaryColor': '#312e81'}}}%%
flowchart TB
    subgraph Client["🌐 Client Layer"]
        A[React + TypeScript]
        B[Vite + TailwindCSS]
    end

    subgraph Auth["🔐 Auth Layer"]
        C[JWT + bcrypt]
        D[Google OAuth 2.0]
    end

    subgraph Backend["⚙️ Backend Layer"]
        E[Node.js + Express API]
    end

    subgraph Database["🗄️ Data Layer"]
        F[(PostgreSQL)]
        G[Migrations + Scripts]
    end

    subgraph Roles["👥 Role Layer"]
        H[Admin]
        I[User]
    end

    A --> E
    B --> A
    E --> C
    E --> D
    E --> F
    F --> G
    E --> H
    E --> I

    style Client fill:#1e1b4b,stroke:#818cf8,stroke-width:2px
    style Auth fill:#1e3a5f,stroke:#60a5fa,stroke-width:2px
    style Backend fill:#1a2e1a,stroke:#4ade80,stroke-width:2px
    style Database fill:#2d1b1b,stroke:#f87171,stroke-width:2px
    style Roles fill:#1b2d1b,stroke:#a3e635,stroke-width:2px
```

<details>
<summary><b>📊 Data Flow Sequence</b></summary>

<br>

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#6366f1', 'primaryTextColor': '#fff'}}}%%
sequenceDiagram
    actor User
    participant React as React App
    participant API as Express API
    participant Auth as Auth Module
    participant DB as PostgreSQL

    User->>React: Open App
    React->>API: Check JWT Token
    API->>Auth: Validate Token
    Auth-->>API: Token Valid
    API->>DB: Fetch User Tasks
    DB-->>API: Return Tasks
    API-->>React: Tasks Data
    React-->>User: Display Dashboard

    User->>React: Create New Task
    React->>API: POST /tasks
    API->>Auth: Verify Admin Role
    Auth-->>API: Authorized
    API->>DB: Insert Task
    DB-->>API: Task Created
    API-->>React: Success Response
    React-->>User: Show Success

    User->>React: Assign Task to User
    React->>API: PATCH /tasks/:id
    API->>DB: Update Task Assignment
    DB-->>API: Updated
    API-->>React: Updated Task
    React-->>User: Assignment Confirmed

    User->>React: Update Task Status
    React->>API: PATCH /tasks/:id
    API->>DB: Update Status
    DB-->>API: Status Updated
    API-->>React: Success
    React-->>User: Status Changed

    User->>React: View Reports
    React->>API: GET /reports
    API->>Auth: Verify Admin
    Auth-->>API: Authorized
    API->>DB: Aggregate Analytics
    DB-->>API: Report Data
    API-->>React: Analytics
    React-->>User: Display Charts
```

</details>

<br>

### 🔄 Task Workflow

```mermaid
%%{init: {'theme': 'dark'}}%%
graph LR
    A[📋 Pending] -->|Start Work| B[🔄 In Progress]
    B -->|Finish Task| C[✅ Completed]
    style A fill:#6366f1,stroke:#818cf8,stroke-width:3px
    style B fill:#eab308,stroke:#fde047,stroke-width:3px
    style C fill:#22c55e,stroke:#4ade80,stroke-width:3px
```

---

<h2 id="quick-start">
  <img src="https://media.giphy.com/media/XGma2iRIHTKkwqRkFl/giphy.gif" width="30">
  &nbsp;Quick Start
</h2>

<div align="center">

> ⚡ **Get Task Manager running in under 3 minutes!**

</div>

```bash
# Clone the repository
git clone https://github.com/Mr-Swapnil25/Odoo-x-GCET-Hackathon-26.git
cd Odoo-x-GCET-Hackathon-26

# Install frontend dependencies
npm install

# Setup environment
cp .env.example .env

# Install backend dependencies and setup database
cd server
npm install
npm run migrate

# Start backend (in server directory)
npm run dev

# Start frontend (in root directory)
cd ..
npm run dev
```

<br>

### 📝 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend development server (port 3000) |
| `npm run build` | Build frontend for production |
| `cd server && npm run dev` | Start backend API server (port 4000) |
| `cd server && npm run migrate` | Run database migrations |

---

<h2 id="installation">
  <img src="https://media.giphy.com/media/SS8CV2rQdlYNLtBCiF/giphy.gif" width="30">
  &nbsp;Installation
</h2>

<details>
<summary><b>📋 Prerequisites</b></summary>

<br>

Before you begin, ensure you have the following installed:

- **Node.js** ≥ 18.x ([Download](https://nodejs.org/))
- **npm** ≥ 9.x (comes with Node.js)
- **PostgreSQL** ≥ 14.x ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

Verify installations:

```bash
node --version  # Should be ≥ 18.x
npm --version   # Should be ≥ 9.x
psql --version  # Should be ≥ 14.x
git --version
```

</details>

<details>
<summary><b>🗄️ Database Setup</b></summary>

<br>

1. **Create PostgreSQL database:**

```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE task_manager;

# Exit PostgreSQL
\q
```

2. **Run migrations:**

```bash
cd server
npm run migrate
```

3. **Seed database** (optional - creates test users):

```bash
npx tsx prisma/seed.ts
```

This creates:
- **Admin**: `admin@taskmanager.com` / `Admin@123`
- **User 1**: `john@taskmanager.com` / `User@123`
- **User 2**: `jane@taskmanager.com` / `User@123`

</details>

<details>
<summary><b>🔐 Bootstrap Admin Account</b></summary>

<br>

If no users exist in the database, you can create the first admin account using the bootstrap endpoint:

```bash
POST http://localhost:4000/auth/bootstrap-admin
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

**Note:** This endpoint only works when the database has zero users.

</details>

---

<h2 id="configuration">
  <img src="https://media.giphy.com/media/IeV0KeQn6nJ3a/giphy.gif" width="30">
  &nbsp;Configuration
</h2>

<details>
<summary><b>🌐 Frontend Configuration</b></summary>

<br>

Create a `.env` file in the **root directory**:

```bash
═══════════════════════════════════════════════════════════
                    FRONTEND CONFIG
═══════════════════════════════════════════════════════════

VITE_API_BASE_URL=http://localhost:4000
```

</details>

<details>
<summary><b>🔧 Backend Configuration</b></summary>

<br>

Create a `.env` file in the **server/** directory:

```bash
═══════════════════════════════════════════════════════════
                    BACKEND CONFIG
═══════════════════════════════════════════════════════════

DATABASE_URL=postgresql://postgres:password@localhost:5432/task_manager
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000
PORT=4000
```

</details>

<details>
<summary><b>🔐 Auth Configuration (Google OAuth)</b></summary>

<br>

Add to your **server/.env** file:

```bash
═══════════════════════════════════════════════════════════
                    AUTH CONFIG
═══════════════════════════════════════════════════════════

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Setup Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Create **OAuth 2.0 credentials**
5. Add authorized redirect URI: `http://localhost:4000/auth/google/callback`
6. Copy **Client ID** and **Client Secret** to `.env`

</details>

---

<h2 id="usage">
  <img src="https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif" width="30">
  &nbsp;Usage
</h2>

<details>
<summary><b>👤 User Flow</b></summary>

<br>

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#6366f1'}}}%%
graph TD
    A[🔐 User Login] --> B{Auth Success?}
    B -->|Yes| C[📊 Dashboard]
    B -->|No| A
    C --> D[📋 Browse Assigned Tasks]
    D --> E[👁️ View Task Details]
    E --> F[💬 Add Comment]
    F --> G[🔄 Update Status]
    G --> H{Task Complete?}
    H -->|Yes| I[✅ Mark Completed]
    H -->|No| D
    I --> D

    style A fill:#6366f1,stroke:#818cf8
    style C fill:#22c55e,stroke:#4ade80
    style I fill:#10b981,stroke:#34d399
```

</details>

<details>
<summary><b>🛡️ Admin Flow</b></summary>

<br>

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#8b5cf6'}}}%%
graph TD
    A[🔐 Admin Login] --> B[📊 Admin Dashboard]
    B --> C{Action?}
    C -->|Users| D[👥 User Management]
    C -->|Tasks| E[📝 Task Management]
    C -->|Reports| F[📈 View Reports]
    
    D --> D1[➕ Create User]
    D --> D2[✏️ Edit User]
    D --> D3[🗑️ Delete User]
    D1 --> B
    D2 --> B
    D3 --> B
    
    E --> E1[➕ Create Task]
    E --> E2[🎯 Assign to User]
    E --> E3[📊 Monitor Progress]
    E1 --> E2
    E2 --> E3
    E3 --> B
    
    F --> F1[📊 Task Analytics]
    F --> F2[👥 User Productivity]
    F --> F3[⏰ Overdue Tasks]
    F1 --> B
    F2 --> B
    F3 --> B

    style A fill:#8b5cf6,stroke:#a78bfa
    style B fill:#6366f1,stroke:#818cf8
    style D fill:#3b82f6,stroke:#60a5fa
    style E fill:#eab308,stroke:#fde047
    style F fill:#22c55e,stroke:#4ade80
```

</details>

---

<h2 id="security">
  <img src="https://media.giphy.com/media/077i6AULCXc0FKTj9s/giphy.gif" width="30">
  &nbsp;Security
</h2>

### 🔒 Security Features

- ✅ **Password Hashing**: bcrypt with 10 salt rounds
- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **OAuth 2.0**: Google authentication integration
- ✅ **Role-Based Access**: Admin vs User permissions
- ✅ **SQL Injection Protection**: Parameterized queries via Prisma ORM
- ✅ **XSS Protection**: Input sanitization
- ✅ **CORS Configuration**: Restricted origins
- ✅ **Environment Variables**: Sensitive data in .env files

---

<h2 id="roadmap">
  <img src="https://media.giphy.com/media/3o7TKsHiMxA8CnVFzq/giphy.gif" width="30">
  &nbsp;Roadmap
</h2>

```
✅ Phase 1: Core System (100%)
████████████████████████████████████████ 100%
├── ✅ User Authentication (JWT + bcrypt)
├── ✅ Google OAuth Integration
├── ✅ Task CRUD Operations
├── ✅ Role-Based Access Control
└── ✅ Basic Dashboard UI

✅ Phase 2: Workflow & Reports (100%)
████████████████████████████████████████ 100%
├── ✅ Task Status Workflow (Pending → In Progress → Completed)
├── ✅ Task Comments System
├── ✅ Admin Reports Dashboard
├── ✅ User Management Panel
└── ✅ Mission Control UI Design

🚧 Phase 3: Enhancements (30%)
████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 30%
├── 🚧 Real-time Updates (WebSocket)
├── 🚧 Email Notifications
├── 📋 Task File Attachments
├── 📋 Advanced Search & Filters
└── 📋 Task Templates

📋 Phase 4: AI & Intelligence (0%)
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
├── 📋 AI-Powered Task Prioritization
├── 📋 Smart Comment Summarization
├── 📋 Natural Language Reports
├── 📋 Predictive Due Date Suggestions
└── 📋 Automated Task Distribution
```

---

<h2 id="contributing">
  <img src="https://media.giphy.com/media/jSKBmKkvo2dPQQtsR1/giphy.gif" width="30">
  &nbsp;Contributing
</h2>

We welcome contributions! Follow this workflow:

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#22c55e'}}}%%
graph LR
    A[🍴 Fork] --> B[🌿 Branch]
    B --> C[💻 Code]
    C --> D[🧪 Test]
    D --> E[📝 Commit]
    E --> F[📤 PR]
    F --> G[👀 Review]
    G --> H{Approved?}
    H -->|Yes| I[✅ Merge]
    H -->|No| C
    
    style A fill:#6366f1,stroke:#818cf8
    style I fill:#22c55e,stroke:#4ade80
```

<details>
<summary><b>📖 Contribution Guide</b></summary>

<br>

### Step-by-Step Process

1. **Fork the repository**
   ```bash
   # Click the 'Fork' button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/Odoo-x-GCET-Hackathon-26.git
   cd Odoo-x-GCET-Hackathon-26
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic

5. **Test your changes**
   ```bash
   npm run build  # Frontend build test
   cd server && npm run dev  # Backend test
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   **Commit Message Conventions:**
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting)
   - `refactor:` Code refactoring
   - `test:` Adding tests
   - `chore:` Maintenance tasks

7. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

8. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Describe your changes clearly

### 📝 Code Style Guidelines

- Use **TypeScript** for type safety
- Follow **ESLint** rules
- Use **Prettier** for formatting
- Write **meaningful variable names**
- Add **JSDoc comments** for functions
- Keep **functions small and focused**

### 🐛 Bug Reports

Found a bug? [Open an issue](https://github.com/Mr-Swapnil25/Odoo-x-GCET-Hackathon-26/issues/new) with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

</details>

---

<h2 id="license">
  <img src="https://media.giphy.com/media/VgCDAzcKvsR6OM0uWg/giphy.gif" width="30">
  &nbsp;License
</h2>

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Mr-Swapnil25

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

### ⭐ Star this repo if you found it helpful!

<p>
  <a href="https://github.com/Mr-Swapnil25/Odoo-x-GCET-Hackathon-26/stargazers"><img src="https://img.shields.io/badge/⭐-Star%20This%20Repo-yellow?style=for-the-badge&logo=github" alt="Star"></a>
  <a href="https://github.com/Mr-Swapnil25/Odoo-x-GCET-Hackathon-26/fork"><img src="https://img.shields.io/badge/🍴-Fork%20This%20Repo-blue?style=for-the-badge&logo=github" alt="Fork"></a>
  <a href="https://github.com/Mr-Swapnil25/Odoo-x-GCET-Hackathon-26/issues"><img src="https://img.shields.io/badge/🐛-Report%20Bug-red?style=for-the-badge&logo=github" alt="Bug"></a>
</p>

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer" width="100%">

<p>
  <b>Made with ❤️ for Odoo x GCET Hackathon 2026</b>
  <br>
  <sub>by <a href="https://github.com/Mr-Swapnil25">Mr-Swapnil25</a></sub>
</p>

</div>

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
