import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { EnvService } from 'src/shared/env/env.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private envService: EnvService) {
    const backendUrl = envService.get('BACKEND_URL');
    const callbackUrl = `${backendUrl}api/auth/facebook/callback`;
    super({
      clientID: envService.get('FACEBOOK_CLIENT_ID'),
      clientSecret: envService.get('FACEBOOK_CLIENT_SECRET'),
      callbackURL: callbackUrl,
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      scope: ['email', 'public_profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { id, emails, name, photos } = profile;

    return {
      email: emails && emails[0] ? emails[0].value : undefined,
      fullName: name
        ? `${name.givenName || ''} ${name.familyName || ''}`.trim()
        : undefined,
      avatarUrl: photos && photos[0] ? photos[0].value : undefined,
      facebookId: id,
      accessToken,
    };
  }
}
