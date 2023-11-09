import { PartialType } from "@nestjs/swagger";
import { CreateUserHistoryDto } from "./index";

export class UpdateUserHistoryDto extends PartialType(CreateUserHistoryDto) {}
