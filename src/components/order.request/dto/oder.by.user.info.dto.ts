import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class OrderByUserInfoReqDto {

  @ApiProperty({
    description: "username",
    default: "testldp003",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
