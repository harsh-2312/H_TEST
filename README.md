# Ledger Core

Production-grade offline-first accounting SaaS — Next.js, Express, PostgreSQL, Prisma, Dexie, WebSockets.

## Apps
- `apps/web` — Next.js 14 PWA frontend
- `apps/api` — Express + Prisma backend

## Quick Start

```bash
# Docker (easiest)
docker-compose up --build

# Local dev — see DEPLOY.md for full steps
```

Open http://localhost:3000 → click **Create an account**

## Full Deploy Guide
See **DEPLOY.md** for:
- Local dev setup
- Docker Compose
- VPS (Ubuntu) production deployment
- Railway / Render cloud deployment
- Nginx + SSL setup

## Stack
- **Frontend**: Next.js 14, TypeScript, TailwindCSS, Zustand, Dexie.js (IndexedDB), Framer Motion
- **Backend**: Express, Prisma ORM, PostgreSQL
- **Auth**: JWT + Refresh Tokens, RBAC (Owner/Manager/Staff/Accountant)
- **Offline**: IndexedDB sync queue, background sync on reconnect
- **Realtime**: WebSocket
- **Security**: Helmet, CORS, rate limiting, bcrypt, SQL injection protection via Prisma
