import { Module } from '@nestjs/common';
import { ClientProfileModule } from './client/client-profile.module';
// import { AdminProfileModule } from './admin/admin-profile.module';

@Module({
  imports: [ClientProfileModule],
  exports: [ClientProfileModule],
})
export class ProfileModule {}
