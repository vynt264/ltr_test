import { Module, forwardRef } from '@nestjs/common';
import { SettingService } from './setting.service';
import { SettingController } from './setting.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { JwtModule } from '@nestjs/jwt';
import { RedisCacheModule } from 'src/system/redis/redis.module';
import { ScheduleModule } from 'src/components/schedule/schedule.module';
import { ValidateRightsModule } from '../validate-rights/validate-rights.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Setting]),
    JwtModule.register({}),
    RedisCacheModule,
    forwardRef(() => ScheduleModule),
    ValidateRightsModule,
  ],
  controllers: [SettingController],
  providers: [SettingService],
  exports: [SettingService]
})
export class SettingModule {}
