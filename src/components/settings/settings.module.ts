import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { RedisCacheModule } from 'src/system/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Setting]),
    RedisCacheModule,
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService]
})
export class SettingsModule {}
