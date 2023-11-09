import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Length } from "class-validator";

export class CreateSysConfigsDto {
  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: "parentId of the config",
    example: 0,
    type: Number,
  })
  parentId: number;

  @IsString()
  @IsNotEmpty()
  @Length(0, 127)
  @ApiProperty({
    description: "module name of the config",
    example: "module 0",
    maxLength: 255,
    type: String,
  })
  module: string;

  @IsString()
  @IsNotEmpty()
  @Length(0, 127)
  @ApiProperty({
    description: "item name of the config",
    example: "item 0",
    maxLength: 255,
    type: String,
  })
  item: string;

  @IsString()
  @IsOptional()
  @Length(0, 127)
  @ApiProperty({
    description: "item name of the config",
    example: "item 0",
    maxLength: 255,
    type: String,
  })
  itemCode: string;

  @IsString()
  @IsOptional()
  @Length(0, 511)
  @ApiProperty({
    description: "value of the config",
    example: "value 0",
    maxLength: 1023,
    type: String,
  })
  value: string;

  @IsString()
  @IsOptional()
  @Length(0, 511)
  @ApiProperty({
    description: "value1 of the config",
    example: "value 1",
    maxLength: 511,
    type: String,
  })
  value1: string;

  @IsString()
  @IsOptional()
  @Length(0, 511)
  @ApiProperty({
    description: "value2 of the config",
    example: "value 2",
    maxLength: 511,
    type: String,
  })
  value2: string;

  @IsString()
  @IsOptional()
  @Length(0, 511)
  @ApiProperty({
    description: "value2 of the config",
    example: "value 3",
    maxLength: 511,
    type: String,
  })
  value3: string;
}
