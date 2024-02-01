import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { BookMaker } from "src/components/bookmaker/bookmaker.entity";
import { HoldingNumber } from "src/components/holding-numbers/entities/holding-number.entity";
import { User } from "src/components/user/user.entity";
import { JoinColumn, ManyToOne } from "typeorm";

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

    seconds: number;

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

    @ManyToOne(() => User, {
        cascade: true,
        createForeignKeyConstraints: false,
    })

    @JoinColumn()
    user: User;

    @JoinColumn()
    bookMaker: BookMaker;

    @JoinColumn()
    holdingNumber: HoldingNumber;

    isTestPlayer: boolean;

    openTime: string;
    closeTime: string;
}
