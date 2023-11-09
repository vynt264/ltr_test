import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Backlist } from "./backlist.entity";
import { BacklistService } from "./backlist.service";

@Module({
  imports: [TypeOrmModule.forFeature([Backlist])],
  providers: [BacklistService],
  exports: [BacklistService],
})
export class BacklistModule {}
