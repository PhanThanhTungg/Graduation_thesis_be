import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { EnvService } from 'src/shared/env/env.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private envService: EnvService) {
    const backendUrl = envService.get('BACKEND_URL');
    const callbackUrl = `${backendUrl}api/auth/google/callback`;

    super({
      clientID: envService.get('GOOGLE_CLIENT_ID'),
      clientSecret: envService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: callbackUrl,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;

    const user = {
      email: emails[0].value,
      fullName: `${name.givenName} ${name.familyName}`,
      avatarUrl: photos[0].value,
      googleId: id,
      accessToken,
    };

    done(null, user);
  }
}
