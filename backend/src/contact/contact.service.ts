// src/contact/contact.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SanitizationUtil } from '../common/utils/sanitization.util';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: { name: string; email: string; subject?: string; message: string }) {
    const name = SanitizationUtil.sanitizeText(data.name);
    const email = SanitizationUtil.sanitizeEmail(data.email);
    if (!email) {
      throw new BadRequestException('Invalid email address');
    }
    const subject = data.subject ? SanitizationUtil.sanitizeText(data.subject) : null;
    const message = SanitizationUtil.sanitizeText(data.message);

    return this.prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
      },
    });
  }

  async getAllMessages() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
