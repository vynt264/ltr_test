import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber, IsOptional } from "class-validator";
export class GetBetInfoDto {
  @IsOptional()
  @IsString()
  username: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  bookmakerId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  timeStart: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  timeEnd: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sign: string;

}

export default GetBetInfoDto;
