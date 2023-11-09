import {
  IsNotEmpty,
  IsNumber,
  Max,
  Min,
  IsString,
  Length,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserHistoryDto {
  @IsNotEmpty()
  @IsNumber()
  @Max(2147483647)
  @Min(1)
  @ApiProperty({
    description: "An userId belong to user action",
    default: 1,
    type: Number,
  })
  userId: number;

  @IsString()
  @IsNotEmpty()
  @Length(5, 50)
  @ApiProperty({
    description: "An action user had done",
    default: "LOGIN",
    type: String,
  })
  action: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 50)
  @ApiProperty({
    description: "A note user had done",
    default: "LOGIN any time",
    type: String,
  })
  note: string;

  @ApiProperty({
    description: "Physical Address",
    example: "00:1A:C2:7B:00:47",
  })
  @IsNotEmpty()
  @IsString()
  mac: string;

  @ApiProperty({
    description: "An Internet Protocol address",
    example: "210.24.209.42",
  })
  @IsNotEmpty()
  @IsString()
  ip: string;
}
