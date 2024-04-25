import { PartialType } from '@nestjs/swagger';
import { CreateBonusSettingDto } from './create-bonus-setting.dto';

export class UpdateBonusSettingDto extends PartialType(CreateBonusSettingDto) {}
