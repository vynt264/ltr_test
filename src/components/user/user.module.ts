import { BacklistModule } from "../backlist/backlist.module";
import { UserController } from "./user.controller";
import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { ConnectModule } from "../connect/connect.module";
@Module({
  imports: [
    BacklistModule,
    TypeOrmModule.forFeature([User]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
