import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsBoolean } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: "username of the user",
    example: "testvxmm3",
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: "Password in plain text",
    example: "jtmbdguF@Jcuf%5dhRMQrjj",
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: "Physical Address",
    example: "00:1A:C2:7B:00:47",
  })
  @IsNotEmpty()
  @IsString()
  mac: string;

  @ApiProperty({
    description: "An Internet Protocol address",
    example: "210.24.209.42",
  })
  @IsNotEmpty()
  @IsString()
  ip: string;

  @ApiProperty({
    description: "If the admin is logging or not",
    default: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  is_admin: boolean;

  @ApiProperty({
    description: "If the admin is logging or not",
    default: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  isAuth: boolean;
}
