import { IsNotEmpty, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class TestLoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 50)
  @ApiProperty({
    description: "An action of the third API",
    default: "anthonytest99",
    type: String,
  })
  userName: string;
}
