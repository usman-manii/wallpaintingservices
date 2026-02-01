# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### 1. **Do Not** Create a Public Issue
Please do not report security vulnerabilities through public GitHub issues.

### 2. Report Privately
Send an email to: **security@yourdomain.com** (replace with your actual security contact)

Include the following information:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### 3. Response Time
- We will acknowledge your email within **48 hours**
- We will provide a detailed response within **7 days**
- We will keep you informed about the progress

## Security Best Practices

### Environment Variables
- **NEVER** commit `.env` files to version control
- Use strong, randomly generated secrets for `JWT_SECRET` and `APP_SECRET`
- Rotate secrets regularly in production
- Use different secrets for development and production

### Database Security
- Use strong passwords for database users
- Limit database access to necessary services only
- Enable SSL/TLS for database connections in production
- Regularly backup your database

### API Security
- All sensitive endpoints require JWT authentication
- Rate limiting is enforced to prevent abuse
- CORS is configured to allow only trusted origins
- Input validation is performed on all user inputs
- SQL injection is prevented through Prisma ORM

### Authentication
- Passwords are hashed using bcrypt
- JWT tokens have expiration times
- Password reset tokens are single-use and time-limited
- Email verification is required for new accounts

### Content Security
- All user-generated content is sanitized
- XSS protection through Content Security Policy headers
- CSRF protection is implemented
- File uploads are validated and size-limited

### Updates
- Keep dependencies up to date
- Regularly check for security advisories
- Run `npm audit` periodically

## Disclosure Policy

When we receive a security report:
1. We will confirm the vulnerability
2. We will develop a fix
3. We will release a patch
4. We will publicly disclose the issue after the patch is released

## Hall of Fame

We appreciate security researchers who responsibly disclose vulnerabilities:
- [Your name could be here!]

Thank you for keeping our platform secure!
