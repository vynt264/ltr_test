import { IsNotEmpty, IsNumber, Max, Min, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateDataFakeRequestDto {
  @ApiProperty({
    description: "username",
    default: "",
    type: String,
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: "avatar",
    default: "https://aws.s3.com",
    type: String,
  })
  @IsString()
  avatar: string;

  @ApiProperty({
    description: "gameType",
    default: "",
    type: String,
  })
  @IsString()
  gameType: string;

  @ApiProperty({
    description: "number",
    default: 0,
    type: Number,
  })
  @IsNumber()
  paymentWin: number;

  @ApiProperty({
    description: "revenue",
    default: 0,
    type: Number,
  })
  @IsNumber()
  revenue: number;

  @ApiProperty({
    description: "numbPlayer",
    default: 0,
    type: Number,
  })
  @IsNumber()
  numbPlayer: number;

  @ApiProperty({
    description: "totalBet",
    default: 0,
    type: Number,
  })
  @IsNumber()
  totalBet: number;

  @ApiProperty({
    description: "keyMode",
    default: "",
    type: String,
  })
  @IsString()
  keyMode: string;
}
