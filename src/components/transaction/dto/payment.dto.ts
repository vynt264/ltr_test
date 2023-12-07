import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class PaymentTransactionDto {
  
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
    default: "game1 IsOptional",
    type: String,
  })
  @IsOptional()
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
    description: "note ",
    default: "game note",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  transType: string;
  
  @ApiProperty({
    description: "note ",
    default: "game note",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  method: string;

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

  @IsOptional()
  @IsString()
  ft: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  status: string;
}
