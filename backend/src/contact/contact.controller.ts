// src/contact/contact.controller.ts
import { Body, Controller, Get, Post, UseGuards, BadRequestException, Request } from '@nestjs/common';
import { ContactService } from './contact.service';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CaptchaService } from '../captcha/captcha.service';
import { ContactMessageDto } from './dto/contact-message.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly captchaService: CaptchaService
  ) {}

  @Public()
  @Post()
  async sendMessage(@Body() body: ContactMessageDto, @Request() req: any) {
    if (body.captchaToken) {
      const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.ip ||
        req.connection?.remoteAddress ||
        '0.0.0.0';

      const valid = await this.captchaService.verify(
        body.captchaToken,
        ip,
        body.captchaId,
        body.captchaType,
      );
      if (!valid) throw new BadRequestException('Invalid Captcha');
    }
    return this.contactService.createMessage(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Get()
  getMessages() {
    return this.contactService.getAllMessages();
  }
}
