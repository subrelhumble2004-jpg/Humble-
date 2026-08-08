# MedQueue Pro — Backend API

Smart Hospital Appointment & Queue Management System — REST API.

**Project Owner:** Onu Confidence Chiemeria · **Sponsored by:** Dr. Anoke Fabian Amaechi

## Tech Stack
Node.js · Express.js · MySQL (mysql2) · JWT · bcryptjs · Nodemailer · Helmet · express-rate-limit · xss-clean

## 1. Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your real MySQL and SMTP credentials
```

## 2. Create the database

```bash
mysql -u root -p < database/schema.sql
npm run seed
```

This creates all tables and seeds:
- 12 departments
- Admin login: `admin@medqueuepro.com` / `Admin@12345`
- Sample doctor login: `amaka.obi@medqueuepro.com` / `Doctor@12345`

**Change these passwords immediately in production.**

## 3. Run the server

```bash
npm run dev     # development, auto-restart
npm start       # production
```

API runs at `http://localhost:5000`. Health check: `GET /api/health`.

## 4. API Overview

| Area | Method & Route | Access |
|---|---|---|
| Auth | `POST /api/auth/register` | Public |
| Auth | `POST /api/auth/login` | Public |
| Auth | `POST /api/auth/refresh` | Public |
| Auth | `GET /api/auth/me` | Authenticated |
| Departments | `GET /api/departments` | Public |
| Departments | `POST /api/departments` | Admin |
| Doctors | `GET /api/doctors?department=&status=` | Public |
| Doctors | `POST /api/doctors` | Admin |
| Doctors | `PATCH /api/doctors/:id/status` | Admin/Doctor |
| Appointments | `POST /api/appointments` | Patient |
| Appointments | `GET /api/appointments/me` | Patient |
| Appointments | `GET /api/appointments/doctor/:doctorId` | Doctor/Admin |
| Appointments | `GET /api/appointments` | Admin |
| Appointments | `PATCH /api/appointments/:id/cancel` | Owner/Admin |
| Appointments | `PATCH /api/appointments/:id/reschedule` | Owner/Admin |
| Appointments | `PATCH /api/appointments/:id/status` | Doctor/Admin |
| Queue | `GET /api/queue/:departmentId` | Public (live queue) |
| Queue | `GET /api/queue/appointment/:id/position` | Public |
| Queue | `PATCH /api/queue/:appointmentId/advance` | Doctor/Admin |
| Admin | `GET /api/admin/stats` | Admin |
| Admin | `GET /api/admin/patients` | Admin |
| Admin | `GET /api/admin/audit-logs` | Admin |

All protected routes require: `Authorization: Bearer <accessToken>`

## 5. Booking flow (how the queue number is generated)

1. Patient calls `POST /api/appointments` with `doctorId`, `departmentId`, `date`, `time`.
2. Server checks the doctor isn't already booked for that slot.
3. `generateQueueNumber()` counts today's appointments in that department and returns e.g. `CARD-014`.
4. Appointment + queue_log rows are created in one transaction.
5. A confirmation email is sent via Nodemailer (non-blocking).
6. Frontend can poll `GET /api/queue/:departmentId` for live position, or `GET /api/queue/appointment/:id/position`.

## 6. Security measures included

- Passwords hashed with **bcrypt** (12 salt rounds)
- **JWT** access + refresh tokens, role-based route guards (`patient`/`doctor`/`admin`)
- All SQL uses **parameterized queries** (mysql2) — no string-concatenated SQL
- **helmet** for secure HTTP headers, **xss-clean** to sanitize input, **express-rate-limit** to throttle abuse
- Centralized error handler that hides stack traces in production

## 7. Deployment

**Railway / Render**
1. Push this `backend/` folder to a GitHub repo.
2. Create a new Web Service, set the root directory to `backend`.
3. Add all variables from `.env.example` in the dashboard's environment settings.
4. Provision a MySQL instance (Railway MySQL plugin, or PlanetScale/Aiven) and point `DB_HOST` etc. at it.
5. Run `schema.sql` against that instance, then trigger `npm run seed` once via the platform shell.
6. Set `CLIENT_URL` to your deployed frontend's URL for CORS.

**Connecting the frontend**
Set the frontend's API base URL (e.g. an `.env` value like `NEXT_PUBLIC_API_URL`) to this server's deployed URL, and call these endpoints with `axios`/`fetch`, attaching the JWT from login/register to the `Authorization` header on protected calls.
