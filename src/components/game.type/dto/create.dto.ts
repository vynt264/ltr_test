import {
  IsNotEmpty,
  IsString,
  Length,
  IsNumber,
  Max,
  Min,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateGameTypeDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  @ApiProperty({
    description: "The name of game",
    default: "Bắn cá",
    type: String,
  })
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Max(100)
  @Min(1)
  @ApiProperty({
    description: "Tpye of game",
    default: 0,
    type: Number,
  })
  type: number;
}
