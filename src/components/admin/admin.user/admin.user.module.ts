import { Module } from '@nestjs/common';
import { AdminUserService } from './admin.user.service';
import { AdminUserController } from './admin.user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from './entities/admin.user.entity';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/components/user/user.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([
      AdminUser,
    ]),
    JwtModule.register({}),
    UserModule
  ],
  controllers: [AdminUserController],
  providers: [AdminUserService]
})
export class AdminUserModule {}
