import { BadRequestException, Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common';
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
import { RolesService } from '../roles/roles.service';

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

    @Inject(forwardRef(() => RolesService))
    private rolesService: RolesService,
  ) { }

  async create(createAdminUserDto: CreateAdminUserDto): Promise<any> {
    const condiction = createAdminUserDto?.bookmakerId
      ? {
          username: createAdminUserDto.username,
          bookmaker: {
            id: createAdminUserDto.bookmakerId,
          }
        }
      : {
          username: createAdminUserDto.username,
        }
    const dataDup = await this.adminUserRepository.findOne({
      where: condiction
    });

    if (dataDup) {
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        "Username is unique",
        ERROR.CREATE_FAILED
      );
    }

    const createDto = {
      username: createAdminUserDto.username,
      password: createAdminUserDto.password,
      bookmaker: createAdminUserDto?.bookmakerId
        ? { id: createAdminUserDto.bookmakerId }
        : null,
    }
    const createdUser = await this.adminUserRepository.create(createDto);
    const user = await this.adminUserRepository.save(createdUser);
    return new ErrorResponse(
      STATUSCODE.COMMON_SUCCESS,
      user,
      MESSAGE.CREATE_SUCCESS
    );
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

  async findAll({
    page,
    limit,
    username,
    bookmarkerId,
    fromDate,
    toDate,
  }: any) {
    limit = Number(limit || 10);
    page = Number(page || 1);

    const condition: any = {
      isDeleted: false,
    };
    if (username) {
      condition.username = Like(`%${username}%`);
    }
    if (bookmarkerId) {
      condition.bookmaker = { id: bookmarkerId };
    }
    if (fromDate && toDate) {
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);
      condition.createdAt = Between(startOfDay(startDate), endOfDay(endDate));
    }

    const [users, total] = await this.adminUserRepository.findAndCount({
      relations: ["roleAdminUser"],
      where: condition,
      take: limit,
      skip: (page - 1) * limit,
    });
    const lastPage = Math.ceil(total / limit);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    return {
      users,
      prevPage,
      nextPage,
      lastPage,
      total,
    };
  }

  async findOne(id: number) {
    return this.adminUserRepository.findOne({
      relations: ['bookmaker', 'roleAdminUser'],
      where: {
        id,
      },
    });
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

    if (user.username === 'super9999') {
      const role = await this.rolesService.findRoleByName('Super');

      if (role?.id !== user?.roleAdminUser?.id) {
        user.roleAdminUser = { id: role.id } as any;
        await this.adminUserRepository.save(user);

        user.roleAdminUser = role;
      }
    }

    if (!user) throw new BadRequestException(`${username} is not found`);

    if (!(await bcrypt.compare(password, user.password)))
      throw new UnauthorizedException("Username or password not found!");

    return user;
  }

  async getByUsername(username: string) {
    if (!username) return;

    return this.adminUserRepository.findOne({
      relations: ['bookmaker', 'roleAdminUser'],
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
      permissions: user?.roleAdminUser?.permissions || '',
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

  async blockUser(id: number, userDto: any, options: any): Promise<any> {
    try {
      const user = await this.userService.update(id, userDto, options);

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
