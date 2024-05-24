import { Module, forwardRef } from '@nestjs/common';
import { ValidateRightsService } from './validate-rights.service';
import { ValidateRightsController } from './validate-rights.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/components/user/user.module';
import { AdminUserModule } from '../admin.user/admin.user.module';

@Module({
  imports:[
    JwtModule.register({}),
    UserModule,
    forwardRef(() => AdminUserModule),
  ],
  controllers: [ValidateRightsController],
  providers: [ValidateRightsService],
  exports: [ValidateRightsService],
})
export class ValidateRightsModule {}
