import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber } from "class-validator";
export class CheckStatusTransactionDto {
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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderKey: string;
;
}

export default CheckStatusTransactionDto;
