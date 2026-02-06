# Wall Painting Services - Enterprise AI CMS Platform

[![Node.js](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.1-red)](https://nestjs.com/)
[![Codecov](https://codecov.io/gh/yourusername/wallpaintingservices/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/wallpaintingservices)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Production-ready, enterprise-grade AI CMS built with Next.js (frontend) and NestJS (backend). This monorepo focuses on security, performance, and a feature-rich admin experience.

## Table of Contents

- Overview
- Features
- Tech Stack
- Architecture
- Repository Layout
- Requirements
- Quick Start
- Environment Configuration
- Database Setup
- Development
- Testing and Coverage
- Docker
- Deployment
- Operations
- Contributing
- Support
- Acknowledgments
- Security Notes
- Recent Updates
- License

## Overview

Wall Painting Services CMS provides a full content platform: blog and page management, AI-assisted content generation, SEO tooling, and a modern admin UI.

## Features

### AI Content and SEO
- AI-assisted blog generation and optimization
- SEO audit tooling, interlinking, and sitemap management
- Metadata support for Open Graph and social sharing

### Content Management
- Drafts, scheduling, and approvals
- Page builder with widget-based layouts
- Media library with upload and metadata management
- Tag and category hierarchy
- Comment moderation and engagement controls
- ProseMirror-based rich text editor

### Security and Admin
- Role-based access control with auth hub and role-aware redirects
- Email verification and admin comms hub
- Rate limiting, input validation, and sanitization
- Secure headers (Helmet) and compression

### Performance and UX
- Next.js App Router with SSR/SSG
- Prisma ORM with PostgreSQL
- Dark mode with persistence across refresh

## Tech Stack

- Frontend: Next.js App Router (frontend/)
- Backend: NestJS API (backend/)
- Database: PostgreSQL via Prisma
- Testing: Jest (backend and frontend)
- Styling: Tailwind CSS (frontend)
- Monorepo: npm workspaces at repo root

## Architecture

```
├── backend/           # NestJS API Server
│   ├── src/
│   │   ├── auth/      # Authentication & Authorization
│   │   ├── blog/      # Blog Management
│   │   ├── ai/        # AI Integration
│   │   ├── media/     # Media Library
│   │   └── ...
│   └── prisma/        # Database Schema & Migrations
│
├── frontend/          # Next.js 16 Application
│   ├── app/           # App Router Pages
│   ├── components/    # React Components
│   ├── lib/           # Utilities & API Client
│   └── locales/       # i18n scaffolding
│
└── docker-compose.yml # Local Development DB
```

## Repository Layout

- `frontend/` Next.js app and admin UI
- `backend/` NestJS API, Prisma, and jobs
- `docker-compose.yml` local Postgres for development
- `docker-compose.prod.yml` production stack (Postgres, Redis, backend, frontend)
- `Dockerfile.backend` and `Dockerfile.frontend` production images
- `backup.sh` database backup helper
- `deploy.sh` production deploy helper
- `.env.production.example` production environment template
- `audit_ledger.md` audit fixes and compliance notes

## Requirements

- Node.js >= 24
- npm >= 10
- PostgreSQL >= 16
- Optional: Docker (local DB), AI provider API key for AI features

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
3. Start a local database (optional if you already have one):
   ```bash
   npm run docker:dev
   ```
4. Run migrations and generate Prisma client:
   ```bash
   cd backend
   npm run db:generate
   npm run db:migrate
   ```
5. Optional: seed data:
   ```bash
   npm run db:seed
   # or
   npm run db:seed:full
   ```
6. Start dev servers (from repo root):
   ```bash
   npm run dev
   ```

## Environment Configuration

Use the example files as the source of truth:
- Backend: `backend/.env.example`
- Frontend: `frontend/.env.example`
- Production: `.env.production.example`

Backend required variables (minimum):
- `DATABASE_URL`
- `JWT_SECRET`
- `APP_SECRET`
- `FRONTEND_URL`

Frontend required variables (minimum):
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`

Common optional variables:
- `AI_API_KEY` and `AI_MODEL` for AI content generation
- SMTP settings for email delivery
- reCAPTCHA keys for abuse protection

## Database Setup

From `backend/`:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Additional commands:
- `npm run db:migrate:deploy` apply migrations in production
- `npm run db:migrate:reset` reset and re-run migrations
- `npm run db:studio` open Prisma Studio

## Development

From repo root:
- `npm run dev` start backend and frontend
- `npm run dev:fast` frontend dev without source maps
- `npm run lint` lint all workspaces
- `npm run format` format JS, TS, JSON, CSS, and MD files
- `npm run health` check backend and frontend health endpoints

## Testing and Coverage

Run all tests (all workspaces):
```bash
npm run test
```

Backend tests and coverage:
```bash
npm run test --workspace=backend
npm run test:cov --workspace=backend
npm run test:e2e --workspace=backend
```

Frontend tests and coverage:
```bash
npm run test --workspace=frontend
npm run test:coverage --workspace=frontend
```

Coverage output:
- Backend: `backend/coverage/`
- Frontend: `frontend/coverage/`

Coverage reporting:
- CI uploads coverage to Codecov.
- For private repos, set `CODECOV_TOKEN` in GitHub Actions secrets.

## Docker

Local database only:
```bash
npm run docker:dev
```

Production stack:
```bash
npm run docker:prod
```

Stop and clean up:
```bash
npm run docker:down
```

## Deployment

`deploy.sh` automates the production flow:
- Loads `.env.production`
- Backs up the database
- Builds and restarts Docker services
- Runs Prisma migrations
- Runs basic health checks

Manual production build:
```bash
npm run build
npm run start
```

## Operations

Backups:
```bash
npm run backup
```

Health checks:
```bash
npm run health
```

Default seed credentials (change immediately in production):
- Admin: `admin@example.com` / `password123`
- Editor: `editor@example.com` / `password123`
- Author: `author@example.com` / `password123`

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m "Add amazing feature"`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## Support

For support, open an issue in the repository or contact your maintainer team.

## Acknowledgments

- Next.js team for the framework
- NestJS for the backend architecture
- Prisma for the ORM
- Open-source contributors

## Security Notes

- Change default credentials immediately after seeding
- Use strong secrets for JWT and app cookies
- Keep `.env` files out of version control
- Review `audit_ledger.md` for audit fixes and compliance notes

## Recent Updates

- Auth hub with role-aware redirects and Join Us entry point
- Inline email verification by 6-digit code plus token support
- Admin SEO: sitemap stats and updated audit TODOs
- Dark mode persistence on refresh

## License

MIT
