import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;
  private readonly fromAddress?: string;
  private readonly isConfigured: boolean;

  constructor() {
    const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM } = process.env;

    if (MAIL_HOST && MAIL_PORT && MAIL_USER && MAIL_PASS && MAIL_FROM) {
      const port = Number(MAIL_PORT);
      this.transporter = nodemailer.createTransport({
        host: MAIL_HOST,
        port: Number.isFinite(port) ? port : 587,
        secure: port === 465,
        auth: {
          user: MAIL_USER,
          pass: MAIL_PASS,
        },
      });
      this.fromAddress = MAIL_FROM;
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
    }
  }

  async sendPasswordReset(email: string, token: string) {
    if (!this.isConfigured || !this.transporter || !this.fromAddress) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[DEV] Password reset token for ${email}: ${token}`);
        this.logger.log(`Link: http://localhost:3000/reset-password?token=${token}`);
        return;
      }
      this.logger.error('Email service is not configured');
      throw new ServiceUnavailableException('Email service is not configured');
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: this.fromAddress,
      to: email,
      subject: 'Password Reset Request',
      text: `Use the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
    });
  }

  async sendPasswordResetConfirmation(email: string) {
    if (!this.isConfigured || !this.transporter || !this.fromAddress) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[DEV] Password reset confirmation email to ${email} skipped (mail not configured).`);
        return;
      }
      this.logger.error('Email service is not configured');
      throw new ServiceUnavailableException('Email service is not configured');
    }

    const siteName = process.env.SITE_NAME || 'Wall Painting Services';
    await this.transporter.sendMail({
      from: this.fromAddress,
      to: email,
      subject: `${siteName} - Password Updated`,
      text: `Your password was successfully updated.\n\nIf you did not perform this action, please contact support immediately.`,
    });
  }

  async sendEmailVerification(email: string, token: string, code?: string) {
    if (!this.isConfigured || !this.transporter || !this.fromAddress) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[DEV] Email verification token for ${email}: ${token}`);
        if (code) {
          this.logger.log(`[DEV] Email verification code for ${email}: ${code}`);
        }
        this.logger.log(`Link: http://localhost:3000/verify-email?token=${token}`);
        return;
      }
      this.logger.error('Email service is not configured');
      throw new ServiceUnavailableException('Email service is not configured');
    }

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    const siteName = process.env.SITE_NAME || 'Wall Painting Services';
    const codeLine = code ? `\n\nVerification code: ${code}\n\nYou can enter this code on the verification page if you prefer not to click the link.` : '';

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: email,
      subject: `Verify your email - ${siteName}`,
      text: `Welcome to ${siteName}.\n\nPlease verify your email by clicking the link below:\n${verifyUrl}${codeLine}\n\nIf you did not create this account, you can ignore this email.`,
    });
  }

  async sendNotificationEmail(
    email: string,
    payload: {
      title: string;
      message: string;
      actionLabel?: string;
      actionUrl?: string;
      category?: string;
      priority?: string;
    },
    name?: string,
  ) {
    if (!this.isConfigured || !this.transporter || !this.fromAddress) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[DEV] Notification email to ${email}: ${payload.title}`);
        return;
      }
      this.logger.error('Email service is not configured');
      throw new ServiceUnavailableException('Email service is not configured');
    }

    const siteName = process.env.SITE_NAME || 'Wall Painting Services';
    const greeting = name ? `Hi ${name},` : 'Hello,';
    const actionLine = payload.actionUrl
      ? `\n\n${payload.actionLabel || 'View details'}: ${payload.actionUrl}`
      : '';

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: email,
      subject: `${siteName} Notification: ${payload.title}`,
      text: `${greeting}\n\n${payload.message}${actionLine}\n\nCategory: ${payload.category || 'ALERT'}\nPriority: ${payload.priority || 'NORMAL'}\n\nThanks,\n${siteName} Team`,
    });
  }

  async sendEmailChangeVerification(
    email: string, 
    code: string, 
    type: 'OLD' | 'NEW'
  ) {
    if (!this.isConfigured || !this.transporter || !this.fromAddress) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[DEV] ${type} email verification for ${email}: ${code}`);
        return;
      }
      this.logger.error('Email service is not configured');
      throw new ServiceUnavailableException('Email service is not configured');
    }

    const subject =
      type === 'OLD'
        ? 'Confirm Your Email Change Request'
        : 'Verify Your New Email Address';
    const message =
      type === 'OLD'
        ? `We received a request to change the email on your account. Use this code to confirm: ${code}`
        : `Use this code to verify your new email address: ${code}`;

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: email,
      subject,
      text: message,
    });
  }

  async sendWelcomeEmail(email: string, firstName?: string | null) {
    if (!this.isConfigured || !this.transporter || !this.fromAddress) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[DEV] Welcome email to ${email} skipped (mail not configured).`);
        return;
      }
      this.logger.error('Email service is not configured');
      throw new ServiceUnavailableException('Email service is not configured');
    }

    const siteName = process.env.SITE_NAME || 'Wall Painting Services';
    const greetingName = firstName ? ` ${firstName}` : '';
    const subject = `Welcome to ${siteName}`;
    const message = `Hello${greetingName},

Welcome to ${siteName}! Your account is ready, and you can now access your dashboard.

If you did not create this account, please contact support.

Thank you,
${siteName} Team`;

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: email,
      subject,
      text: message,
    });
  }
}
