import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty } from "class-validator";
import { UpdateSysConfigsDto } from "./update.dto";

export class UpdateListSysConfigsDto {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  sysConfigs: UpdateSysConfigsDto[];
}
