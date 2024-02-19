import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class UserInfoQueryDto {
  @IsNumber()
  @ApiProperty({ default: 1 })
  bookmakerId: number;

  @IsString()
  @ApiProperty({ default: "test123"})
  username: string;
}