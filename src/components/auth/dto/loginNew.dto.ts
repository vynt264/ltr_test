import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginNewDto {
  @ApiProperty({
    description: "params",
    example: "xxxxxxxxxxxxxxxxxxx",
  })
  @IsNotEmpty()
  @IsString()
  params: string;
}
