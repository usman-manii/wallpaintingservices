# 🎨 Wall Painting Services - Enterprise AI CMS Platform

[![Node.js](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.1-red)](https://nestjs.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A production-ready, enterprise-grade AI-powered blogging and content management system with advanced SEO, multilingual support, and modern architecture.

## ✨ Features

### 🤖 AI-Powered Content
- **AI Blog Generation**: Generate high-quality blog posts using GPT-4/OpenAI
- **Content Optimization**: AI-powered SEO suggestions and improvements
- **Smart Scheduling**: Intelligent content scheduling and publishing

### 📝 Content Management
- **Page Builder**: Drag-and-drop page builder with customizable widgets
- **Blog System**: Full-featured blogging platform with categories, tags, and comments
- **Media Library**: Advanced media management with image optimization
- **Rich Text Editor**: ProseMirror-based WYSIWYG editor

### 🌍 Internationalization
- **Multilingual Support**: Built-in i18n with English and Spanish
- **RTL Support**: Right-to-left language support (Arabic, Hebrew, etc.)
- **Regional Targeting**: Geographic content targeting

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: 6 user roles with granular permissions
- **CAPTCHA Protection**: Google reCAPTCHA v2/v3 with custom fallback
- **CSRF Protection**: Built-in CSRF token validation
- **Security Headers**: Helmet.js for enterprise-grade security

### 🚀 Performance
- **Server-Side Rendering**: Next.js 16 with SSR/SSG
- **Image Optimization**: Automatic AVIF/WebP conversion
- **Response Compression**: Gzip compression for faster loading
- **Caching Strategy**: Multi-layer caching with Redis support
- **Database Optimization**: Prisma ORM with connection pooling

### 📊 SEO & Analytics
- **Advanced SEO**: Meta tags, Open Graph, Twitter Cards, Schema.org
- **Sitemap Generation**: Automatic XML sitemap creation
- **Analytics Integration**: Google Analytics & Tag Manager ready
- **Site Verification**: Support for Google, Bing, Yandex verification

## 🏗️ Architecture

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
│   └── locales/       # i18n Translations
│
└── docker-compose.yml # Local Development Setup
```

## 📋 Prerequisites

- **Node.js**: 24.0.0 or higher
- **PostgreSQL**: 16.x
- **npm**: Latest version
- **Git**: For version control

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/wallpaintingservices.git
cd wallpaintingservices
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables

#### Backend (.env)
```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
```

**Required Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Strong random string (min 64 chars)
- `APP_SECRET`: Strong random string (min 64 chars)
- `AI_API_KEY`: OpenAI API key
- `FRONTEND_URL`: Frontend URL (http://localhost:3000)

#### Frontend (.env)
```bash
cd ../frontend
cp .env.example .env
# Edit .env with your actual values
```

**Required Variables:**
- `NEXT_PUBLIC_API_URL`: Backend API URL (http://localhost:3001)
- `NEXT_PUBLIC_SITE_URL`: Your site URL
- `NEXT_PUBLIC_SITE_NAME`: Your site name

### 4. Set Up Database

#### Using Docker (Recommended)
```bash
docker-compose up -d
```

#### Manual Setup
```bash
# Create PostgreSQL database
createdb cms_ai_db

# Run migrations
cd backend
npx prisma migrate deploy

# Seed initial data
npx prisma db seed
```

### 5. Start Development Servers

#### Option A: Using Root Script (Windows)
```powershell
.\runservers.ps1
```

#### Option B: Using npm Workspaces
```bash
npm run dev
```

#### Option C: Manual Start
```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/health

### 7. Default Admin Credentials

After seeding, use these credentials:
- **Email**: admin@example.com
- **Password**: Admin123!

⚠️ **Change these immediately in production!**

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Copy production environment file
cp .env.production.example .env.production

# Edit .env.production with real values
nano .env.production

# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📦 Building for Production

### Backend
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov
```

## 📚 API Documentation

API documentation is available via Swagger UI:
- Development: http://localhost:3001/api/docs
- Production: Enable by setting `SWAGGER_ENABLED=true`

## 🔧 Configuration

### Backend Configuration
See [backend/.env.example](backend/.env.example) for all available options.

### Frontend Configuration
See [frontend/.env.example](frontend/.env.example) for all available options.

## 🛡️ Security

See [SECURITY.md](SECURITY.md) for our security policy and vulnerability reporting process.

### Security Features
- JWT token authentication
- Password hashing with bcrypt
- CSRF protection
- Rate limiting
- Helmet security headers
- Input validation & sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development Team**: Your Team Name
- **Maintainer**: Your Name

## 📧 Support

For support, email support@yourdomain.com or open an issue on GitHub.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- NestJS for the robust backend architecture
- Prisma for the excellent ORM
- All open-source contributors

---

**Made with ❤️ by [Your Company Name]**
