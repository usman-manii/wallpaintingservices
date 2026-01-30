// backend/src/settings/dto/verification-file.dto.ts

import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';

export enum VerificationPlatform {
  GOOGLE = 'google',
  BING = 'bing',
  YANDEX = 'yandex',
  PINTEREST = 'pinterest',
  OTHER = 'other',
}

export class UploadVerificationFileDto {
  @IsEnum(VerificationPlatform)
  platform: VerificationPlatform;

  @IsString()
  @MaxLength(255)
  filename: string; // e.g., "google123.html"

  @IsString()
  @MaxLength(10240) // Max 10KB
  content: string; // HTML/TXT/JSON content

  @IsOptional()
  @IsString()
  description?: string;
}

export class DeleteVerificationFileDto {
  @IsEnum(VerificationPlatform)
  platform: VerificationPlatform;
}
