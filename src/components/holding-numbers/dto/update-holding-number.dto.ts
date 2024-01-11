import { PartialType } from '@nestjs/swagger';
import { CreateHoldingNumberDto } from './create-holding-number.dto';

export class UpdateHoldingNumberDto extends PartialType(CreateHoldingNumberDto) {}
