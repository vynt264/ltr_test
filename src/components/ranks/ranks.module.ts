import { Module, forwardRef } from '@nestjs/common';
import { RanksService } from './ranks.service';
import { RanksController } from './ranks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rank } from './entities/rank.entity';
import { JwtModule } from '@nestjs/jwt';
import { BacklistModule } from '../backlist/backlist.module';
import { AdminUserModule } from '../admin/admin.user/admin.user.module';

@Module({
  imports: [
    BacklistModule,
    TypeOrmModule.forFeature([Rank]),
    JwtModule.register({}),
    forwardRef(() => AdminUserModule),
  ],
  controllers: [RanksController],
  providers: [RanksService],
  exports: [RanksService],
})
export class RanksModule {}
