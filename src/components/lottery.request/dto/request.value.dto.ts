import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional } from "class-validator";

export class ValueDto {

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: "",
    default: 10,
    type: Number,
  })
  value: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: "",
    default: 10,
    type: Number,
  })
  amount: number;

}
