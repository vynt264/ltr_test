import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber } from "class-validator";
export class GetRefundableBalanceDto {
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
}

export default GetRefundableBalanceDto;
