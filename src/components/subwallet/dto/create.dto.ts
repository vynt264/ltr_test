import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, Max, Min } from "class-validator";

export class CreateSubWalletDto {
  @IsNotEmpty()
  @IsNumber()
  @Max(2147483647)
  @Min(0)
  @ApiProperty({
    description: "An userId",
    default: 0,
    type: Number,
  })
  userId: number;
}
