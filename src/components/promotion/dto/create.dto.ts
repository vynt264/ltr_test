import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreatePromotionDto {
  @IsString()
  @ApiProperty({
    description: "Promotion name",
  })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "Promotion category",
  })
  category: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "Promotion type",
  })
  type: string;

  @IsString()
  @ApiProperty({
    description: "Promotion rule",
  })
  rule: string;

  @IsString()
  @ApiProperty({
    description: "Promotion config",
  })
  config: string;
}
