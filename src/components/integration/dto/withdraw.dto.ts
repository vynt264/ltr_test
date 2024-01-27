import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber } from "class-validator";
export class WithdrawDto {
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
  supplier: string;

  @ApiProperty()
  @IsNumber({maxDecimalPlaces: 2})
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sign: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderKey: string;
}

export default WithdrawDto;
