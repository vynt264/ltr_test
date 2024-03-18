// import { ApiProperty } from "@nestjs/swagger";
// import { IsDateString, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

// export class GetLotteryAwardDto {

//   @IsDateString({ strict: true })
//   @IsOptional()
//   @Length(6, 30)
//   @ApiProperty({
//     description: "fromDate",
//     default: "2023-08-12T10:10:10Z",
//     type: Date,
//   })
//   fromDate: Date;

//   @IsDateString({ strict: true })
//   @IsOptional()
//   @Length(6, 30)
//   @ApiProperty({
//     description: "toDate",
//     default: "2023-08-12T10:10:10Z",
//     type: Date,
//   })
//   toDate: Date;

//   @IsString()
//   @IsNotEmpty()
//   @ApiProperty({
//     description: "xsmb",
//     default: "xsmb",
//     type: String,
//   })
//   type: string;
// }
