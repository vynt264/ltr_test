import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { Order } from "src/components/orders/entities/order.entity";
import { JoinColumn } from "typeorm";

export class CreateWinningNumberDto {
    @JoinColumn()
    order: Order;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    winningNumbers: string;

    @ApiProperty({
        default: "28/08/2023-0271",
        type: String,
    })
    @IsNotEmpty()
    turnIndex: string;

    @IsString()
    @IsNotEmpty()
    type: string;
}
