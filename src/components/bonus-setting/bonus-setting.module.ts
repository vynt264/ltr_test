import { Module, forwardRef } from '@nestjs/common';
import { BonusSettingService } from './bonus-setting.service';
import { BonusSettingController } from './bonus-setting.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonusSetting } from './entities/bonus-setting.entity';
import { JwtModule } from '@nestjs/jwt';
import { RedisCacheModule } from 'src/system/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BonusSetting]),
    JwtModule.register({}),
    forwardRef(() => RedisCacheModule),
  ],
  controllers: [BonusSettingController],
  providers: [BonusSettingService],
  exports: [BonusSettingService]
})
export class BonusSettingModule {}
