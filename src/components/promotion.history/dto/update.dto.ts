import { PartialType } from "@nestjs/swagger";
import { CreatePromotionHistoriesDto } from "./index";

export class UpdatePromotionHistoriesDto extends PartialType(CreatePromotionHistoriesDto) {}