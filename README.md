# Dentalprinter Clinic

Clinical operations dashboard for dental practices. The app has a real Express API, authenticated sessions, validated requests, Prisma persistence, audit logs, notifications, and a React clinical workspace.

## Stack

- Frontend: React 19, Vite, TypeScript, Tailwind CSS v4, lucide-react.
- Backend: Express, TypeScript, JWT auth, bcrypt password hashing, Helmet, CORS, rate limiting, Zod validation.
- Persistence: Prisma ORM with SQLite for local development. The schema is ready to move to Postgres for production.

## Local Setup on Windows

1. Install Node.js 22 LTS or newer.
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Copy `.env.example` to `.env.local` or `.env`.
4. Change `JWT_SECRET` and `SEED_ADMIN_PASSWORD` before sharing or deploying.
5. Create the local database and seed the first admin:
   ```powershell
   $env:DATABASE_URL="file:./dev.db"
   npm run db:migrate
   npm run db:seed
   ```
6. Run API and frontend:
   ```powershell
   npm run dev:full
   ```
7. Open `http://localhost:3000`.

Default local login is created on first server boot:

- Email: `admin@dentalprinter.local`
- Password: value of `SEED_ADMIN_PASSWORD`, default `ChangeMe!2026`

## Commands

```powershell
npm run server
npm run dev
npm run dev:full
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
npm run lint
npm run build
npm run ci
npm run clean
```

## Production Notes

This repository is not yet certified for storing real ePHI. Before production use, move `DATABASE_URL` to a managed encrypted Postgres database, rotate secrets, enable HTTPS-only deployment, configure automated backups, complete role matrices, and perform a formal compliance review.
