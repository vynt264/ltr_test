import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional } from "class-validator";
export class UpdateSysConfigPokerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsOptional()
  @IsString()
  value: string;
}

export default UpdateSysConfigPokerDto;
