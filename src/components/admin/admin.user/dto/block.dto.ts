import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";
export class BlockUserDto {
  @ApiProperty({
    type: Boolean,
  })
  @IsBoolean()
  isBlocked: boolean;
}

export default BlockUserDto;
