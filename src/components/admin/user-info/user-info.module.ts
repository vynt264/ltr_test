import { Module } from '@nestjs/common';
import { UserInfoService } from './user-info.service';
import { UserInfoController } from './user-info.controller';
import { ValidateRightsModule } from '../validate-rights/validate-rights.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({}),
    ValidateRightsModule,
  ],
  controllers: [UserInfoController],
  providers: [UserInfoService]
})
export class UserInfoModule {}
