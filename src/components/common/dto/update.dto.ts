import { PartialType } from "@nestjs/swagger";
import { CreateCommonDto } from "./index";

export class UpdateCommonDto extends PartialType(CreateCommonDto) {}
