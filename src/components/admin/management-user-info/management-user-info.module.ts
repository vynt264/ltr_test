import { Module, forwardRef } from '@nestjs/common';
import { ManagementUserInfoService } from './management-user-info.service';
import { ManagementUserInfoController } from './management-user-info.controller';
import { UserInfoModule } from 'src/components/user.info/user.info.module';
import { JwtModule } from '@nestjs/jwt';
import { ValidateRightsModule } from '../validate-rights/validate-rights.module';

@Module({
  imports: [
    JwtModule.register({}),
    forwardRef(() => UserInfoModule),
    forwardRef(() => ValidateRightsModule),
  ],
  controllers: [ManagementUserInfoController],
  providers: [ManagementUserInfoService]
})
export class ManagementUserInfoModule {}
