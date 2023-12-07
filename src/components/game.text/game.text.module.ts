import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GameText } from "./game.text.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { GameTextController } from "./game.text.controller";
import { GameTextService } from "./game.text.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([GameText]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
  ],
  controllers: [GameTextController],
  providers: [GameTextService],
})
export class GameTextModule {}
