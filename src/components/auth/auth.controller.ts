import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { GetCurrentUser, GetCurrentUserId } from "../../common/decorators";
import { DeviceInterface, JWTResult, Response, UserInterface } from "../../system/interfaces";
import { GetCurrentToken } from "../backlist/get-current-token.decorator";
import { CreateUserDto } from "../user/dto";
import { User } from "../user/user.entity";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt/jwt-auth.guard";
import { RateLimitGuard } from "./rate.guard/rate.limit.guard";
import { RtAuthGuard } from "./rt/jwt-auth.guard";
import { genRandom } from "../sys.config/enums/sys.config.enum";
import { Roles } from "./roles.guard/roles.decorator";
import { RolesGuard } from "./roles.guard/roles.guard";
import { UserRoles } from "../user/enums/user.enum";
import { CreateUserFakeDto } from "./dto/createUserFake";

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
    const { ip, mac, is_admin: isAdmin, username, sign } = loginDto;
    let user;
    if (isAdmin) {
      user = await this.authService.valiRole(username, isAdmin);
    } else {
      user = await this.authService.isNotAdmin(username, sign);
    }
    
    user = {
      ...user,
      ip,
      mac,
      username,
    }

    return this.authService.generateToken(user);
  }

  @Post("guest-login")
  // @UseGuards(LocalAuthGuard)
  @ApiOperation({
    description:
      "In general, logon is the procedure used to get access to an operating system or application.",
  })
  @ApiOkResponse({
    type: Response<JWTResult>,
  })
  async guestLogin(
    @Body() createUserFakeDto: CreateUserFakeDto
  ): Promise<JWTResult> {
    const salt = genRandom(1000, 9999)
    const username = `88${new Date().getTime()}${salt}`;
    const user: UserInterface & DeviceInterface = {
      username,
      // password: process.env.USER_PASSWORD,
      mac: '',
      ip: '',
      role: `${UserRoles.MEMBER}`,
      id: null,
      usernameReal: createUserFakeDto?.usernameReal
    };
    return this.authService.guestgenerateToken(user);
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
