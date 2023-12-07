import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber } from "class-validator";
export class CreateGameTextDto {
  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  betType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  childBetType: string;

  @ApiProperty()
  @IsString()
  howToPlay: string;

  @ApiProperty()
  tutorial: string;

  @ApiProperty()
  maxReward: string;
}

export default CreateGameTextDto;
