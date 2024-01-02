import { PartialType } from '@nestjs/swagger';
import { CreateWinningNumberDto } from './create-winning-number.dto';

export class UpdateWinningNumberDto extends PartialType(CreateWinningNumberDto) {}
