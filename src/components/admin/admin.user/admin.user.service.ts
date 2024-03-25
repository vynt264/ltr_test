import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAdminUserDto } from './dto/create-admin.user.dto';
import { UpdateAdminUserDto } from './dto/update-admin.user.dto';
import { AdminUser } from './entities/admin.user.entity';
import { Between, Like, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JWTResult, JwtPayload } from 'src/system/interfaces';
import { JwtService } from "@nestjs/jwt";
import appConfig from 'src/system/config.system/app.config';
import { ErrorResponse, SuccessResponse } from 'src/system/BaseResponse';
import { ERROR, MESSAGE, STATUSCODE } from 'src/system/constants';
import { PaginationQueryDto } from 'src/common/common.dto';
import { endOfDay, startOfDay } from 'date-fns';
import { UserService } from 'src/components/user/user.service';
import * as bcrypt from "bcrypt";

@Injectable()
export class AdminUserService {
  private username = "username";

  private role = "role";

  private nickname = "nickname";

  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    private jwtService: JwtService,
    private userService: UserService,
  ) { }

  create(createAdminUserDto: CreateAdminUserDto) {
    return this.adminUserRepository.save(createAdminUserDto);
  }

  async getAll(paginationQuery: PaginationQueryDto): Promise<any> {
    try {
      const object: any = JSON.parse(paginationQuery.keyword);
      if (object.role === "member") {
        return this.userService.getAll(paginationQuery);
      }

      const users = await this.searchByUser(paginationQuery, object);
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        users,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async searchByUser(paginationQuery: PaginationQueryDto, user: any) {
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    const searching = await this.adminUserRepository.findAndCount({
      relations: ["bookmaker"],
      select: {
        id: true,
        username: true,
        createdAt: true,
        role: true,
        password: true,
        bookmaker: {
          id: true,
          name: true,
        },
      },
      where: this.holdQuery(user),
      take: +perPage,
      skip,
      order: { createdAt: paginationQuery.order },
    });

    return searching;
  }

  holdQuery(object: any) {
    const data: any = {};
    // data.role = Like(`${UserRoles.MEMBER}`);
    // data.usernameReal = "";
    if (!object) {
      return data;
    }

    for (const key in object) {
      switch (key) {
        case this.username:
          data.username = Like(`%${object.username}%`);
          break;
        case this.role:
          data.role = Like(`%${object.role}%`);
          break;
        // case this.nickname:
        //   data.userInfo = { nickname: Like(`%${object.nickname}%`) }
        default:
          break;
      }

      if (key === "startDate" || key === "endDate") {
        const startDate = new Date(object.startDate);
        const endDate = new Date(object.endDate);
        data.createdAt = Between(startOfDay(startDate), endOfDay(endDate));
      }

      if (key === "bookmakerId") {
        data.bookmaker = { id: object.bookmakerId }
      }

      if (key == "isTestPlayer") {
        data.usernameReal = object.isTestPlayer ? Not("") : "";
      }
    }

    return [data];
  }

  findAll() {
    return `This action returns all adminUser`;
  }

  findOne(id: number) {
    return `This action returns a #${id} adminUser`;
  }

  async update(
    id: number,
    userDto: any,
    ...options: any
  ): Promise<any> {
    const firstItem = options.find((x: any) => x !== undefined);
    try {
      let foundUser = await this.adminUserRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `User with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (userDto) {
        foundUser = {
          ...foundUser,
          ...userDto,
          updatedAt: new Date(),
          hashPassword: null,
        };
      }

      if (options) {
        foundUser = {
          ...foundUser,
          ...firstItem,
          updatedAt: new Date(),
          hashPassword: null,
        };
      }
      await this.adminUserRepository.save(foundUser);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
  }

  async remove(id: number) {
    try {
      const foundUser = await this.adminUserRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `User with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.adminUserRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `User has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }

  async login(username: string, password: string) {
    const user = await this.getByUsername(username);

    if (!user) throw new BadRequestException(`${username} is not found`);

    if (!(await bcrypt.compare(password, user.password)))
    throw new UnauthorizedException("Username or password not found!");

    return user;
  }

  async getByUsername(username: string) {
    return this.adminUserRepository.findOne({
      relations: ['bookmaker'],
      where: {
        username,
      },
    });
  }

  async generateToken(
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

    return {
      access_token: at,
      refresh_token: rt,
      user: jwtPayload,
    };
  }

  async getOneById(id = 0): Promise<any> {
    try {
      const user = await this.adminUserRepository.findOneBy({ id });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        user,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }
}
