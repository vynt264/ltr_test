// import { ApiProperty } from "@nestjs/swagger";
// import {
//   IsBoolean,
//   IsDateString,
//   IsNotEmpty,
//   IsOptional,
//   IsString,
//   Length,
// } from "class-validator";

// export class CreateEventTimeDto {
//   @IsDateString({ strict: true })
//   @IsNotEmpty()
//   @Length(6, 100)
//   @ApiProperty({
//     description: "The time start to get data from 3th EventTime",
//     default: "2023-01-01T10:10:10Z",
//     type: String,
//   })
//   start: Date;

//   @IsDateString({ strict: true })
//   @IsNotEmpty()
//   @Length(6, 100)
//   @ApiProperty({
//     description: "The time end to get data from 3th EventTime",
//     default: "2023-01-01T10:10:10Z",
//     type: Date,
//   })
//   end: Date;

//   @IsString()
//   @IsNotEmpty()
//   @Length(2, 5)
//   @ApiProperty({
//     description: "department manages the game",
//     default: "8B",
//     type: String,
//   })
//   department: string;

//   @IsString()
//   @IsNotEmpty()
//   @Length(2, 100)
//   @ApiProperty({
//     description: "The name of the game",
//     default: "earn-point",
//     type: String,
//   })
//   gameName: string;

//   @IsBoolean()
//   @IsOptional()
//   @ApiProperty({
//     description: "Event Times block",
//     default: false,
//     type: Boolean,
//   })
//   isLock: boolean;
// }
