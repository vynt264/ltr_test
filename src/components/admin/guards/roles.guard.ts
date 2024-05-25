import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ValidateRightsService } from "../validate-rights/validate-rights.service";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private validateRightsService: ValidateRightsService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rightsNeedCheck = this.reflector.get<string[]>("roles", context.getHandler());
    const request = context.switchToHttp().getRequest();

    if (request?.user) {
      const { id } = request.user;
      const existRight = await this.validateRightsService.hasRight({
        rightsNeedCheck,
        userId: id,
      });

      if (!existRight) {
        throw new HttpException(
          {
            message: 'NOT_HAVE_ACCESS',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return true;
  }
}
