import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { VerificationFilesController } from './verification-files.controller';

@Module({
  controllers: [SettingsController, VerificationFilesController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
