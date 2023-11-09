import { PartialType } from "@nestjs/swagger";
import { CreateGameDto } from "./index";

export class UpdateGameDto extends PartialType(CreateGameDto) {}
