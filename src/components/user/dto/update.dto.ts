import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
export class UpdateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  hash: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: "isBeginner boolean",
    example: false,
    type: Boolean,
  })
  isBeginner: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;
}

export default UpdateUserDto;
