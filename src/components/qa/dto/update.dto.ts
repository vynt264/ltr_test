import { PartialType } from "@nestjs/swagger";
import { CreateQaDto } from "./index";

export class UpdateQaDto extends PartialType(CreateQaDto) {}
