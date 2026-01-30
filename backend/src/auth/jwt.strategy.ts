
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET is missing or too short. Set a >=32 char secret.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // This payload comes from the decoded JWT
    // We return what we want to inject into request.user
    if (!payload.sub) {
        throw new UnauthorizedException();
    }
    // Provide both `id` and `userId` to support different controller expectations
    return { id: payload.sub, userId: payload.sub, email: payload.email, role: payload.role };
  }
}
