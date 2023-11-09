import { JwtPayload } from "../../system/interfaces/index";
export interface JWTResult {
  access_token: string;
  refresh_token: string;
  user: JwtPayload;
}
