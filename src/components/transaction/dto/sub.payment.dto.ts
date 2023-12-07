import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class SubPaymentTransactionDto {
  @ApiProperty({
    description: "username",
    default: "username",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: "amount",
    default: 1.1,
    type: Number,
  })
  @IsNumber()
  @IsNumber()
  @Min(0.00001)
  amount: number;

  @ApiProperty({
    description: "game code1",
    default: "game1",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  gameCode: string;

  @ApiProperty({
    description: "note ",
    default: "game note",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  note: string;

  @ApiProperty({
    description: "signature ",
    default: "signature",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  signature: string;

  @ApiProperty({
    description: "transRef1 ",
    default: "transRef1",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  transRef1: string;
}
