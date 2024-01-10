import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsNotEmpty, IsNumber, Max, Min } from "class-validator";

export class CreateWalletInoutDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: "An userId",
    default: 0,
    type: Number,
  })
  userId: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: "Balance in",
    default: 0,
    type: Number,
  })
  balanceIn: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: "Balance out",
    default: 0,
    type: Number,
  })
  balanceOut: number;
}
