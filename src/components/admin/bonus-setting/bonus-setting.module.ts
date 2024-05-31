import { Module, forwardRef } from '@nestjs/common';
import { BonusSettingService } from './bonus-setting.service';
import { BonusSettingController } from './bonus-setting.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { BonusSetting } from './entities/bonus-setting.entity';
import { ValidateRightsModule } from '../validate-rights/validate-rights.module';
import { RedisCacheModule } from 'src/system/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BonusSetting]),
    JwtModule.register({}),
    ValidateRightsModule,
    forwardRef(() => RedisCacheModule),
  ],
  controllers: [BonusSettingController],
  providers: [BonusSettingService]
})
export class BonusSettingModule { }
