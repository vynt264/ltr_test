import { ApiProperty } from "@nestjs/swagger";
import { IsJSON, IsNotEmpty, IsString } from "class-validator";
import { BookMaker } from "src/components/bookmaker/bookmaker.entity";
import { JoinColumn } from "typeorm";

export class CreateLotteryAwardDto {

  @ApiProperty({
    description: "A type of the game",
    default: "roll-call",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: "turn index",
    default: "31/08/2023-0458",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  turnIndex: string;

  @IsString()
  @IsNotEmpty()
  awardDetail: string;

  @JoinColumn()
  bookmaker: BookMaker;

  isTestPlayer: boolean;
}
