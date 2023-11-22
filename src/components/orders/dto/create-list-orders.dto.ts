import { IsArray, IsNotEmpty, ValidateNested } from "class-validator";
import { CreateOrderDto } from "./create-order.dto";
import { Type } from "class-transformer";

export class CreateListOrdersDto {
    // @IsNotEmpty()
    @IsArray()
    // @ValidateNested({ each: true })
    @Type(() => CreateOrderDto)
    orders: CreateOrderDto[];
}