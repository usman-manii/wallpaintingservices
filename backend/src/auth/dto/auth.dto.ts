
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  captchaToken?: string;

  @IsOptional()
  captchaId?: string;

  @IsOptional()
  captchaType?: string;
}

export class RegisterDto {
    @IsEmail()
    email: string;
  
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsOptional()
    captchaToken?: string;

    @IsOptional()
    captchaId?: string;

    @IsOptional()
    captchaType?: string;

    @IsNotEmpty()
    name: string;

    @IsOptional()
    username?: string;

    @IsOptional()
    firstName?: string;

    @IsOptional()
    lastName?: string;
    
    @IsOptional()
    @IsEnum(Role)
    role?: string;
  }

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}

