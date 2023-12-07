import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, "local") {
  constructor(private authService: AuthService) {
    super();
  }

  // TODO check login 2 lần
  async validate(username: string, password: string) {
    const user = await this.authService.validateUserCreds(username, password);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
