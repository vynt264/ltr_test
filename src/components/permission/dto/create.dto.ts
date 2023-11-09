import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreatePermissionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  role: string;
}

export default CreatePermissionDto;
