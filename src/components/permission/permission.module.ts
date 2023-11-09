import { Module } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Permission } from "./permission.entity";
import { PermissionController } from "./permission.controller";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";

@Module({
  imports: [TypeOrmModule.forFeature([Permission]), BacklistModule, UserModule],
  providers: [PermissionService],
  controllers: [PermissionController],
  exports: [PermissionService],
})
export class PermissionModule {}
