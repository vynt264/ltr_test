import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, Length, IsNumber, IsOptional } from "class-validator";
import { REGEX, MESSAGES } from "../../../../system/config.system/app.utils";

export class CreateAdminUserDto {
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
  
    @IsOptional()
    @IsNumber()
    bookmakerId: number;

    @IsOptional()
    roleAdminUserId: number;
}
