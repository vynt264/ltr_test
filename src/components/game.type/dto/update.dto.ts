import { PartialType } from "@nestjs/swagger";
import { CreateGameTypeDto } from "./index";

export class UpdateGameTypeDto extends PartialType(CreateGameTypeDto) {}
