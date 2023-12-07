import { PartialType } from "@nestjs/swagger";
import { CreateCoinWalletDto } from "./create.dto";

export class UpdateCoinWalletDto extends PartialType(CreateCoinWalletDto) {}