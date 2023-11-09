import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";
export class UserUpdateDto {
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: "isBeginner boolean",
    example: false,
    type: Boolean,
  })
  isBeginner: boolean;
}

export default UserUpdateDto;
