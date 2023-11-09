import { ApiProperty } from "@nestjs/swagger";
import { IsNumberString, IsOptional, IsString } from "class-validator";
import { Paging } from "../../system/interfaces";
import { Order } from "../../system/constants/index";

export class PaginationQueryDto implements Paging {
  @IsOptional()
  @IsNumberString()
  @ApiProperty({ default: 10, maximum: 5000 })
  take: number;

  @IsOptional()
  @IsNumberString()
  @ApiProperty({ default: 1 })
  skip: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ default: Order.DESC })
  order: Order;

  @IsOptional()
  @IsString()
  @ApiProperty({
    default:
      '{"username":"testvxmm3","startDate":"2023-03-27", "endDate": "2023-12-27"}',
  })
  keyword: string;
}
