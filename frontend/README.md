# MedQueue Pro — Frontend (Next.js)

Smart Hospital Appointment & Queue Management System.

**Project Owner:** Onu Confidence Chiemeria · **Sponsored by:** Dr. Anoke Fabian Amaechi

## Tech Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · GSAP · Chart.js · React Icons · Axios

## 1. Setup

```bash
cd medqueue-frontend
npm install
cp .env.local.example .env.local
# set NEXT_PUBLIC_API_URL to your backend, e.g. http://localhost:5000/api
```

## 2. Run

```bash
npm run dev
```

Visit `http://localhost:3000`.

## 3. Pages

| Route | Description |
|---|---|
| `/` | Home — hero (GSAP floating icons), stats, about, departments, doctors preview, CTA |
| `/about` | Mission, vision, goals |
| `/doctors` | Filterable doctor directory |
| `/departments` | All 12 departments |
| `/appointments` | 5-step booking flow → generates a live queue ticket |
| `/queue-tracker` | Live queue view with auto-advancing status |
| `/contact` | Contact form, hospital info, map |
| `/login`, `/register` | Wired to the backend's `/api/auth` routes |
| `/dashboard/patient` | Patient portal — appointments, queue ticket, notifications |
| `/dashboard/doctor` | Doctor portal — today's patients, queue |
| `/dashboard/admin` | Admin console — Chart.js analytics, management shells |

## 4. Connecting to the backend

`lib/api.ts` is a pre-wired Axios client. Every function maps to a route in the `/backend` project:

```ts
import { bookAppointment, fetchDepartments, login } from "@/lib/api";
```

The JWT returned from `/login` or `/register` is stored in `localStorage` and attached automatically to future requests via an Axios interceptor. Dashboards and the booking flow currently render with local demo data (`lib/data.ts`) so the UI is fully testable without the backend running; swap those imports for the `lib/api.ts` calls once your database is seeded.

## 5. Design system

- **Colors:** Primary `#0F4C81`, Secondary `#16A34A`, Accent `#38BDF8` — defined in `tailwind.config.ts`
- **Fonts:** Poppins (display), Inter (body), Montserrat (utility/labels) — loaded via `next/font/google` in `app/layout.tsx`
- **Dark mode:** class-based, toggled via `components/ThemeProvider.tsx`, persisted to `localStorage`
- **Signature element:** the "queue ticket" boarding-pass component (`components/QueueTicket.tsx`) — appears in the hero, the booking confirmation, and the patient dashboard

## 6. Deployment (Vercel)

1. Push this folder to a GitHub repo (root = `medqueue-frontend`).
2. Import into Vercel, framework preset "Next.js" is auto-detected.
3. Add environment variable `NEXT_PUBLIC_API_URL` pointing at your deployed backend (Railway/Render).
4. Deploy. Vercel handles build (`next build`) and hosting automatically.
