import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { EnvModule } from '../env/env.module'
import { JwtAuthService } from './jwt.service'

@Module({
  imports: [
    JwtModule.register({}),
    EnvModule,
  ],
  providers: [JwtAuthService],
  exports: [JwtAuthService],
})
export class JwtAuthModule {}
