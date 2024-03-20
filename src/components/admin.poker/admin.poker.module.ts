import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlayHistoryPoker } from "./entities/play.history.poker.entity";
import { SysConfigPoker } from "./entities/sys.config.poker.entity";
import { AdminPokerController } from "./admin.poker.controller";
import { AdminPokerService } from "./admin.poker.service";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { JwtModule } from "@nestjs/jwt";
import { MaintenanceModule } from "../maintenance/maintenance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayHistoryPoker, SysConfigPoker]),
    BacklistModule,
    UserModule,
    JwtModule.register({}),
    MaintenanceModule
  ],
  controllers: [AdminPokerController],
  providers: [AdminPokerService],
})
export class AdminPokerModule {}
