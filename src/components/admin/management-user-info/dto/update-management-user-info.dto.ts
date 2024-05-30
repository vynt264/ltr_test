import { PartialType } from '@nestjs/swagger';
import { CreateManagementUserInfoDto } from './create-management-user-info.dto';

export class UpdateManagementUserInfoDto extends PartialType(CreateManagementUserInfoDto) {}
