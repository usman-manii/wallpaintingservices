// src/settings/settings.controller.ts
import { Body, Controller, Get, Put, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UploadVerificationFileDto, DeleteVerificationFileDto } from './dto/verification-file.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('public')
  getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Put()
  updateSettings(@Body() data: UpdateSettingsDto) {
    return this.settingsService.updateSettings(data);
  }

  // Verification File Management
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Post('verification-files')
  uploadVerificationFile(@Body() dto: UploadVerificationFileDto) {
    return this.settingsService.uploadVerificationFile(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Get('verification-files')
  getVerificationFiles() {
    return this.settingsService.getVerificationFiles();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Delete('verification-files/:platform')
  deleteVerificationFile(@Param('platform') platform: string) {
    return this.settingsService.deleteVerificationFile(platform);
  }

  // Public route to serve verification files
  @Public()
  @Get('verification-files/serve/:filename')
  serveVerificationFile(@Param('filename') filename: string) {
    return this.settingsService.serveVerificationFile(filename);
  }
}
