import { PartialType } from "@nestjs/swagger";
import { CreatePromotionDto } from "./create.dto";

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {}