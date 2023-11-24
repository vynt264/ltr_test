import { IsNumberString, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Order } from "src/system/constants";

export class PaginationDto {
    @IsOptional()
    @IsNumberString()
    limit: number;

    @IsOptional()
    @IsNumberString()
    page: number;

    @ApiProperty({
        default: Order.DESC,
    })
    @IsOptional()
    @IsString()
    order: Order;
    
    @IsOptional()
    @IsString()
    status: string;
}