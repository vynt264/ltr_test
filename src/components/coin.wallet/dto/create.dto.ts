import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateCoinWalletDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: "userId",
  })
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: "balance",
  })
  balance: number;
}
