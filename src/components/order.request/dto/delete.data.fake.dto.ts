import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class DelDataFakeReqDto {

  @ApiProperty({
    description: "username fake",
    default: "testldp001",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  usernameFake: string;
}
