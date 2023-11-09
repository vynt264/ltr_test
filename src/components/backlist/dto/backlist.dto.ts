import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class BacklistDto {
  @ApiProperty({
    description: "The acToken of the user",
  })
  @IsNotEmpty()
  @IsString()
  acToken: string;

  @ApiProperty({
    description: "The UserId of user",
  })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: "UserId of user",
  })
  @IsNotEmpty()
  @IsNumber()
  status: number;
}
