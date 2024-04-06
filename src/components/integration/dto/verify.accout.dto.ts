import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber, IsOptional } from "class-validator";
export class VerifyAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  bookmakerId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sign: string;

  @IsOptional()
  @IsNumber()
  typeGame: number;
}

export default VerifyAccountDto;
