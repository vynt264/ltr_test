import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateSubWalletDto {

  @ApiProperty({
    description: "isBlock ",
    default: false,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  isBlock: boolean;
}
