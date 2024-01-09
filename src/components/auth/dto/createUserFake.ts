import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateUserFakeDto {
  @ApiProperty({
    description: "username of the user",
    example: "testvxmm3",
  })
  @IsNotEmpty()
  @IsString()
  usernameReal: string;


  @IsString()
  bookmakerId: number;
}
