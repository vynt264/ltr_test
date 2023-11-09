import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import appConfig from "../../../system/config.system/app.config";

export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig().atSecret,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      name: payload.username,
    };
  }
}
