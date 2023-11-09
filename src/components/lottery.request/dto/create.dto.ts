import { IsNotEmpty, IsNumber, Max, Min, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateLotteryRequestDto {
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

  @ApiProperty({
    description: "A type of the game",
    default: "roll-call",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: "A type name of the game",
    default: "week-7",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  typeName: string;
}
