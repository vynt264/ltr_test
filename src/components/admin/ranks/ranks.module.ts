import { Module, forwardRef } from '@nestjs/common';
import { RanksService } from './ranks.service';
import { RanksController } from './ranks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rank } from './entities/rank.entity';
import { JwtModule } from '@nestjs/jwt';
import { AdminUserModule } from '../admin.user/admin.user.module';
import { ValidateRightsModule } from '../validate-rights/validate-rights.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rank]),
    JwtModule.register({}),
    forwardRef(() => AdminUserModule),
    forwardRef(() => ValidateRightsModule),
  ],
  controllers: [RanksController],
  providers: [RanksService]
})
export class RanksModule {}
