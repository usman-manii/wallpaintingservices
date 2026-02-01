
import { Controller, Post, Body, UseGuards, Get, Request, Param, Delete, Put, BadRequestException, Logger, Res } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { UpdateUserProfileDto, RequestEmailChangeDto, VerifyEmailChangeDto, ApproveEmailChangeDto } from './dto/user.dto';
import { Public } from './public.decorator';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';
import { CaptchaService } from '../captcha/captcha.service';
import { Response, CookieOptions } from 'express';

/**
 * Authentication Controller
 * Handles user authentication, registration, password reset, and profile management
 * Includes CAPTCHA verification for security-sensitive operations
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
    private userService: UserService,
    private captchaService: CaptchaService,
  ) {}

  /**
   * Authenticate user with email and password
   * Validates CAPTCHA if provided for additional security
   * @param req - Login credentials (email, password, optional CAPTCHA)
   * @returns JWT access token and user details
   * @throws BadRequestException if CAPTCHA is invalid
   * @throws Error if credentials are invalid
   */
  @Public()
  @Post('login')
  async login(@Body() req: LoginDto, @Request() request: any, @Res({ passthrough: true }) res: Response) {
    // Verify CAPTCHA if provided
    if (req.captchaToken) {
       const ip = this.getClientIp(request);
       const valid = await this.captchaService.verify(
         req.captchaToken, 
         ip, 
         req.captchaId, 
         req.captchaType
       );
       if (!valid) {
         this.logger.warn(`Invalid CAPTCHA attempt for login: ${req.email}`);
         throw new BadRequestException('Security verification failed. Please try again.');
       }
    }
    
    const user = await this.authService.validateUser(req.email, req.password);
    if (!user) {
        throw new BadRequestException('Invalid email or password');
    }
    const result = await this.authService.login(user);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    this.setCsrfCookie(res);
    return { user: result.user };
  }

  /**
   * Register a new user account
   * Requires CAPTCHA verification to prevent automated sign-ups
   * @param req - Registration details (email, password, name, optional CAPTCHA)
   * @returns JWT access token and new user details
   * @throws BadRequestException if CAPTCHA is invalid or email already exists
   */
  @Public()
  @Post('register')
  async register(@Body() req: RegisterDto, @Request() request: any, @Res({ passthrough: true }) res: Response) {
    // Verify CAPTCHA if provided
    if (req.captchaToken) {
       const ip = this.getClientIp(request);
       const valid = await this.captchaService.verify(
         req.captchaToken, 
         ip, 
         req.captchaId, 
         req.captchaType
       );
       if (!valid) {
         this.logger.warn(`Invalid CAPTCHA attempt for registration: ${req.email}`);
         throw new BadRequestException('Security verification failed. Please try again.');
       }
    }

    try {
      const user = await this.authService.register(req);
      const loginResult = await this.authService.login(user as any);
      this.setAuthCookies(res, loginResult.access_token, loginResult.refresh_token);
      this.setCsrfCookie(res);
      return { user: loginResult.user };
    } catch (error: any) {
      // Provide user-friendly error messages
      if (error.message?.includes('Unique constraint')) {
        throw new BadRequestException('An account with this email or username already exists.');
      }
      throw error;
    }
  }

  /**
   * Initiate password reset process
   * Sends reset token to user's email if account exists
   * Returns generic message for security (doesn't reveal if email exists)
   * @param req - Email address for password reset
   * @returns Success message (in dev mode, also returns token)
   */
  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() req: ForgotPasswordDto) {
    return this.authService.forgotPassword(req.email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() req: ResetPasswordDto) {
    return this.authService.resetPassword(req.token, req.newPassword);
  }

  @Public()
  @Post('refresh')
  async refresh(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new BadRequestException('Refresh token missing');
    }
    const result = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    this.setCsrfCookie(res);
    return { user: result.user };
  }

  @Public()
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    const cookieOptions = this.buildCookieOptions();

    // Clear both primary and legacy cookie paths so no stale tokens linger
    res.cookie('access_token', '', { ...cookieOptions, maxAge: 0, path: '/' });
    res.cookie('refresh_token', '', { ...cookieOptions, maxAge: 0, path: '/' });
    res.cookie('refresh_token', '', { ...cookieOptions, maxAge: 0, path: '/auth/refresh' });
    res.cookie('csrf-token', '', { ...this.buildCsrfCookieOptions(), maxAge: 0, path: '/' });

    return { message: 'Logged out' };
  }

  @Get('profile')
  getProfile(@Request() req) {
    return this.userService.getUserById(req.user.id);
  }

  @Put('profile')
  updateProfile(@Request() req, @Body() data: UpdateUserProfileDto) {
    return this.userService.updateUserProfile(req.user.id, data);
  }
  
  // User Management
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Get('users')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() data: UpdateUserProfileDto) {
    return this.userService.updateUserProfile(id, data);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Put('users/:id/role')
  async updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.userService.updateUserRole(id, body.role);
  }

  // Email Change Workflow
  @Post('email-change/request')
  async requestEmailChange(@Request() req, @Body() data: RequestEmailChangeDto) {
    return this.userService.requestEmailChange(req.user.id, data);
  }

  @Public()
  @Post('email-change/verify')
  async verifyEmailChange(@Body() data: VerifyEmailChangeDto) {
    return this.userService.verifyEmailChange(data);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Get('email-change/pending')
  async getPendingEmailChanges() {
    return this.userService.getPendingEmailChangeRequests();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Post('email-change/approve')
  async approveEmailChange(@Body() data: ApproveEmailChangeDto) {
    return this.userService.approveEmailChange(data.requestId);
  }

  private getClientIp(req: any): string {
    return (
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      '0.0.0.0'
    );
  }

  private setAuthCookies(res: Response, access: string, refresh: string) {
    const cookieOptions = this.buildCookieOptions();
    res.cookie('access_token', access, {
      ...cookieOptions,
      maxAge: this.parseMs(process.env.JWT_ACCESS_MAXAGE_MS, 1000 * 60 * 15),
    });
    res.cookie('refresh_token', refresh, {
      ...cookieOptions,
      path: '/',
      maxAge: this.parseMs(process.env.JWT_REFRESH_MAXAGE_MS, 1000 * 60 * 60 * 24 * 30),
    });
  }

  private setCsrfCookie(res: Response) {
    const token = crypto.randomBytes(24).toString('hex');
    res.cookie('csrf-token', token, this.buildCsrfCookieOptions());
    res.setHeader('x-csrf-token', token);
  }

  private buildCookieOptions(): CookieOptions {
    const secure = (process.env.COOKIE_SECURE ?? process.env.NODE_ENV === 'production') === 'true' || process.env.NODE_ENV === 'production';
    const sameSiteEnv = (process.env.COOKIE_SAMESITE || '').toLowerCase();
    const sameSite: CookieOptions['sameSite'] =
      sameSiteEnv === 'none' ? 'none' : sameSiteEnv === 'strict' ? 'strict' : 'lax';
    const domain = process.env.COOKIE_DOMAIN || undefined;
    return {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
    };
  }

  private buildCsrfCookieOptions(): CookieOptions {
    const base = this.buildCookieOptions();
    return {
      ...base,
      httpOnly: false,
    };
  }

  private parseMs(raw: string | undefined, fallback: number): number {
    if (!raw) return fallback;
    const val = Number(raw);
    return Number.isFinite(val) && val > 0 ? val : fallback;
  }
}
