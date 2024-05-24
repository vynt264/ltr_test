import { PartialType } from '@nestjs/swagger';
import { CreateValidateRightDto } from './create-validate-right.dto';

export class UpdateValidateRightDto extends PartialType(CreateValidateRightDto) {}
