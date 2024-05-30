import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { CreateManagementUserInfoDto } from './dto/create-management-user-info.dto';
import { UpdateManagementUserInfoDto } from './dto/update-management-user-info.dto';
import { UserInfoService } from 'src/components/user.info/user.info.service';

@Injectable()
export class ManagementUserInfoService {
  constructor(
    @Inject(forwardRef(() => UserInfoService))
    private userInfoService: UserInfoService,
  ) { }

  create(createManagementUserInfoDto: CreateManagementUserInfoDto) {
    return 'This action adds a new managementUserInfo';
  }

  findAll() {
    return `This action returns all managementUserInfo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} managementUserInfo`;
  }

  update(id: number, updateManagementUserInfoDto: UpdateManagementUserInfoDto) {
    return this.userInfoService.update(id, updateManagementUserInfoDto);
  }

  remove(id: number) {
    return `This action removes a #${id} managementUserInfo`;
  }
}
