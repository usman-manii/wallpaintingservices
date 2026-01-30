import { Controller, Get } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { Public } from '../auth/public.decorator';

@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Public() // Allow public access to generate captcha
  @Get('challenge')
  async getChallenge() {
    return this.captchaService.generateChallenge();
  }
}
