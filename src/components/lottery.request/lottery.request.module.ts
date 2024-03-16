// import { Module } from "@nestjs/common";
// import { TypeOrmModule } from "@nestjs/typeorm";
// import { LotteryRequest } from "./lottery.request.entity";
// import { BacklistModule } from "../backlist/backlist.module";
// import { UserModule } from "../user/user.module";
// import { LotteryRequestController } from "./lottery.request.controller";
// import { LotteryRequestService } from "./lottery.request.service";
// import { SysConfig } from "../sys.config/sys.config.entity";
// import { SysConfigsModule } from "../sys.config/sys.config.module";
// import { ConnectModule } from "../connect/connect.module";
// import { User } from "../user/user.entity";
// import { LotteryFtQueue } from "./lottery.ft.queue";
// import { LotteryAward } from "../lottery.award/lottery.award.entity";
// import { ScheduleModule } from "@nestjs/schedule";
// import { JwtModule } from "@nestjs/jwt";
// // import { LotteryAwardModule } from "../lottery.award/lottery.award.module";

// @Module({
//   imports: [
//     TypeOrmModule.forFeature(
//       [
//       LotteryRequest,
//       SysConfig,
//       User,
//       LotteryFtQueue,
//       LotteryAward,
//     ]),
//     JwtModule.register({}),
//     BacklistModule,
//     UserModule,
//     SysConfigsModule,
//     ConnectModule,
//     // LotteryAwardModule,
//     ScheduleModule.forRoot(),
//   ],
//   controllers: [LotteryRequestController],
//   providers: [LotteryRequestService],
// })
// export class LotteryRequestModule {}