import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { GetCurrentUser, GetCurrentUserId } from "../../common/decorators";
import { JWTResult, Response } from "../../system/interfaces";
import { GetCurrentToken } from "../backlist/get-current-token.decorator";
import { CreateUserDto } from "../user/dto";
import { User } from "../user/user.entity";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt/jwt-auth.guard";
import { RateLimitGuard } from "./rate.guard/rate.limit.guard";
import { RtAuthGuard } from "./rt/jwt-auth.guard";

@ApiTags("Auth")
@Controller("api/v1/auth")
@UseGuards(RateLimitGuard)
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post("login")
  // @UseGuards(LocalAuthGuard)
  @ApiOperation({
    description:
      "In general, logon is the procedure used to get access to an operating system or application.",
  })
  @ApiOkResponse({
    type: Response<JWTResult>,
  })
  async login(
    @Request() req: any,
    @Body() loginDto: LoginDto
  ): Promise<JWTResult> {
    const { ip, mac, is_admin: isAdmin, username, isAuth } = loginDto;
    const user = {
      ...req.user,
      ip,
      mac,
      username,
    };

    if (isAdmin) {
      await this.authService.valiRole(username, isAdmin);
    } else if (isAuth) {
      await this.authService.isNotAdmin(username);
    } else {
      await this.authService.isNotAuth(username);
    }

    return this.authService.generateToken(user, isAuth);
  }

  @Post("register")
  @ApiOperation({
    description:
      "User Registration means entering User data into the System at Contact Points or through the Customer Zone. By registering, the User is given access to several additional features of the System.",
  })
  @ApiOkResponse({
    type: Response<User>,
  })
  async register(@Body() registerDto: CreateUserDto) {
    return this.authService.register(registerDto);
  }

  @Post("logout")
  @ApiBearerAuth("Authorization")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    description:
      "To exit a user account in a computer system, so that one is not recognized until signing in again.",
  })
  logout(
    @GetCurrentUserId() userId: number,
    @GetCurrentToken() acToken: string
  ): Promise<boolean> {
    return this.authService.logout(userId, acToken);
  }

  @Post("refresh")
  @ApiBearerAuth("Authorization")
  @UseGuards(RtAuthGuard)
  @ApiOperation({
    description:
      "When designing a web application, along with security authentication is one of the key parts. Authentication with tokens was a breakthrough in this regard, and the refresh token came to complement it and make it usable.",
  })
  refreshTokens(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser("refreshToken") refreshToken: string
  ): Promise<JWTResult> {
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
