import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class QueryDto {
    @ApiProperty({
        type: String,
    })
    @IsNotEmpty()
    game: string;

    @ApiProperty({
        type: String,
    })
    @IsNotEmpty()
    gameType: string;

    @ApiProperty({
        type: String,
    })
    @IsNotEmpty()
    bookmarkerId: string;

    @ApiProperty({
        type: String,
    })
    @IsNotEmpty()
    searchBy: string;

    @IsOptional()
    limit: number;

    @IsOptional()
    page: number;

    @IsOptional()
    isTestPlayer: boolean;

    @IsOptional()
    month: string;

    @IsOptional()
    fromDate: Date;

    @IsOptional()
    toDate: Date;
}