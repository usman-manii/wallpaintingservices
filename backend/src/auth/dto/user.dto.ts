import { IsEmail, IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateUserProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsIn(['username', 'firstName', 'lastName', 'nickname', 'email'])
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  facebook?: string;

  @IsString()
  @IsOptional()
  twitter?: string;

  @IsString()
  @IsOptional()
  instagram?: string;

  @IsString()
  @IsOptional()
  linkedin?: string;

  @IsString()
  @IsOptional()
  youtube?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  countryCode?: string;
}

export class RequestEmailChangeDto {
  @IsEmail()
  newEmail: string;
}

export class VerifyEmailChangeDto {
  @IsString()
  requestId: string;

  @IsString()
  oldEmailCode: string;

  @IsString()
  newEmailCode: string;
}

export class ApproveEmailChangeDto {
  @IsString()
  requestId: string;
}
