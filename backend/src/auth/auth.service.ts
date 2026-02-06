import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { SanitizationUtil } from '../common/utils/sanitization.util';
import { JwtVerifyOptions } from '@nestjs/jwt/dist/interfaces/jwt-module-options.interface';
import type { StringValue } from 'ms';

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

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private sanitizeUser(user: User): Omit<User, 'password' | 'resetPasswordToken' | 'resetPasswordExpires'> {
    const { password, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;
    return safeUser;
  }

  private getAccessTokenExpiry(): StringValue {
    return (process.env.JWT_ACCESS_EXPIRES || '15m') as StringValue;
  }

  private getRefreshTokenExpiry(): StringValue {
    return (process.env.JWT_REFRESH_EXPIRES || '30d') as StringValue;
  }

  private getRefreshTokenMaxAgeMs(): number {
    const rawMaxAge = process.env.JWT_REFRESH_MAXAGE_MS;
    if (rawMaxAge) {
      const parsed = Number(rawMaxAge);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }

    const rawExpiry = process.env.JWT_REFRESH_EXPIRES || '30d';
    const match = /^(\d+)([smhd])$/.exec(rawExpiry);
    if (match) {
      const value = Number(match[1]);
      const unit = match[2];
      const multiplier = unit === 's'
        ? 1000
        : unit === 'm'
        ? 1000 * 60
        : unit === 'h'
        ? 1000 * 60 * 60
        : 1000 * 60 * 60 * 24;
      return value * multiplier;
    }

    return 1000 * 60 * 60 * 24 * 30;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateVerificationCode(length = 6): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += crypto.randomInt(0, 10).toString();
    }
    return code;
  }

  /**
   * Validate user credentials with rate limiting
   */
  async validateUser(email: string, pass: string): Promise<Omit<User, 'password' | 'resetPasswordToken' | 'resetPasswordExpires'>> {
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
    
    return this.sanitizeUser(user);
  }

  /**
   * Authenticate user and generate JWT access token
   * @param user - User object with id, email, and role
   * @returns JWT access token and user details
   */
  async login(
    user: { id: string; email: string; role: string },
    context?: { ipAddress?: string; userAgent?: string },
  ) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: this.getAccessTokenExpiry(),
    });

    const sessionId = crypto.randomUUID();
    const refresh_token = this.jwtService.sign(
      { sub: user.id, tokenType: 'refresh', sid: sessionId },
      {
        expiresIn: this.getRefreshTokenExpiry(),
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      },
    );

    const refreshTokenHash = this.hashToken(refresh_token);
    const expiresAt = new Date(Date.now() + this.getRefreshTokenMaxAgeMs());

    await this.prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash,
        userAgent: context?.userAgent,
        ipAddress: context?.ipAddress,
        expiresAt,
      },
    });

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

    this.validatePasswordStrength(data.password);

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
          role: Role.SUBSCRIBER,
        },
      });

      this.logger.log(`New user registered: ${user.email}`);
      
      this.mailService.sendWelcomeEmail(user.email, user.firstName).catch((err: unknown) => {
        this.logger.error(`Failed to send welcome email: ${this.getErrorMessage(err)}`);
      });

      const verification = await this.createEmailVerificationToken(user.id);
      this.mailService.sendEmailVerification(user.email, verification.token, verification.code).catch((err: unknown) => {
        this.logger.error(`Failed to send verification email: ${this.getErrorMessage(err)}`);
      });

      return this.sanitizeUser(user);
    } catch (error: unknown) {
      this.logger.error(`Registration failed: ${this.getErrorMessage(error)}`);
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
    } catch (error: unknown) {
      this.logger.error(`Failed to send password reset email: ${this.getErrorMessage(error)}`);
    }
    
    return { 
      message: 'Password reset link sent.', 
      dev_token: process.env.NODE_ENV === 'development' ? token : undefined 
    };
  }

  async resetPassword(token: string, newPass: string) {
    this.validatePasswordStrength(newPass);

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

    await this.prisma.userSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.mailService.sendPasswordResetConfirmation(user.email).catch((err: unknown) => {
      this.logger.error(`Failed to send reset confirmation email: ${this.getErrorMessage(err)}`);
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

  private validatePasswordStrength(password: string): void {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-\[\]{}|\\:;"'<>,.\/`~])[A-Za-z\d@$!%*?&#^()_+=\-\[\]{}|\\:;"'<>,.\/`~]{12,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'Password must be at least 12 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character'
      );
    }

    const weakPasswords = ['Password123!', '123456789abc', 'Qwerty123!', 'Admin123!', 'Welcome123!'];
    if (weakPasswords.some((weak) => password.toLowerCase().includes(weak.toLowerCase()))) {
      throw new BadRequestException('Password is too common. Please choose a stronger password');
    }
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify<{ sub?: string; tokenType?: string; sid?: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      } as JwtVerifyOptions);
      if (decoded.tokenType !== 'refresh' || !decoded.sub) {
        throw new UnauthorizedException('Invalid token type');
      }

      const refreshTokenHash = this.hashToken(refreshToken);
      const session = await this.prisma.userSession.findFirst({
        where: {
          refreshTokenHash,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session || (decoded.sid && session.id !== decoded.sid)) {
        throw new UnauthorizedException('Session expired');
      }

      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) throw new UnauthorizedException('User not found');

      const payload = { email: user.email, sub: user.id, role: user.role };
      const access_token = this.jwtService.sign(payload, {
        expiresIn: this.getAccessTokenExpiry(),
      });
      const new_refresh = this.jwtService.sign(
        { sub: user.id, tokenType: 'refresh', sid: session.id },
        {
          expiresIn: this.getRefreshTokenExpiry(),
          secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        },
      );
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: {
          refreshTokenHash: this.hashToken(new_refresh),
          lastUsedAt: new Date(),
        },
      });

      return { access_token, refresh_token: new_refresh, user: this.sanitizeUser(user) };
    } catch (err: unknown) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async revokeSession(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);
    await this.prisma.userSession.updateMany({
      where: { refreshTokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async requestEmailVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      return { message: 'Email already verified' };
    }

    const verification = await this.createEmailVerificationToken(user.id);
    await this.mailService.sendEmailVerification(user.email, verification.token, verification.code);
    return {
      message: 'Verification email sent',
      dev_token: process.env.NODE_ENV === 'development' ? verification.token : undefined,
      dev_code: process.env.NODE_ENV === 'development' ? verification.code : undefined,
    };
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashToken(token);
    const verification = await this.prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { isEmailVerified: true, emailVerifiedAt: new Date() },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  async verifyEmailCode(email: string, code: string) {
    const sanitizedEmail = SanitizationUtil.sanitizeEmail(email);
    if (!sanitizedEmail) {
      throw new BadRequestException('Invalid email format');
    }
    if (!code || !/^\d{6}$/.test(code)) {
      throw new BadRequestException('Verification code must be 6 digits');
    }

    const user = await this.prisma.user.findUnique({ where: { email: sanitizedEmail } });
    if (!user) {
      throw new BadRequestException('Invalid or expired verification code');
    }
    if (user.isEmailVerified) {
      return { message: 'Email already verified' };
    }

    const codeHash = this.hashToken(code);
    const verification = await this.prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        codeHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { isEmailVerified: true, emailVerifiedAt: new Date() },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  private async createEmailVerificationToken(userId: string): Promise<{ token: string; code: string }> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const code = this.generateVerificationCode(6);
    const codeHash = this.hashToken(code);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        codeHash,
        expiresAt,
      },
    });

    return { token, code };
  }
}
