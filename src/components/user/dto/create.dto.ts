import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, Length, IsNumber } from "class-validator";
import { REGEX, MESSAGES } from "../../../system/config.system/app.utils";
export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(8, 24)
  @Matches(REGEX.PASSWORD_RULE, { message: MESSAGES.PASSWORD_RULE_MESSAGE })
  password: string;


  @ApiProperty()
  @IsNumber()
  bookmakerId: number;
}

export default CreateUserDto;
