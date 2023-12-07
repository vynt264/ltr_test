import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min
} from "class-validator";

export class TransferTransactionDto {
  @ApiProperty({
    description: "amount",
    default: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @MaxLength(50)
  @ApiProperty({
    description: "method",
    default: "wallet_to_sub_wallet, sub_wallet_to_wallet",
    type: String,
  })
  @IsNotEmpty()
  method: string;

  @ApiProperty({
    description: "game code1",
    default: "game1",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  gameCode: string;
}
