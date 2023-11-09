import { JwtPayload } from "./jwt.payload.interface";
export interface JwtRtPayload extends JwtPayload {
  refreshToken: string;
}
