import { PartialType } from "@nestjs/swagger";
import { CreateGameTextDto } from "./create.dto";

export class UpdateGameTextDto extends PartialType(CreateGameTextDto) {}
