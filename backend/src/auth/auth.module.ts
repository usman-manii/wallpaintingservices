
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from './user.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { CaptchaModule } from '../captcha/captcha.module';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    CaptchaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: (() => {
          const secret = configService.get<string>('JWT_SECRET');
          if (!secret) {
            throw new Error('JWT_SECRET environment variable is required');
          }
          if (secret.length < 32) {
            throw new Error('JWT_SECRET must be at least 32 characters');
          }
          return secret;
        })(),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, UserService, JwtStrategy, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, UserService, JwtAuthGuard], 
})
export class AuthModule {}
