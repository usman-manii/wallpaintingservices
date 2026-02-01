# Contributing to Wall Painting Services CMS

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- Node.js >= 24.0.0
- PostgreSQL 16.x
- Git
- Basic knowledge of TypeScript, Next.js, and NestJS

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/wallpaintingservices.git
   cd wallpaintingservices
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/wallpaintingservices.git
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Set up environment variables (see README.md)

6. Start development servers:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes for production
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Adding or updating tests

### Workflow Steps

1. **Sync with upstream:**
   ```bash
   git checkout main
   git fetch upstream
   git merge upstream/main
   ```

2. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-new-feature
   ```

3. **Make your changes** and commit them (see Commit Guidelines)

4. **Push to your fork:**
   ```bash
   git push origin feature/my-new-feature
   ```

5. **Create a Pull Request** from your fork to the main repository

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` type - use proper typing
- Use interfaces for object shapes
- Use enums for constants

### Code Style

We use Prettier and ESLint for code formatting:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### File Organization

- **Backend (`backend/src/`)**
  - Group by feature/module
  - Each module should have: controller, service, DTOs, and tests
  - Use dependency injection

- **Frontend (`frontend/`)**
  - Components in `components/`
  - Pages in `app/`
  - Utilities in `lib/`
  - Types in `types/`

### Naming Conventions

- **Files**: `kebab-case.ts`, `PascalCase.tsx` (for React components)
- **Variables/Functions**: `camelCase`
- **Classes/Interfaces**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private methods**: prefix with underscore `_privateMethod()`

### Best Practices

#### Backend (NestJS)
```typescript
// Use DTOs for validation
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// Use dependency injection
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
}

// Use proper error handling
throw new NotFoundException('User not found');
```

#### Frontend (Next.js/React)
```typescript
// Use TypeScript interfaces
interface UserProps {
  user: User;
  onUpdate: (user: User) => void;
}

// Use functional components with hooks
export function UserProfile({ user, onUpdate }: UserProps) {
  const [loading, setLoading] = useState(false);
  // ...
}

// Handle errors gracefully
try {
  const data = await api.get('/users');
} catch (error) {
  console.error('Failed to fetch users:', error);
  // Show user-friendly error message
}
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Examples

```bash
feat(auth): add password reset functionality

Implement password reset via email with token validation.
Tokens expire after 1 hour.

Closes #123
```

```bash
fix(blog): resolve pagination issue on mobile

The pagination component was not displaying correctly on mobile
devices due to CSS overflow.
```

## Pull Request Process

### Before Submitting

1. ✅ Update documentation if needed
2. ✅ Add tests for new features
3. ✅ Run linting: `npm run lint`
4. ✅ Run tests: `npm test`
5. ✅ Update CHANGELOG.md
6. ✅ Ensure your branch is up to date with main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Review Process

1. At least one maintainer must review and approve
2. All CI checks must pass
3. No merge conflicts
4. Code coverage should not decrease

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test path/to/test.spec.ts
```

### Writing Tests

#### Backend Tests (Jest)
```typescript
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, PrismaService],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a user', async () => {
    const user = await service.create({ email: 'test@example.com' });
    expect(user.email).toBe('test@example.com');
  });
});
```

#### Frontend Tests (React Testing Library)
```typescript
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('renders user information', () => {
    const user = { name: 'John', email: 'john@example.com' };
    render(<UserProfile user={user} />);
    
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

## Questions?

If you have questions:
1. Check existing issues and documentation
2. Ask in discussions
3. Contact maintainers

Thank you for contributing! 🎉
