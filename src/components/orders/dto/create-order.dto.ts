import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateOrderDto {
    numericalOrder: string;
    multiple: number;

    @ApiProperty({
        default: "xsmb",
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    type: string;

    @ApiProperty({
        default: "28/08/2023-0271",
        type: String,
    })
    @IsOptional()
    @IsNotEmpty()
    turnIndex: string;

    @ApiProperty({
        default: "De_Dau",
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    betType: string;

    betTypeName: string;

    @IsString()
    @IsNotEmpty()
    childBetType: string;

    childBetTypeName: string;

    @ApiProperty({
        default: "De_Dau",
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    detail: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @ApiProperty({
        description: "",
        default: 10,
        type: Number,
    })
    revenue: number;

    numberOfBets: number;
}
