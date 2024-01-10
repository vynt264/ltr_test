import { PartialType } from "@nestjs/swagger";
import { CreateWalletInoutDto } from "./create.dto";

export class UpdateWalletInoutDto extends PartialType(
    CreateWalletInoutDto
) {}
