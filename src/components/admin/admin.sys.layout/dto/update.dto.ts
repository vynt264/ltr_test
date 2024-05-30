import { PartialType } from "@nestjs/swagger";
import { CreateSysLayoutDto } from "./index";

export class UpdateSysLayoutDto extends PartialType(CreateSysLayoutDto) {}
