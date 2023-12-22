import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class BodyAnalyticsDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({
        description: "lottery Type",
    })
    lottType: string;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({
        description: "playType",
    })
    playType: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: "subPlayType",
    })
    subPlayType: string;

}
