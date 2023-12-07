import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class TopUpMainRequestDto {
  @IsString()
  @MaxLength(63)
  @ApiProperty({
    description: "username",
    default: "username",
    type: String,
  })
  username: string;

  @ApiProperty({
    description: "amount",
    default: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @MaxLength(50)
  @ApiProperty({
    description: "transRef1",
    default: "unique",
    type: String,
  })
  transRef1: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  @ApiProperty({
    description: "note",
    default: "message note",
    type: String,
  })
  note?: string;
}
