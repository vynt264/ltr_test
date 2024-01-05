import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber } from "class-validator";
export class CreateGameDto {
  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  parrentType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsNumber()
  sumBet: number;

  @ApiProperty()
  @IsString()
  textView: string;

  @ApiProperty()
  @IsString()
  image: string;
}

export default CreateGameDto;
