export interface JwtPayload {
  username: string;
  sub: number;
  role: string;
  isAuth: boolean;
  nickname: string;
  bookmakerId: number;
  usernameReal?: string;
  id?: string;
}
