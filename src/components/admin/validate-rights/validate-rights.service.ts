import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { CreateValidateRightDto } from './dto/create-validate-right.dto';
import { UpdateValidateRightDto } from './dto/update-validate-right.dto';
import { AdminUserService } from '../admin.user/admin.user.service';
import { SUPPER_ROLE } from 'src/system/constants/rights';

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
    rightNeedCheck,
    userId,
  }: {
    rightNeedCheck: Array<any>,
    userId: number,
  }): Promise<boolean> {

    const rightsOfUser = await this.getRightsByUserId(userId);
    if (!rightNeedCheck || rightNeedCheck.length === 0 || !rightsOfUser) return false;

    let rights: any = [];
    try {
      rights = rightsOfUser.split(',');
    } catch (err) {
      rights = [];
    }

    if (rights.length === 0) return false;

    let hasRight = false;
    const superRole = SUPPER_ROLE;
    for (const rOfUser of rightNeedCheck) {
      hasRight = rights.some((r: any) => {
        return (r === rOfUser.Name || r === superRole);
      });

      if (hasRight) break;
    }

    // TODO: throw error

    return hasRight;
  }
}
