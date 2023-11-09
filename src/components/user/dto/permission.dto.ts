import { ApiProperty } from "@nestjs/swagger";
import { IsArray } from "class-validator";
export class PermissionUserDto {
  @ApiProperty()
  @IsArray()
  permission: string[];
}

export default PermissionUserDto;
