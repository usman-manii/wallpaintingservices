import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get('overview')
  async getOverview() {
    return this.feedbackService.getOverview();
  }

  @Get('posts/:id')
  async getPostFeedback(@Param('id') id: string) {
    return this.feedbackService.getPostFeedback(id);
  }
}

