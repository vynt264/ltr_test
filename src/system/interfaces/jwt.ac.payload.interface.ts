import { JwtPayload } from "./jwt.payload.interface";
export interface JwtAcPayload extends JwtPayload {
  accessToken: string;
}
