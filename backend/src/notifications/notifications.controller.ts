import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedRequest } from '../common/types';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserNotifications(
    @Request() req: AuthenticatedRequest,
    @Query() query: Record<string, unknown>,
  ) {
    return this.notificationsService.getUserNotifications(req.user?.id || '', req.user?.role || '', query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  async getUnreadCount(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.getUnreadCount(req.user?.id || '', req.user?.role || '');
  }

  @UseGuards(JwtAuthGuard)
  @Post('mark-all-read')
  async markAllRead(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.markAllRead(req.user?.id || '', req.user?.role || '');
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/read')
  async markRead(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.notificationsService.markRead(req.user?.id || '', req.user?.role || '', id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/dismiss')
  async dismiss(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.notificationsService.dismiss(req.user?.id || '', req.user?.role || '', id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('admin')
  async getAdminNotifications(@Query() query: Record<string, unknown>) {
    return this.notificationsService.getAdminNotifications(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('admin/stats')
  async getAdminStats() {
    return this.notificationsService.getAdminStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post('admin')
  async createNotification(
    @Body() body: unknown,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.createNotification(body, req.user?.id || '');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Patch('admin/:id')
  async updateNotification(
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.notificationsService.updateNotification(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post('admin/:id/publish')
  async publishNotification(@Param('id') id: string) {
    return this.notificationsService.publishNotification(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post('admin/:id/archive')
  async archiveNotification(@Param('id') id: string) {
    return this.notificationsService.archiveNotification(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Delete('admin/:id')
  async deleteNotification(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }
}
