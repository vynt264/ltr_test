import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber } from "class-validator";
export class CreateUserInfoDto {
  @ApiProperty()
  @IsString()
  avatar: string;

  @ApiProperty()
  @IsString()
  nickname: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  sumBet: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  sumOrder: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  sumOrderWin: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  sumOrderLose: number;

  @ApiProperty()
  @IsString()
  favoriteGame: string;
}

export default CreateUserInfoDto;
