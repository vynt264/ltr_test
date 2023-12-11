import { PartialType } from "@nestjs/swagger";
import { CreateDataFakeRequestDto } from "./create.data.fake.dto";

export class UpdateDataFakeRequestDto extends PartialType(
  CreateDataFakeRequestDto
) {}
