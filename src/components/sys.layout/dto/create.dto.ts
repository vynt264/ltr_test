import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
export class CreateSysLayoutDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sysKey: string;

  @ApiProperty()
  @IsString()
  sysValue: string;
}

export default CreateSysLayoutDto;
