import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { SanitizationUtil } from '../common/utils/sanitization.util';
import { JwtVerifyOptions } from '@nestjs/jwt/dist/interfaces/jwt-module-options.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  /**
   * Validate user credentials with rate limiting
   */
  async validateUser(email: string, pass: string): Promise<any> {
    // Sanitize email input
    const sanitizedEmail = SanitizationUtil.sanitizeEmail(email);
    if (!sanitizedEmail) {
      throw new BadRequestException('Invalid email format');
    }

    // Check for account lockout
    if (this.isLockedOut(sanitizedEmail)) {
      const lockoutRemaining = this.getLockoutRemainingTime(sanitizedEmail);
      throw new UnauthorizedException(
        `Too many failed login attempts. Please try again in ${Math.ceil(lockoutRemaining / 60000)} minutes.`
      );
    }

    const user = await this.prisma.user.findUnique({ 
      where: { email: sanitizedEmail } 
    });

    if (!user) {
      this.recordFailedAttempt(sanitizedEmail);
      // Don't reveal whether user exists
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    
    if (!isPasswordValid) {
      this.recordFailedAttempt(sanitizedEmail);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Clear failed attempts on successful login
    this.clearFailedAttempts(sanitizedEmail);
    
    const { password, resetPasswordToken, resetPasswordExpires, ...result } = user;
    return result;
  }

  /**
   * Authenticate user and generate JWT access token
   * @param user - User object with id, email, and role
   * @returns JWT access token and user details
   */
  async login(user: { id: string; email: string; role: string }) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    const access_token = this.jwtService.sign(payload as any, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any,
    });

    const refresh_token = this.jwtService.sign(
      { sub: user.id, tokenType: 'refresh' } as any,
      {
        expiresIn: (process.env.JWT_REFRESH_EXPIRES || '30d') as any,
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      },
    );

    return {
      access_token,
      refresh_token,
      user,
    };
  }

  async register(data: RegisterDto) {
    // Sanitize and validate inputs
    const sanitizedEmail = SanitizationUtil.sanitizeEmail(data.email);
    if (!sanitizedEmail) {
      throw new BadRequestException('Invalid email format');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Validate password strength (minimum 12 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-\[\]{}|\\:;"'<>,.\/`~])[A-Za-z\d@$!%*?&#^()_+=\-\[\]{}|\\:;"'<>,.\/`~]{12,}$/;
    if (!passwordRegex.test(data.password)) {
      throw new BadRequestException(
        'Password must be at least 12 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character'
      );
    }
    
    // Check for common weak passwords
    const weakPasswords = ['Password123!', '123456789abc', 'Qwerty123!', 'Admin123!', 'Welcome123!'];
    if (weakPasswords.some(weak => data.password.toLowerCase().includes(weak.toLowerCase()))) {
      throw new BadRequestException('Password is too common. Please choose a stronger password');
    }

    // Hash password with salt rounds of 12 (more secure than 10)
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    // Generate username from provided username or email
    const baseUsername = SanitizationUtil.sanitizeSlug(
      data.username || sanitizedEmail.split('@')[0]
    );
    
    // Ensure username is unique
    let username = baseUsername;
    let counter = 1;
    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    // Sanitize names
    const firstName = SanitizationUtil.sanitizeText(
      data.firstName || data.name?.split(' ')[0] || ''
    );
    const lastName = SanitizationUtil.sanitizeText(
      data.lastName || data.name?.split(' ').slice(1).join(' ') || ''
    );
    
    try {
      const user = await this.prisma.user.create({
        data: {
          username,
          email: sanitizedEmail,
          password: hashedPassword,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          role: (data.role as Role) || Role.SUBSCRIBER,
        },
      });

      this.logger.log(`New user registered: ${user.email}`);
      
      // TODO: Send welcome email (implement in MailService)
      // this.mailService.sendWelcomeEmail(user.email, user.firstName).catch(err => {
      //   this.logger.error(`Failed to send welcome email: ${err.message}`);
      // });

      const { password, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`);
      throw new BadRequestException('Registration failed. Please try again.');
    }
  }

  async forgotPassword(email: string) {
    const sanitizedEmail = SanitizationUtil.sanitizeEmail(email);
    if (!sanitizedEmail) {
      // Return generic message even for invalid email to prevent user enumeration
      return { message: 'If this email exists, a password reset link has been sent.' };
    }

    const user = await this.prisma.user.findUnique({ 
      where: { email: sanitizedEmail } 
    });
    
    if (!user) {
      // Don't reveal whether user exists (security best practice)
      return { message: 'If this email exists, a password reset link has been sent.' };
    }
    
    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken, // Store hashed version
        resetPasswordExpires: expires,
      },
    });

    // Send reset email
    try {
      await this.mailService.sendPasswordReset(user.email, token); // Send original token
      this.logger.log(`Password reset requested for: ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`);
    }
    
    return { 
      message: 'Password reset link sent.', 
      dev_token: process.env.NODE_ENV === 'development' ? token : undefined 
    };
  }

  async resetPassword(token: string, newPass: string) {
    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPass)) {
      throw new BadRequestException(
        'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number'
      );
    }

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(newPass, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    this.logger.log(`Password reset successful for user: ${user.email}`);

    return { message: 'Password successfully reset' };
  }

  /**
   * Helper methods for rate limiting
   */
  private isLockedOut(email: string): boolean {
    const attempt = this.loginAttempts.get(email);
    if (!attempt) return false;

    if (attempt.count >= this.MAX_LOGIN_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - attempt.lastAttempt;
      return timeSinceLastAttempt < this.LOCKOUT_DURATION;
    }

    return false;
  }

  private getLockoutRemainingTime(email: string): number {
    const attempt = this.loginAttempts.get(email);
    if (!attempt) return 0;

    const elapsed = Date.now() - attempt.lastAttempt;
    return Math.max(0, this.LOCKOUT_DURATION - elapsed);
  }

  private recordFailedAttempt(email: string): void {
    const attempt = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
    
    // Reset counter if last attempt was more than lockout duration ago
    if (Date.now() - attempt.lastAttempt > this.LOCKOUT_DURATION) {
      attempt.count = 0;
    }

    attempt.count++;
    attempt.lastAttempt = Date.now();
    this.loginAttempts.set(email, attempt);

    if (attempt.count >= this.MAX_LOGIN_ATTEMPTS) {
      this.logger.warn(`Account locked due to too many failed attempts: ${email}`);
    }
  }

  private clearFailedAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      } as JwtVerifyOptions);
      if (decoded.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) throw new UnauthorizedException('User not found');

      const payload = { email: user.email, sub: user.id, role: user.role };
      const access_token = this.jwtService.sign(payload as any, {
        expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any,
      });
      const new_refresh = this.jwtService.sign(
        { sub: user.id, tokenType: 'refresh' } as any,
        {
          expiresIn: (process.env.JWT_REFRESH_EXPIRES || '30d') as any,
          secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        },
      );

      const { password, ...safeUser } = user as any;
      return { access_token, refresh_token: new_refresh, user: safeUser };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
