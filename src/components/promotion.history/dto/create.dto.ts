import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class CreatePromotionHistoriesDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: "userId",
  })
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: "promotionId",
  })
  promotionId: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: "moneyReward",
  })
  moneyReward: number;
}
