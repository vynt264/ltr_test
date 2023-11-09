import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserService } from "../../user/user.service";
import { UserRoles } from "../../../components/user/enums/user.enum";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>("roles", context.getHandler());
    const request = context.switchToHttp().getRequest();

    if (request?.user) {
      const { id } = request.user;
      const user = await this.userService.getOneById(id);
      if (!user?.result?.option) {
        return roles.includes(user?.result?.role);
      }

      const options = user?.result?.option.split(",");
      let own = false;
      for (const option of options) {
        if (roles.includes(option) && user?.result?.role === UserRoles.ADMIN) {
          own = true;
        }
      }

      const grant = own || roles.includes(user?.result?.role);
      if (grant) {
        return true;
      }
    }

    return false;
  }
}
