import { PartialType } from '@nestjs/swagger';
import { CreateLotteryAwardDto } from './create-lottery.award.dto';

export class UpdateLotteryAwardDto extends PartialType(CreateLotteryAwardDto) {}
