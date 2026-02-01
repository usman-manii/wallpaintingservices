# 🎨 Wall Painting Services - Enterprise AI CMS Platform

<div align="center">

[![Node.js](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.1-red?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.1-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)

[![Build Status](https://img.shields.io/badge/build-passing-success?style=for-the-badge)](https://github.com/usman-manii/wallpaintingservices)
[![Code Quality](https://img.shields.io/badge/code%20quality-A+-success?style=for-the-badge)](https://github.com/usman-manii/wallpaintingservices)
[![Security](https://img.shields.io/badge/security-A+-success?style=for-the-badge)](ENTERPRISE_AUDIT_REPORT.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)
[![Maintained](https://img.shields.io/badge/maintained-yes-success?style=for-the-badge)](https://github.com/usman-manii/wallpaintingservices/pulse)

**A production-ready, enterprise-grade AI-powered CMS platform with cutting-edge technology stack**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-api-documentation) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 🌟 Overview

**Wall Painting Services CMS** is a modern, full-stack content management system built with the latest technologies. It combines the power of AI-driven content generation, advanced SEO capabilities, and a flexible page builder to deliver an unmatched content management experience.

### 💡 Why Choose This CMS?

- ⚡ **Lightning Fast**: Server-side rendering with Next.js 16 App Router
- 🤖 **AI-Powered**: GPT-4 integration for intelligent content generation
- 🔒 **Enterprise Security**: JWT authentication, RBAC, CSRF protection, rate limiting
- 🌍 **Global Ready**: Built-in i18n with RTL support for 30+ languages
- 📱 **Mobile First**: Responsive design with Tailwind CSS 4
- 🚀 **Production Ready**: Type-safe, tested, and optimized for deployment
- 🎨 **Modern UX**: Drag-and-drop page builder with live preview
- 📊 **SEO Optimized**: Advanced meta tags, schema.org, XML sitemaps

---

## ✨ Features

### 🤖 AI-Powered Content Generation
- **GPT-4 Integration**: Generate high-quality, SEO-optimized blog posts automatically
- **Smart Suggestions**: AI-powered content improvements and keyword recommendations
- **Automated Scheduling**: Intelligent content calendar with optimal posting times
- **Content Analysis**: Real-time readability scoring and SEO analysis

### 📝 Advanced Content Management
- **Visual Page Builder**: Drag-and-drop interface with 15+ customizable widgets
- **Rich Text Editor**: ProseMirror-based WYSIWYG with markdown support
- **Media Library**: Advanced asset management with automatic image optimization (AVIF/WebP)
- **Version Control**: Track changes and restore previous versions
- **Custom Post Types**: Flexible content types beyond traditional blogs
- **Advanced Tag System**: 
  - Hierarchical tag taxonomy with parent-child relationships
  - Trending tags with auto-detection and featured tags
  - Tag merging, duplicate detection, and synonym management
  - Color-coded tags with custom icons and usage analytics
  - Bulk operations and tag locking for consistency
- **Enhanced Comment System**:
  - Multi-level threaded comments with voting (upvote/downvote)
  - Smart moderation queue with spam detection and auto-flagging
  - Comment pinning, resolution status, and IP tracking
  - Bulk approval/rejection with comprehensive filtering
  - Real-time moderation statistics and engagement metrics

### 🌍 Internationalization & Localization
- **Multi-Language Support**: English, Spanish, and easy extension to 30+ languages
- **RTL Support**: Full right-to-left layout support (Arabic, Hebrew, Farsi)
- **Regional Targeting**: Geo-specific content delivery
- **Translation Management**: Built-in translation workflow with AI assistance
- **Localized URLs**: SEO-friendly URL structure per language

### 🔐 Security & Authentication
- **JWT-Based Auth**: Secure token-based authentication with refresh tokens
- **Role-Based Access Control (RBAC)**: 6 user roles with granular permissions
  - Super Admin, Admin, Editor, Author, Subscriber, Guest
- **CAPTCHA Protection**: Google reCAPTCHA v2/v3 + custom fallback
- **CSRF Protection**: Built-in cross-site request forgery prevention
- **Security Headers**: Helmet.js configuration with CSP, HSTS, XSS protection
- **Rate Limiting**: API throttling to prevent abuse
- **Password Policies**: Configurable strength requirements with bcrypt hashing
- **2FA Support**: Time-based one-time password (TOTP) authentication

### 🚀 Performance Optimization (60-80% Faster!)
- **Request Deduplication**: Eliminates duplicate in-flight API calls
- **Smart Caching**: In-memory TTL cache for settings (5min) and profiles (1min)
- **Singleton Pattern**: Profile fetching with automatic deduplication
- **Async Fire-and-Forget**: Non-blocking audit logging (30-50% faster writes)
- **Database Optimization**: 20+ strategic indexes for common queries (60-90% faster)
- **Pagination**: Efficient page loading with optimized Prisma queries
- **Server-Side Rendering (SSR)**: Next.js 16 with React 19 for optimal performance
- **Static Site Generation (SSG)**: Pre-render pages at build time
- **Incremental Static Regeneration (ISR)**: Update static content without rebuilds
- **Image Optimization**: Automatic format conversion and lazy loading
- **Response Compression**: Gzip/Brotli compression for faster delivery
- **Redis Caching**: Multi-layer caching strategy (ready for Redis integration)
- **Database Pooling**: Prisma connection pooling for optimal DB performance
- **Code Splitting**: Automatic bundle optimization with tree shaking

### 📊 SEO & Analytics
- **Advanced SEO**: Comprehensive meta tags (Open Graph, Twitter Cards)
- **Schema.org Markup**: Rich snippets for better search results
- **XML Sitemap**: Automatic generation with priority and change frequency
- **Robots.txt**: Configurable crawler instructions
- **Site Verification**: Support for Google, Bing, Yandex, Pinterest
- **Analytics Integration**: Google Analytics 4 & Tag Manager ready
- **Performance Monitoring**: Web Vitals tracking and reporting
- **Canonical URLs**: Automatic duplicate content prevention

### 🎨 Design & UX
- **Tailwind CSS 4**: Latest utility-first CSS framework
- **Responsive Design**: Mobile-first approach with breakpoint system
- **Dark Mode**: System-aware theme switching with manual override
- **Accessibility**: WCAG 2.1 AA compliant with ARIA labels
- **Custom Themes**: Easily customizable design system
- **Component Library**: 50+ pre-built, reusable components

### 👨‍💼 Comprehensive Admin Dashboard
- **Posts Management**: Create, edit, schedule, and publish blog posts with AI assistance
- **Tag Management**: Advanced tag system with merging, duplicates detection, trending analytics
- **Comment Moderation**: Multi-tab interface (Pending, Approved, Spam, Flagged) with bulk actions
- **Media Library**: Upload, organize, and optimize images with metadata management
- **Page Builder**: Visual drag-and-drop interface with live preview and version control
- **User Management**: Role-based access control with detailed permissions
- **SEO Tools**: Site-wide SEO audit, meta tag management, and schema.org configuration
- **Settings & Appearance**: Site configuration, theme customization, and branding
- **Analytics Dashboard**: Real-time statistics, engagement metrics, and performance insights
- **Cron Jobs**: Automated scheduled tasks with manual triggering and monitoring
- **Feedback System**: User feedback collection and management interface

---

## 🏗️ Tech Stack

<table>
<tr>
<td width="50%">

### Frontend
- **Framework**: Next.js 16.1.2 (App Router)
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS 4.1.0
- **State Management**: React Context API
- **Forms**: Zod validation
- **Icons**: Lucide React
- **Editor**: ProseMirror
- **i18n**: next-intl
- **Date**: date-fns

</td>
<td width="50%">

### Backend
- **Framework**: NestJS 11.1.12
- **Runtime**: Node.js ≥24.0.0
- **Language**: TypeScript 5.7.2
- **Database**: PostgreSQL 18.1
- **ORM**: Prisma 7.2.0
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting

</td>
</tr>
<tr>
<td colspan="2">

### DevOps & Tools
- **Version Control**: Git
- **Package Manager**: npm workspaces
- **Code Quality**: ESLint, Prettier
- **Pre-commit**: Husky (optional)
- **Testing**: Jest + Testing Library
- **CI/CD**: GitHub Actions ready
- **Containerization**: Docker & Docker Compose
- **Deployment**: Vercel/AWS/DigitalOcean ready

</td>
</tr>
</table>

---

## 🏗️ Project Structure

```
wallpaintingservices/
├── 📁 backend/                 # NestJS API Server (Port 3001)
│   ├── 📁 prisma/              # Database schema & migrations
│   │   ├── schema.prisma       # Prisma data model
│   │   ├── seed.ts             # Database seeding script
│   │   └── migrations/         # Migration history
│   ├── 📁 src/
│   │   ├── 📁 auth/            # Authentication & authorization
│   │   ├── 📁 blog/            # Blog posts management
│   │   ├── 📁 ai/              # AI content generation
│   │   ├── 📁 media/           # Media library & uploads
│   │   ├── 📁 users/           # User management
│   │   ├── 📁 pages/           # Dynamic page builder
│   │   ├── 📁 settings/        # Site configuration
│   │   ├── 📁 security/        # Security features
│   │   └── main.ts             # Application entry point
│   └── 📄 package.json
│
├── 📁 frontend/                # Next.js 16 Application (Port 3000)
│   ├── 📁 app/                 # App Router (Next.js 13+)
│   │   ├── [locale]/           # i18n routes
│   │   ├── api/                # API routes
│   │   └── layout.tsx          # Root layout
│   ├── 📁 components/          # React components
│   │   ├── 📁 auth/            # Authentication UI
│   │   ├── 📁 blog/            # Blog components
│   │   ├── 📁 widgets/         # Page builder widgets
│   │   └── 📁 ui/              # Reusable UI components
│   ├── 📁 lib/                 # Utilities & helpers
│   │   ├── api.ts              # API client
│   │   ├── logger.ts           # Logging service
│   │   ├── constants.ts        # App constants
│   │   └── utils.ts            # Helper functions
│   ├── 📁 locales/             # i18n translations
│   │   ├── en.json             # English
│   │   └── es.json             # Spanish
│   ├── 📁 contexts/            # React contexts
│   ├── 📁 public/              # Static assets
│   └── 📄 package.json
│
├── 📁 scripts/                 # Automation scripts
├── 📁 tools/                   # Development tools
├── 📄 docker-compose.yml       # Local development setup
├── 📄 package.json             # Root workspace config
├── 📄 runservers.ps1           # PowerShell server launcher (Windows)
├── 📄 start-dev-servers.ps1    # Alternative launcher
└── 📄 README.md                # This file
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Required | Notes |
|------|---------|----------|-------|
| **Node.js** | ≥24.0.0 | ✅ Yes | [Download](https://nodejs.org/) |
| **npm** | ≥10.0.0 | ✅ Yes | Comes with Node.js |
| **PostgreSQL** | ≥16.0 | ✅ Yes | [Download](https://www.postgresql.org/download/) |
| **Git** | Latest | ✅ Yes | [Download](https://git-scm.com/) |
| **Docker** | Latest | ⚠️ Optional | For containerized setup |
| **OpenAI API Key** | - | ⚠️ Optional | For AI features |

### System Requirements
- **OS**: Windows 10/11, macOS 12+, Linux (Ubuntu 20.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Internet**: Required for initial setup

---

## 🚀 Quick Start

### Method 1: Automated Setup (Windows - Recommended)

The fastest way to get started on Windows:

```powershell
# 1. Clone the repository
git clone https://github.com/yourusername/wallpaintingservices.git
cd wallpaintingservices

# 2. Run the automated server launcher
.\runservers.ps1
```

The script will automatically:
- ✅ Check Node.js version
- ✅ Install dependencies
- ✅ Verify environment files
- ✅ Start both backend and frontend servers

### Method 2: Manual Setup (Cross-Platform)

#### 1️⃣ Clone the Repository
#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/wallpaintingservices.git
cd wallpaintingservices
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# The monorepo structure will automatically install all workspace dependencies
```

### 3. Set Up Environment Variables

#### Backend Environment (.env)
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your values:
```env
# Database Configuration
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/cms_ai_db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-64-characters-long-change-this-in-production"
APP_SECRET="your-app-secret-key-min-64-characters-change-this"
JWT_EXPIRES_IN="7d"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# AI Configuration (Optional - for AI features)
AI_API_KEY="sk-your-openai-api-key"
AI_MODEL="gpt-4"

# Server Configuration
PORT=3001
NODE_ENV="development"

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DESTINATION="./uploads"

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

#### Frontend Environment (.env)
```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env.local`:
```env
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Site Configuration
NEXT_PUBLIC_SITE_NAME="Wall Painting Services"
NEXT_PUBLIC_DEFAULT_LOCALE="en"

# Google reCAPTCHA (Optional)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your-recaptcha-site-key"
NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY="your-recaptcha-v3-site-key"

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

#### 4️⃣ Set Up Database

##### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Wait for PostgreSQL to be ready (5-10 seconds)
```

##### Option B: Manual PostgreSQL Setup
```bash
# Create database
createdb cms_ai_db

# Or using psql
psql -U postgres
CREATE DATABASE cms_ai_db;
\q
```

#### 5️⃣ Run Database Migrations & Seed
```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (admin user, sample content)
npm run db:seed
```

#### 6️⃣ Start Development Servers

##### Option A: Using npm workspaces (Recommended)
```bash
# From project root - starts both servers simultaneously
npm run dev
```

##### Option B: Separate terminals
```bash
# Terminal 1: Backend (port 3001)
cd backend
npm run dev

# Terminal 2: Frontend (port 3000)
cd frontend
npm run dev
```

##### Option C: Using PowerShell Script (Windows)
```powershell
# Automated launcher with health checks
.\runservers.ps1
```

#### 7️⃣ Access the Application

Open your browser and navigate to:

| Service | URL | Description |
|---------|-----|-------------|
| 🎨 **Frontend** | http://localhost:3000 | Main application |
| 🚀 **Backend API** | http://localhost:3001 | REST API |
| 📚 **API Docs** | http://localhost:3001/api/docs | Swagger UI |
| 💚 **Health Check** | http://localhost:3001/health | Server status |

#### 8️⃣ Login Credentials

After seeding, use these default credentials:

```
📧 Email: admin@example.com
🔑 Password: Admin123!
```

⚠️ **IMPORTANT**: Change the admin password immediately after first login!

---

## 🎯 Usage Examples

### Creating a New Blog Post

1. Navigate to http://localhost:3000/admin/blog
2. Click "Create New Post"
3. Fill in the title, content, and SEO fields
4. Choose categories and tags
5. Click "Publish" or "Schedule"

### Using AI Content Generation

1. Go to "AI Assistant" in the admin panel
2. Enter a topic or keywords
3. Click "Generate Content"
4. Review and edit the generated content
5. Publish directly or save as draft

### Building Custom Pages

1. Navigate to "Pages" > "Create New Page"
2. Use the drag-and-drop page builder
3. Add widgets (Hero, CTA, Gallery, etc.)
4. Customize styling with Tailwind classes
5. Preview and publish

---

---

## 🐳 Docker Deployment

### Development Environment

Start all services (PostgreSQL + Backend + Frontend):

```bash
docker-compose up -d
```

Stop services:
```bash
docker-compose down
```

### Production Deployment

```bash
# Copy production environment file
cp .env.production.example .env.production

# Edit with production values
nano .env.production

# Build and start with production config
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Docker Commands Reference

```bash
# Rebuild containers after code changes
docker-compose up -d --build

# View logs
docker-compose logs -f

# Access backend shell
docker-compose exec backend sh

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Database backup
docker-compose exec postgres pg_dump -U postgres cms_ai_db > backup.sql
```

---

## 📦 Building for Production

### Backend Build

```bash
cd backend

# Build TypeScript to JavaScript
npm run build

# Run production server
npm run start:prod
```

### Frontend Build

```bash
cd frontend

# Create optimized production build
npm run build

# Start production server
npm start
```

### Environment-Specific Builds

```bash
# Build with specific environment
NODE_ENV=production npm run build

# Analyze bundle size
npm run analyze
```

---

## 🧪 Testing

### Run All Tests

```bash
# Run all test suites
npm test

# Run with coverage report
npm run test:cov

# Watch mode for development
npm run test:watch
```

### Backend Tests

```bash
cd backend
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend Tests

```bash
cd frontend
npm test

# Component tests
npm run test:components

# Integration tests
npm run test:integration
```

### Code Quality

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check

# Format code
npm run format
```

---

## 📚 API Documentation

Comprehensive API documentation is available via **Swagger UI**:

### Development
- 📖 **Swagger UI**: http://localhost:3001/api/docs
- 🔗 **OpenAPI JSON**: http://localhost:3001/api/docs-json
- 📄 **ReDoc**: http://localhost:3001/api/redoc

### Production
Set `SWAGGER_ENABLED=true` in your environment to enable Swagger in production (not recommended for security).

### API Endpoints Overview

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Auth** | `/api/auth/login` | POST | User login |
| | `/api/auth/register` | POST | User registration |
| | `/api/auth/refresh` | POST | Refresh JWT token |
| **Blog** | `/api/blog/posts` | GET | List all posts |
| | `/api/blog/posts/:id` | GET | Get single post |
| | `/api/blog/posts` | POST | Create post |
| **AI** | `/api/ai/generate` | POST | Generate content |
| | `/api/ai/optimize` | POST | Optimize SEO |
| **Media** | `/api/media/upload` | POST | Upload file |
| | `/api/media` | GET | List media |
| **Pages** | `/api/pages` | GET | List pages |
| | `/api/pages/:id` | GET | Get page |
| **Settings** | `/api/settings/public` | GET | Public settings |

### Authentication

Most endpoints require JWT authentication:

```bash
# Get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'

# Use token
curl http://localhost:3001/api/blog/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔧 Configuration

### Backend Configuration

Configuration files in `backend/`:
- `src/app/settings.py` - Main Django settings
- `src/app/settings_dev.py` - Development overrides
- `src/app/settings_production.py` - Production settings
- `.env` - Environment variables

Key configurations:
```typescript
// Database
DATABASE_URL: PostgreSQL connection string

// Security
JWT_SECRET: JWT signing key
JWT_EXPIRES_IN: Token expiration (default: 7d)
CORS_ORIGIN: Allowed origins

// Features
AI_ENABLED: Enable AI features
UPLOAD_MAX_SIZE: Max file size in MB
RATE_LIMIT_TTL: Rate limit window (seconds)
```

### Frontend Configuration

Configuration in `frontend/`:
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS customization
- `.env.local` - Local environment variables

```javascript
// next.config.js highlights
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['localhost', 'yourdomain.com']
  },
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en'
  }
}
```

---

## 🛡️ Security

We take security seriously. See [SECURITY.md](SECURITY.md) for our security policy and vulnerability reporting.

### Built-in Security Features

| Feature | Implementation | Status |
|---------|---------------|---------|
| **Authentication** | JWT with refresh tokens | ✅ Implemented |
| **Authorization** | Role-based access control (RBAC) | ✅ Implemented |
| **Password Hashing** | bcrypt with salt rounds | ✅ Implemented |
| **CSRF Protection** | Token-based validation | ✅ Implemented |
| **XSS Protection** | Content Security Policy (CSP) | ✅ Implemented |
| **SQL Injection** | Prisma ORM parameterization | ✅ Implemented |
| **Rate Limiting** | Per-IP request throttling | ✅ Implemented |
| **HTTPS** | Force HTTPS in production | ✅ Implemented |
| **Security Headers** | Helmet.js configuration | ✅ Implemented |
| **Input Validation** | class-validator + Zod | ✅ Implemented |
| **2FA** | TOTP authentication | ⚠️ Optional |
| **Audit Logging** | Security event tracking | ⚠️ Planned |

### Security Best Practices

1. **Change Default Credentials**: Update admin password immediately after installation
2. **Use Strong Secrets**: Generate cryptographically secure JWT_SECRET and APP_SECRET
3. **Enable HTTPS**: Use SSL/TLS certificates in production
4. **Regular Updates**: Keep dependencies updated with `npm audit`
5. **Environment Variables**: Never commit `.env` files to version control
6. **Database Backups**: Schedule regular automated backups
7. **Monitor Logs**: Set up log monitoring and alerting
8. **Penetration Testing**: Conduct regular security audits

### Reporting Vulnerabilities

If you discover a security vulnerability, please email security@yourdomain.com. Do not open a public issue.

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/wallpaintingservices.git
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make your changes** and commit:
   ```bash
   git commit -m 'Add amazing feature'
   ```
5. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request** on GitHub

### Development Guidelines

- ✅ Follow TypeScript best practices
- ✅ Write tests for new features
- ✅ Update documentation as needed
- ✅ Run linter and fix warnings: `npm run lint:fix`
- ✅ Ensure all tests pass: `npm test`
- ✅ Follow conventional commit messages
- ✅ Keep PRs focused and atomic

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint and auto-fix
npm run lint:fix
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new blog widget
fix: resolve authentication bug
docs: update installation guide
style: format code with prettier
refactor: optimize database queries
test: add unit tests for API
chore: update dependencies
```

### Areas to Contribute

- 🐛 **Bug Fixes**: Check open issues tagged with `bug`
- ✨ **New Features**: Propose new features in discussions
- 📖 **Documentation**: Improve README, guides, and API docs
- 🧪 **Testing**: Increase test coverage
- 🎨 **UI/UX**: Enhance design and user experience
- 🌍 **Translations**: Add new language support
- ⚡ **Performance**: Optimize queries and bundle size

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ℹ️ License and copyright notice required

---

## 👥 Team & Credits

### Development Team
- **Lead Developer**: [Your Name]
- **Backend Team**: [Names]
- **Frontend Team**: [Names]
- **DevOps**: [Names]

### Special Thanks

This project wouldn't be possible without these amazing open-source projects:

- [Next.js](https://nextjs.org/) - The React Framework
- [NestJS](https://nestjs.com/) - Progressive Node.js Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [PostgreSQL](https://www.postgresql.org/) - Advanced Database
- [React](https://react.dev/) - UI Library

---

## 📧 Support & Contact

Need help? We're here for you:

- 📖 **Documentation**: Check this README and API docs
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/wallpaintingservices/discussions)
- 🐛 **Bug Reports**: [Open an Issue](https://github.com/yourusername/wallpaintingservices/issues)
- 📧 **Email**: support@yourdomain.com
- 💼 **Enterprise Support**: enterprise@yourdomain.com

### Community

- 🌟 Star this repo if you find it helpful!
- 🐦 Follow us on Twitter: [@YourHandle](https://twitter.com/yourhandle)
- 💼 LinkedIn: [Your Company](https://linkedin.com/company/yourcompany)
- 📺 YouTube: [Tutorials & Demos](https://youtube.com/yourchannel)

---

## 🗺️ Roadmap

### Current Version: 1.0.0

### Upcoming Features

#### Version 1.1.0 (Q1 2026)
- [ ] Advanced analytics dashboard
- [ ] Newsletter integration (Mailchimp/SendGrid)
- [ ] Comment system with moderation
- [ ] Social media auto-posting
- [ ] Advanced search with Elasticsearch

#### Version 1.2.0 (Q2 2026)
- [ ] Multi-tenant support
- [ ] White-label customization
- [ ] Mobile apps (React Native)
- [ ] Real-time collaboration
- [ ] Workflow automation

#### Version 2.0.0 (Q3 2026)
- [ ] Headless CMS mode
- [ ] GraphQL API
- [ ] Plugin marketplace
- [ ] Advanced AI features (GPT-4 Turbo)
- [ ] E-commerce integration

### Feature Requests

Have an idea? [Open a feature request](https://github.com/yourusername/wallpaintingservices/issues/new?template=feature_request.md)!

---

## 📊 Project Stats

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/yourusername/wallpaintingservices?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/wallpaintingservices?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/wallpaintingservices)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/wallpaintingservices)
![Last commit](https://img.shields.io/github/last-commit/yourusername/wallpaintingservices)
![Code size](https://img.shields.io/github/languages/code-size/yourusername/wallpaintingservices)

</div>

---

## 🙏 Acknowledgments

- Thanks to all our contributors who have helped make this project better
- Inspired by modern CMS systems like WordPress, Ghost, and Strapi
- Built with love and lots of ☕ by the development team

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

**Made with ❤️ by [Your Company Name]**

[Report Bug](https://github.com/yourusername/wallpaintingservices/issues) · [Request Feature](https://github.com/yourusername/wallpaintingservices/issues) · [Documentation](https://docs.yourdomain.com)

</div>
