import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from "class-validator";

export class GetUserWalletInfoDto {
  @ApiProperty({
    description: "8day01 username",
    example: "8day01",
    type: String,
  })
  @IsString()
  @IsOptional()
  username: string;

  @ApiProperty({
    description: "walletBalance: 1 get, 0 not get",
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  walletBalance: number;

  @ApiProperty({
    description: "depositRevenue: 1 get, 0 not get",
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  depositRevenue: number;

  @ApiProperty({
    description: "rate: 1 get, 0 not get",
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  rate: number;

  @ApiProperty({
    description: "sumRevenue: 1 get, 0 not get",
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  sumRevenue: number;

  @IsDateString({ strict: true })
  @IsOptional()
  @Length(6, 30)
  @ApiProperty({
    description: "fromDate",
    default: "2023-08-12T10:10:10Z",
    type: Date,
  })
  fromDate: Date;

  @IsDateString({ strict: true })
  @IsOptional()
  @Length(6, 30)
  @ApiProperty({
    description: "toDate",
    default: "2023-08-12T10:10:10Z",
    type: Date,
  })
  toDate: Date;

  @ApiProperty({
    description: "gamesType info: 1 get, 0 not get",
    example: ["game1", "game2"],
    type: String,
  })
  @IsArray()
  @IsOptional()
  gamesCode: string[];

  @ApiProperty({
    description: "gameCodeInfo: 1 get, 0 not get",
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  gameCodeInfo: number;
}
