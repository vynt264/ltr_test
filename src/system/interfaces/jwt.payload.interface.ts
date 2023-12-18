export interface JwtPayload {
  username: string;
  sub: number;
  role: string;
  isAuth: boolean;
  nickname: string;
  bookmarkId: number;
}
