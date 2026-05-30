# Internal Asset Portal

A full-stack enterprise Internal Asset Tracking system built with React, Express, Prisma, and PostgreSQL (Neon).

## Demo Credentials

| Account | Email | Password |
|---------|-------|----------|
| Admin | admin@system.com | admin123 |
| Employee | employee1@system.com | employee123 |

## Tech Stack

- **Frontend:** React 19 + Vite + TailwindCSS 4
- **Backend:** Express 5 + Prisma ORM
- **Database:** PostgreSQL (Neon)
- **Auth:** JWT + bcryptjs

## Local Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Deployment

- **Backend:** Render (Web Service)
- **Frontend:** Vercel
- **Database:** Neon PostgreSQL

## Environment Variables

### Backend (Render)
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — Secret key for JWT signing
- `FRONTEND_URL` — Deployed frontend URL (for CORS)

### Frontend (Vercel)
- `VITE_API_URL` — Deployed backend URL
