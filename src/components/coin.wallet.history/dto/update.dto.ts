import { PartialType } from "@nestjs/swagger";
import { CreateCoinWalletHistoryDto } from "./create.dto";

export class UpdateCoinWalletHistoryDto extends PartialType(CreateCoinWalletHistoryDto) {}