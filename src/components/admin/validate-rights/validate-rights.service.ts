import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { CreateValidateRightDto } from './dto/create-validate-right.dto';
import { UpdateValidateRightDto } from './dto/update-validate-right.dto';
import { AdminUserService } from '../admin.user/admin.user.service';
import { SUPPER_ROLE } from 'src/system/constants/rights';
import { checkRight } from 'src/helpers/right';

@Injectable()
export class ValidateRightsService {
  constructor(
    @Inject(forwardRef(() => AdminUserService))
    private adminUserService: AdminUserService,
  ) { }

  async getRightsByUserId(userId: number) {
    const permissions = await this.adminUserService.getRightsByUserId(userId);

    return permissions;
  }

  async hasRight({
    rightsNeedCheck,
    userId,
  }: {
    rightsNeedCheck: Array<any>,
    userId: number,
  }): Promise<boolean> {
    const rightsOfUser = await this.getRightsByUserId(userId);

    return checkRight({
      rightsNeedCheck,
      rightsOfUser,
    });
  }
}
