
import { IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

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
    @MinLength(12)
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
    
  }

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  @MinLength(12)
  newPassword: string;
}

