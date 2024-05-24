import { Module, forwardRef } from '@nestjs/common';
import { AdminUserService } from './admin.user.service';
import { AdminUserController } from './admin.user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from './entities/admin.user.entity';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/components/user/user.module';
import { RolesModule } from '../roles/roles.module';
import { ValidateRightsModule } from '../validate-rights/validate-rights.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([
      AdminUser,
    ]),
    JwtModule.register({}),
    UserModule,
    forwardRef(() => RolesModule),
    forwardRef(() => ValidateRightsModule),
  ],
  controllers: [AdminUserController],
  providers: [AdminUserService],
  exports: [AdminUserService],
})
export class AdminUserModule {}
