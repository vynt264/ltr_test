import { BacklistModule } from "../backlist/backlist.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { API } from "./api.entity";
import { APIController } from "./api.third.controller";
import { APIService } from "./api.third.service";
import { UserModule } from "../user/user.module";
import { JwtModule } from "@nestjs/jwt";
import { MaintenanceModule } from "../maintenance/maintenance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([API]),
    BacklistModule,
    UserModule,
    JwtModule.register({}),
    MaintenanceModule
  ],
  controllers: [APIController],
  providers: [APIService],
})
export class APIModule {}
