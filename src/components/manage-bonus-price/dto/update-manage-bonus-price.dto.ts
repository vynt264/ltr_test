import { PartialType } from '@nestjs/swagger';
import { CreateManageBonusPriceDto } from './create-manage-bonus-price.dto';

export class UpdateManageBonusPriceDto extends PartialType(CreateManageBonusPriceDto) {}
