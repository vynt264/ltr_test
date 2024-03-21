import { ApiProperty } from "@nestjs/swagger";
import {
  IsDate,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from "class-validator";

export class ReportQueryDto {
//   @IsOptional()
  @IsNumberString()
  @ApiProperty({ default: 1})
  bookmakerId: number;

//   @IsOptional()
  @IsString()
  @ApiProperty({ default: "day"})
  timeFillter: string;
}