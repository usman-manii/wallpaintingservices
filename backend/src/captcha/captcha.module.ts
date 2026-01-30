import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CaptchaService } from './captcha.service';
import { CaptchaController } from './captcha.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [HttpModule, SettingsModule],
  controllers: [CaptchaController],
  providers: [CaptchaService],
  exports: [CaptchaService],
})
export class CaptchaModule {}
