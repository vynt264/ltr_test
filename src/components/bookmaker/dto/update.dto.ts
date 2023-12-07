import { PartialType } from "@nestjs/swagger";
import { CreateBookMakerDto } from "./create.dto";

export class UpdateBookMakerDto extends PartialType(CreateBookMakerDto) {}
