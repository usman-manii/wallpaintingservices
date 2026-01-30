import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { CaptchaModule } from '../captcha/captcha.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [CaptchaModule, PrismaModule],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
