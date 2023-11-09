import {
  IsNumber,
  Min,
  Max,
  IsString,
  IsNotEmpty,
  Length,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateConnectDto {
  @IsNumber()
  @Max(10000)
  @Min(1)
  @ApiProperty({
    description: "An awardAmount of the third API",
    default: 10,
    type: Number,
  })
  awardAmount: number;

  @IsString()
  @IsNotEmpty()
  @Length(5, 50)
  @ApiProperty({
    description: "An action of the third API",
    default: "anthonytest99",
    type: String,
  })
  userName: string;
}
