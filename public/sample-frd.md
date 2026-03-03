# Sample FRD — Test the FRD Doc Generator

Upload this file at http://localhost:3000 to get generated docs. **Using .md avoids PDF parsing and is faster.**

---

## Project Name
**Task Tracker Web App**

## Overview
A simple web application for teams to create, assign, and track tasks. Users can sign up, create projects, add tasks with due dates, and mark them complete.

## Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Auth:** JWT

## Key Features
1. User registration and login
2. Create projects and invite members
3. Add tasks with title, description, assignee, due date, priority (High/Medium/Low)
4. Kanban-style board: To Do, In Progress, Done
5. Notifications when a task is assigned to you
6. Export task list as CSV

## Phases & Timeline
- **Phase 1 (Weeks 1–2):** Setup project, DB schema, auth API
- **Phase 2 (Weeks 3–4):** Projects and tasks CRUD, basic UI
- **Phase 3 (Weeks 5–6):** Kanban board, drag-drop, notifications
- **Phase 4 (Week 7):** CSV export, testing, deployment

## Milestones
- M1: Auth working (login/signup)
- M2: Can create project and add tasks
- M3: Full Kanban board with assignee
- M4: Live on staging URL

## Conventions
Use ESLint and Prettier. Branch naming: `feature/task-name` or `fix/bug-name`. Commit format: `type(scope): message` (e.g. `feat(api): add task create endpoint`).
