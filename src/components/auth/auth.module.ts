import { UserHistoryModule } from "../user.history/user.history.module";
import { ConnectModule } from "../connect/connect.module";
import { BacklistModule } from "../backlist/backlist.module";
import { RtStrategy } from "./rt/rt.strategy";
import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { LocalStrategy } from "./local.stratery/local.strategy";
import { UserModule } from "../user/user.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./jwt/jwt.strategy";
@Module({
  imports: [
    UserHistoryModule,
    UserModule,
    BacklistModule,
    ConnectModule,
    PassportModule,
    JwtModule.register({}),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, RtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
