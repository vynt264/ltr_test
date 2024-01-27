import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber, IsDecimal } from "class-validator";
export class DepositDto {
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

export default DepositDto;
