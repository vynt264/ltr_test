import { DeviceInterface } from "./../../system/interfaces/device.interface";
import { UserRoles } from "../../components/user/enums/user.enum";
import { ConnectService } from "../connect/connect.service";
import { ConectEnum } from "../connect/connect.enum";
import { CreateUserHistoryDto } from "../user.history/dto/create.dto";
import { UserHistoryService } from "../user.history/user.history.service";
import { BcryptSalt } from "../../system/constants/bcrypt.salt";
import { UserInterface } from "../../system/interfaces/user.interface";
import { JwtPayload } from "../../system/interfaces/jwt.payload.interface";
import { JWTResult } from "../../system/interfaces";
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { UserService } from "../user/user.service";
import { BacklistService } from "../backlist/backlist.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { CreateUserDto } from "../user/dto";
import appConfig from "../../system/config.system/app.config";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../user/user.entity";
import { Repository } from "typeorm";
import { ConfigSys } from "../../common/helper/config";
import { UserInfo } from "../user.info/user.info.entity";
import { CoinWallet } from "../coin.wallet/coin.wallet.entity";
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userService: UserService,
    private jwtService: JwtService,
    private backlistService: BacklistService,
    private readonly userHistoryService: UserHistoryService,
    private readonly connectService: ConnectService,
    @InjectRepository(UserInfo)
    private userInfoRepository: Repository<UserInfo>,
    @InjectRepository(CoinWallet)
    private coinWalletRepository: Repository<CoinWallet>,
  ) {}

  async validateUserCreds(username: string, password: string): Promise<any> {
    const user = await this.userService.getByUsername(username);

    if (!user) throw new BadRequestException(`Not found ${username}`);

    if (!(await bcrypt.compare(password, user.password)))
      throw new UnauthorizedException("Username or password not found!");

    return user;
  }

  async generateToken(
    user: UserInterface & DeviceInterface
  ): Promise<JWTResult> {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      isAuth: true,
      nickname: user.username,
    };

    let userHistoryDto = new CreateUserHistoryDto();
    userHistoryDto = {
      mac: user.mac,
      ip: user.ip,
      userId: user.id,
      action: ConectEnum.LOGIN,
      note: "",
    };

    await this.userHistoryService.create(userHistoryDto);

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: appConfig().atSecret,
        expiresIn: "1d",
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: appConfig().rtSecret,
        expiresIn: "7d",
      }),
    ]);
    await this.updateRtHash(user.id, rt);
    await this.updateBacklist(user.id, at);

    return {
      access_token: at,
      refresh_token: rt,
      user: jwtPayload,
    };
  }

  async guestgenerateToken(
    user: UserInterface & DeviceInterface
  ): Promise<JWTResult> {
    const userFInd = await this.userService.guestGetByUsername(
      user.username,
      user.usernameReal
    );
    user.id = userFInd.id;
    user.role = userFInd.role;

    const jwtPayload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      isAuth: userFInd.isAuth,
      nickname: user.username,
    };

    let userHistoryDto = new CreateUserHistoryDto();
    userHistoryDto = {
      mac: user.mac,
      ip: user.ip,
      userId: user.id,
      action: ConectEnum.LOGIN,
      note: "",
    };

    await this.userHistoryService.create(userHistoryDto);

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: appConfig().atSecret,
        expiresIn: "1d",
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: appConfig().rtSecret,
        expiresIn: "7d",
      }),
    ]);
    await this.updateRtHash(user.id, rt);
    await this.updateBacklist(user.id, at);

    return {
      access_token: at,
      refresh_token: rt,
      user: jwtPayload,
    };
  }

  async updateBacklist(userId: number, acToken: string): Promise<void> {
    const backlist = await this.backlistService.getByUserId(userId);
    if (backlist.length > 0) {
      for (const index in backlist) {
        const foundBacklist = {
          ...backlist[index],
          status: 0,
        };
        await this.backlistService.update(foundBacklist);
      }
    }

    await this.backlistService.create({
      userId,
      acToken,
      status: 1,
    });
  }

  async register(createDto: CreateUserDto) {
    const createdUser = await this.userService.create(createDto);
    const { password, ...rest } = createdUser;

    return rest;
  }

  async updateRtHash(userId: number, rt: string): Promise<void> {
    let hashedRt = "";
    if (rt) {
      const salt = await bcrypt.genSalt(BcryptSalt.SALT_ROUND);
      hashedRt = await bcrypt.hash(rt, salt);
    }

    await this.userService.update(userId, null, { hashedRt });
  }

  async refreshTokens(userId: number, rt: string): Promise<JWTResult> {
    const user = await this.userService.getOneById(userId);

    if (!user?.result || !user?.result?.hashedRt)
      throw new ForbiddenException("Access Denied");
    const rtMatches = await bcrypt.compare(rt, user?.result?.hashedRt);

    if (!rtMatches) throw new ForbiddenException("Access Denied");

    const tokens = await this.generateToken(user.result);

    return tokens;
  }

  async logout(userId: number, acToken: string): Promise<boolean> {
    await this.updateRtHash(userId, null);
    await this.backlistService.update({ userId, acToken, status: 0 });
    return true;
  }

  async isNotAdmin(username: string, sign: string, isFake: boolean) {
    if (!isFake) await this.connectService.logIn(username, sign);
    const passwordDf = ConfigSys.config().password;
    return this.checkUser(username, passwordDf);
  }

  async checkUser(username: string, password: string) {
    let user = await this.userService.getByUsername(username);

    if (user && !user?.role.includes(UserRoles.MEMBER)) {
      throw new ForbiddenException("Access Denied");
    }

    if (!user) {
      const createUser = {
        username,
        role: UserRoles.MEMBER,
        password,
      };
      const createdUser = await this.userRepository.create(createUser);
      user = await this.userRepository.save(createdUser);
      await this.userService.createWallet(user);
      const userInfoDt: any = {
        avatar: null,
        nickname: username,
        user: { id: user.id },
        sumBet: 0,
        sumOrder: 0,
        sumOrderWin: 0,
        sumOrderLose: 0,
        favoriteGame: null,
      }
      const userInfoCreate = await this.userInfoRepository.create(userInfoDt);
      await this.userInfoRepository.save(userInfoCreate);
      const coinWalletDto: any = {
        user: { id: user.id },
        balance: 0,
      }
      const coinWalletCreate = await this.coinWalletRepository.create(
        coinWalletDto
      );
      await this.coinWalletRepository.save(coinWalletCreate);
    }

    return user
  }

  async valiRole(username: string, isAdmin = false) {
    const user = await this.userService.getByUsername(username, isAdmin);

    if (!user) throw new BadRequestException(`Not found ${username}`);

    if (user?.role.includes(UserRoles.MEMBER)) {
      throw new ForbiddenException("Access Denied");
    }

    return user;
  }
}
