import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordReset(email: string, token: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[UserId: ${email}] Password Reset Token: ${token}`);
      this.logger.log(`Link: http://localhost:3000/reset-password?token=${token}`);
      return;
    }
    // TODO: Implement real email sending (e.g. via Nodemailer or SendGrid)
    this.logger.warn(`Email sending not configured. Token for ${email}: ${token}`);
  }

  async sendEmailChangeVerification(
    email: string, 
    code: string, 
    type: 'OLD' | 'NEW'
  ) {
    if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[${type} EMAIL VERIFICATION] To: ${email} | Code: ${code}`);
        return;
    }
    this.logger.warn(`Email sending not configured. Code for ${email}: ${code}`);
  }
}
