import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateCoinWalletHistoryDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: "coinWalletId",
  })
  coinWalletId: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: "amount",
  })
  amount: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "type",
  })
  type: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "status",
  })
  status: string;
}
