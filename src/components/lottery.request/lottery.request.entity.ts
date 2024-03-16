// import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
// import { RequestDetailDto } from "./dto/request.detail.dto";

// @Entity({ name: "lottery_request" })
// export class LotteryRequest {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column({ name: "lottery_award_id", type: "int", nullable: true })
//   lotteryAwardId: number;

//   @Column({ type: "varchar", length: 63, nullable: true })
//   type: string;

//   @Column({ name: "turnIndex", type: "varchar", length: 63, nullable: true })
//   turnIndex: string;

//   @Column({ name: "partnerCode", type: "varchar", length: 63, nullable: true })
//   partnerCode: string;

//   @Column({ type: "varchar", length: 63, nullable: true })
//   status: string;

//   @Column({ name: "errorReason", type: "varchar", length: 255, nullable: true })
//   errorReason: string;

//   @Column({ type: "json", nullable: true })
//   detail: RequestDetailDto;

//   @Column({ name: "transRef1", type: "varchar", length: 63, nullable: true })
//   transRef1: string;

//   @Column({ type: "varchar", length: 63, nullable: true })
//   ft: string;

//   @Column({ type: "varchar", length: 63, nullable: true })
//   ip: string;

//   @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
//   createdAt: Date;

//   @Column({ name: "createdBy", type: "varchar", length: 127, nullable: true })
//   createdBy: string;
// }