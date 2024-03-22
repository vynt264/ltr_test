import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { JoinColumn } from "typeorm";
import { Bookmaker } from "../../bookmaker/entities/bookmaker.entity";

export class CreateLotteryAwardDto {
    @ApiProperty({
        description: "A type of the game",
        default: "roll-call",
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    type: string;

    @ApiProperty({
        description: "turn index",
        default: "31/08/2023-0458",
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    turnIndex: string;

    @IsString()
    @IsNotEmpty()
    awardDetail: string;

    @JoinColumn()
    bookmaker: Bookmaker;

    isTestPlayer: boolean;

    openTime: Date;

    @IsOptional()
    userId?: string;

    totalRevenue: number;

    totalPayout: number;

    totalProfit: number;

    bonusPrice: number;

    createdAt?: Date;
}
