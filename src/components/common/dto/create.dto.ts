import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber } from "class-validator";
export class CreateCommonDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  common_key: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  common_value: string;
}

export default CreateCommonDto;
