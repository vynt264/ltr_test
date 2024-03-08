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
  HttpException,
  HttpStatus,
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
import { WalletHandlerService } from "../wallet-handler/wallet-handler.service";
import { OrderHelper } from "src/common/helper";
import { RedisCacheService } from "src/system/redis/redis.service";
import { WalletInout } from "../wallet.inout/wallet.inout.entity";
import { WalletHistory } from "../wallet/wallet.history.entity";
import { TokensService } from "../tokens/tokens.service";
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userService: UserService,
    private jwtService: JwtService,
    private backlistService: BacklistService,
    private readonly redisService: RedisCacheService,
    private readonly userHistoryService: UserHistoryService,
    private readonly connectService: ConnectService,
    private readonly walletHandlerService: WalletHandlerService,
    @InjectRepository(UserInfo)
    private userInfoRepository: Repository<UserInfo>,
    @InjectRepository(CoinWallet)
    private coinWalletRepository: Repository<CoinWallet>,
    @InjectRepository(WalletInout)
    private walletInoutRepository: Repository<WalletInout>,
    @InjectRepository(WalletHistory)
    private walletHistoryRepository: Repository<WalletHistory>,
    private readonly tokenService: TokensService,
  ) { }

  async validateUserCreds(username: string, password: string): Promise<any> {
    const user = await this.userService.getByUsername(username);

    if (!user) throw new BadRequestException(`Not found ${username}`);

    if (!(await bcrypt.compare(password, user.password)))
      throw new UnauthorizedException("Username or password not found!");

    return user;
  }

  async generateToken(
    // user: UserInterface & DeviceInterface
    user: any,
  ): Promise<JWTResult> {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      isAuth: true,
      nickname: user.username,
      bookmakerId: user?.bookmakerId || 1,
      usernameReal: user?.usernameReal || '',
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

  // async checkDevice(devide: string, isTestPlayer: boolean, user: any, at: string) {
  //   let validToken = false;
  //   if (devide) {
  //     const token = await this.tokenService.findTokenByUserId(user.id, isTestPlayer);
  //     if (!token) {
  //       await this.tokenService.create({
  //         user: { id: user.id } as any,
  //         token: at,
  //         devide,
  //         isTestPlayer,
  //       });
  //     } else {
  //       if (token.devide !== devide) {
  //         try {
  //           await this.jwtService.verifyAsync(
  //             token.token,
  //             {
  //               secret: appConfig().atSecret
  //             }
  //           );

  //           validToken = true;
  //         } catch (error) {
  //           if (error.name === "TokenExpiredError") {

  //           }
  //         }
  //       }
  //     }
  //   }

  //   if (validToken) {
  //     throw new HttpException(
  //       {
  //         message: 'tk da duoc dang nhap mot noi khac',
  //       },
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  // }

  async guestGenerateToken(
    user: UserInterface & DeviceInterface,
    bookmakerId: any
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
      bookmakerId: userFInd?.bookmaker?.id || 1,
      usernameReal: user.usernameReal,
      id: user.id.toString(),
    };

    await this.saveUserIdIntoRedis(jwtPayload);

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

  async refreshToken(refreshToken: string) {
    const res = await this.jwtService.verify(refreshToken, {
      secret: appConfig().rtSecret,
    });

    const user = await this.userService.getOneById(res.sub);

    const tokens = await this.generateToken(user.result);

    return tokens;
  }

  async logout(userId: number, acToken: string): Promise<boolean> {
    await this.updateRtHash(userId, null);
    await this.backlistService.update({ userId, acToken, status: 0 });
    return true;
  }

  async userLoginNew(username: string) {
    const passwordDf = ConfigSys.config().password;
    const user = await this.checkUser(username, passwordDf);
    const infoGenerateToken = {
      ... {
        id: user.id,
        isAuth: user.isAuth,
        password: user.password,
        username: user.username,
        role: user.role,
        bookmakerId: user?.bookmaker?.id || 1,
        usernameReal: user?.usernameReal,
      },
      username,
    };

    await this.saveUserIdIntoRedis(infoGenerateToken);

    return infoGenerateToken;
  }

  async userLogin(username: string, sign: string) {
    const passwordDf = ConfigSys.config().password;
    const user = await this.checkUser(username, passwordDf);
    const infoGenerateToken = {
      ... {
        id: user.id,
        isAuth: user.isAuth,
        password: user.password,
        username: user.username,
        role: user.role,
        bookmakerId: user?.bookmaker?.id || 1,
        usernameReal: user?.usernameReal,
      },
      username,
    };

    await this.saveUserIdIntoRedis(infoGenerateToken);

    return infoGenerateToken;
  }

  async isNotAdmin(username: string, sign: string) {
    // if (!isFake) await this.connectService.logIn(username, sign);
    const passwordDf = ConfigSys.config().password;
    return this.checkUser(username, passwordDf);
  }

  async checkUser(username: string, password: string) {
    let user = await this.userService.getByUsername(username);

    if (user && !user?.role.includes(UserRoles.MEMBER)) {
      throw new ForbiddenException("Access Denied");
    }

    if (user && user.isBlocked) {
      throw new ForbiddenException("User is blocked");
    }

    let wallet, walletInout;
    if (user) {
      wallet = await this.walletHandlerService.findWalletByUserId(user.id);
      walletInout = await this.walletInoutRepository.findBy({
        user: { id: user.id }
      });
      const userUp = {
        ...user,
        updatedAt: new Date(),
      };
      await this.userRepository.save(userUp);
    }
    if (user && !wallet) {
      await this.walletHandlerService.create({
        user: {
          id: user.id
        } as any,
        balance: 30000000,
        createdBy: user?.username,
      });
    }

    if (user && walletInout?.length === 0) {
      const walletInoutCreate = {
        user: { id: user.id },
        balanceIn: wallet?.balance ? wallet?.balance : 30000000,
        balanceOut: 0,
        timeIn: new Date(),
        createdBy: user.username,
      }
      const createtedWalletInout = await this.walletInoutRepository.create(walletInoutCreate);
      await this.walletInoutRepository.save(createtedWalletInout);
    } else if (wallet) {
      const walletInoutUp = {
        ...walletInout[walletInout?.length - 1],
        balanceOut: wallet?.balance,
        updatedBy: user.username,
        timeOut: walletInout[walletInout?.length - 1].createdAt
      }
      await this.walletInoutRepository.save(walletInoutUp);

      const walletInoutCreate = {
        user: { id: user.id },
        balanceIn: wallet?.balance,
        balanceOut: 0,
        timeIn: new Date(),
        createdBy: user.username,
      }
      const createtedWalletInout = await this.walletInoutRepository.create(walletInoutCreate);
      await this.walletInoutRepository.save(createtedWalletInout);
    }

    if (!user) {
      const createUser = {
        username,
        role: UserRoles.MEMBER,
        password,
        bookmaker: { id: 1 },
      };
      const createdUser = await this.userRepository.create(createUser);
      user = await this.userRepository.save(createdUser);
      const walletCreate = await this.walletHandlerService.create({
        user: {
          id: user.id
        } as any,
        balance: 30000000,
        createdBy: user?.username,
      });
      const walletHis = {
        ...walletCreate,
        detail: "Tạo mới ví",
      }
      await this.walletHistoryRepository.save(walletHis);
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
      const walletInoutCreate = {
        user: { id: user.id },
        balanceIn: 30000000,
        balanceOut: 0,
        timeIn: new Date(),
        createdBy: user.username,
      }
      const createtedWalletInout = await this.walletInoutRepository.create(walletInoutCreate);
      await this.walletInoutRepository.save(createtedWalletInout);
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

  async adminLogin(username: string, password: string) {
    const user = await this.userService.getByUsername(username);

    if (!user) throw new BadRequestException(`${username} is not found`);

    return user;
  }

  async deleteBacklist() {
    await this.backlistService.deleteBacklist();
  }

  async saveUserIdIntoRedis(infoGenerateToken: any) {
    let key = OrderHelper.getKeySaveUserIdsByBookmaker(infoGenerateToken?.bookmakerId.toString());
    if (infoGenerateToken.usernameReal) {
      key = OrderHelper.getKeySaveUserIdsFakeByBookmaker(infoGenerateToken?.bookmakerId.toString());
    }

    let hasUserId = false;
    const userIds = await this.redisService.hgetall(`${key}`);
    for (const key in userIds) {
      if (key.toString() === infoGenerateToken.id.toString()) {
        hasUserId = true;
        break;
      }
    }

    if (hasUserId) return;

    return await this.redisService.hset(`${key}`, `${infoGenerateToken.id.toString()}`, JSON.stringify(infoGenerateToken.username));
  }
}
