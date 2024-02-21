import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional } from "class-validator";
export class UpdateSysConfigHiloDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsOptional()
  @IsString()
  value: string;
}

export default UpdateSysConfigHiloDto;
