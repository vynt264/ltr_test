import { PartialType } from '@nestjs/swagger';
import { CreateBookmakerDto } from './create-bookmaker.dto';

export class UpdateBookmakerDto extends PartialType(CreateBookmakerDto) {}
