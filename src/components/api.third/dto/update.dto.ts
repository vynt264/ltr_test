import { PartialType } from "@nestjs/swagger";
import { CreateAPIDto } from "./index";

export class UpdateAPIDto extends PartialType(CreateAPIDto) {}
