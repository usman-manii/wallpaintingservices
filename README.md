# Wall Painting Services - Enterprise AI CMS Platform

Production-ready, enterprise-grade CMS built with Next.js (frontend) and NestJS (backend). This monorepo focuses on security, performance, and a feature-rich admin experience.

## Table of Contents

- Overview
- Features
- Architecture
- Requirements
- Quick Start
- Environment Variables
- Database Migrations and Seeding
- Development Scripts
- Production Build
- Testing and Coverage
- New Machine Checklist
- Recent Updates
- Security Notes
- License

## Overview

Wall Painting Services CMS provides a full content platform: blog and page management, AI-assisted content generation, SEO tooling, and a modern admin UI.

## Features

- Content management with drafts, scheduling, and approvals
- Page builder with widget-based layouts
- Media library with upload + metadata management
- Tag and category management with hierarchy support
- Comments moderation and engagement controls
- AI content generation modes with configurable depth
- SEO audit, interlinking, and sitemap management
- Auth hub with role-aware redirects and email verification
- Admin Comms Hub for notifications, campaigns, and greetings
- Dark mode with persistence across refresh

## Architecture

- Frontend: Next.js App Router (frontend/)
- Backend: NestJS API (backend/)
- Database: PostgreSQL via Prisma
- Monorepo: npm workspaces at repo root

## Requirements

- Node.js >= 24
- npm >= 10
- PostgreSQL >= 16
- Optional: Docker (local DB), OpenAI API key (AI features)

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
3. Run migrations and generate Prisma client:
   ```bash
   cd backend
   npm run db:generate
   npm run db:migrate
   ```
4. Optional: seed data
   ```bash
   npm run db:seed
   # or
   npm run db:seed:full
   ```
5. Start dev servers:
   ```bash
   npm run dev
   ```

Windows shortcut:
```powershell
.\runservers.ps1
```

## Environment Variables

Backend (backend/.env):
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/cms_ai_db"
JWT_SECRET="long-random-secret"
APP_SECRET="long-random-secret"
COOKIE_SECRET="long-random-secret"
FRONTEND_URL="http://localhost:3000"
```

Optional backend:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
AI_API_KEY="sk-..."
AI_MODEL="gpt-4"
```

Frontend (frontend/.env.local):
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Optional frontend:
```env
NEXT_PUBLIC_SITE_NAME="Wall Painting Services"
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="..."
NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY="..."
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXX"
```

## Database Migrations and Seeding

- Generate Prisma client: `npm run db:generate` (backend)
- Run migrations (dev): `npm run db:migrate` (backend)
- Run migrations (prod): `npm run db:migrate:deploy` (backend)
- Seed data: `npm run db:seed` or `npm run db:seed:full`

## Development Scripts

From repo root:

- `npm run dev` (backend + frontend)
- `npm run dev:fast` (frontend dev without source maps)
- `npm run build` (build all workspaces)
- `npm run start` (prod start for both workspaces)
- `npm run lint` (lint all workspaces)
- `npm run test` (run tests)

## Production Build

```bash
npm run build
npm run start
```

## Testing and Coverage

Backend:
```bash
cd backend
npm run test
npm run test:cov
```

Frontend:
```bash
cd frontend
npm test -- --coverage
```

Coverage output:
- backend: `backend/coverage/`
- frontend: `frontend/coverage/`

## New Machine Checklist

Use this when moving the project to another PC or fresh environment.

1. Install Node.js >= 24 and PostgreSQL >= 16.
2. Clone the repo and run `npm install` at the project root.
3. Create environment files as shown above.
4. Configure `DATABASE_URL`, secrets, and public URLs.
5. Run `npm run db:generate` and `npm run db:migrate` in `backend/`.
6. Optional: run seed scripts for sample data.
7. Start servers with `npm run dev`.

## Recent Updates

- Auth hub with role-aware redirects and Join Us entry point
- Inline email verification by 6-digit code plus token support
- Admin SEO: sitemap stats/configuration and updated audit TODOs
- Dark mode persistence on refresh

## Security Notes

- Change default credentials immediately after seeding
- Use strong secrets for JWT and app cookies
- Keep `.env` files out of version control
- Review `audit_ledger.md` for audit fixes and compliance notes

## License

MIT
