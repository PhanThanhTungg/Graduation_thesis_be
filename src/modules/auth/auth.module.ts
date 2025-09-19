import { Module } from '@nestjs/common'
import { AdminAuthModule } from './admin/admin-auth.module'
import { ClientAuthModule } from './client/client-auth.module'

@Module({
  imports: [AdminAuthModule, ClientAuthModule],
  exports: [AdminAuthModule, ClientAuthModule],
})
export class AuthModule {}
