import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class CreateAPIDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  @ApiProperty({
    description: "The third API",
    default: "https://test-api.vietlottvn.com/member/r/userCe",
    type: String,
  })
  api: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 10)
  @ApiProperty({
    description: "The third API in order to some actions",
    default: "LOGIN",
    type: String,
  })
  action: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  @ApiProperty({
    description: "department manages the game",
    default: "8B_DEV",
    type: String,
  })
  department: string;
}
