import { Module } from '@nestjs/common';
import { SettingService } from './setting.service';
import { SettingController } from './setting.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { JwtModule } from '@nestjs/jwt';
import { RedisCacheModule } from 'src/system/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Setting]),
    JwtModule.register({}),
    RedisCacheModule,
  ],
  controllers: [SettingController],
  providers: [SettingService]
})
export class SettingModule {}
