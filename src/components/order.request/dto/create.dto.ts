import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateOrderRequestDto {

  @ApiProperty({
    description: "A type of lottery",
    default: "xsmb",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: "A turn index",
    default: "28/08/2023-0271",
    type: String,
  })
  @IsOptional()
  @IsNotEmpty()
  turnIndex: string;

  @ApiProperty({
    description: "A type of lottery",
    default: "De_Dau",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  betType: string;

  @IsString()
  @IsNotEmpty()
  childBetType: string;
  
  @ApiProperty({
    description: "A type of lottery",
    default: "De_Dau",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  detail: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiProperty({
    description: "",
    default: 10,
    type: Number,
  })
  revenue: number;
}
