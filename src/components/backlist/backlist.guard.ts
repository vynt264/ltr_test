import { BacklistService } from "./backlist.service";
import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";

@Injectable()
export class BacklistGuard implements CanActivate {
  constructor(private backListService: BacklistService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (request?.user) {
      const { id } = request.user;
      const acToken = request
        ?.get("authorization")
        ?.replace("Bearer", "")
        .trim();
      const accepted = await this.backListService.getOneByToken(id, acToken);
      if (accepted) {
        throw new HttpException(
          {
            message: 'LoggedOnAnotherDevice',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    }

    return false;
  }
}
