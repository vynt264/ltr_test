import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 50)
  @ApiProperty({
    description: "A mac address a device",
    default: "00:1A:C2:7B:00:47",
    type: String,
  })
  mac: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 50)
  @ApiProperty({
    description: "An IP address a device",
    default: "210.24.209.42",
    type: String,
  })
  ip: string;
}
