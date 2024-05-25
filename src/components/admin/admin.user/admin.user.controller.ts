import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { Logger } from 'winston';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { AdminUserService } from './admin.user.service';
import { CreateAdminUserDto } from './dto/create-admin.user.dto';
import { UpdateAdminUserDto } from './dto/update-admin.user.dto';
import { JWTResult } from 'src/system/interfaces';
import { AuthAdminGuard } from 'src/components/auth/guards/auth-admin.guard';
import { PaginationQueryDto } from 'src/common/common.dto';
import BlockUserDto from './dto/block.dto';
import { RIGHTS } from 'src/system/constants/rights';
import { Roles } from 'src/components/auth/roles.guard/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

@Controller('api/v1/admin-users')
export class AdminUserController {
  constructor(
    private readonly adminUserService: AdminUserService,

    @Inject("winston")
    private readonly logger: Logger,
  ) { }

  @Post('register')
  @UseGuards(AuthAdminGuard, RolesGuard)
  @Roles(RIGHTS.CreateAdminUser)
  async register(@Body() createAdminUserDto: CreateAdminUserDto, @Request() req: any) {
    // const createdUser = await this.adminUserService.create(createAdminUserDto);
    // const { password, ...rest } = createdUser;

    return this.adminUserService.create(createAdminUserDto, req.user);
  }

  @Post('login')
  async adminLogin(
    @Request() req: any,
    @Body() loginDto: any,
  ): Promise<JWTResult> {
    const {
      password,
      username,
    } = loginDto;
    const user = await this.adminUserService.login(username, password);

    return this.adminUserService.generateToken(user);
  }

  @Get("all")
  @ApiOperation({
    description: "Get all user",
  })
  @UseGuards(AuthAdminGuard)
  async GetAll(@Query() paginationQuery: PaginationQueryDto, @Request() req: any): Promise<any> {
    try {
      return this.adminUserService.getAll(paginationQuery, req.user);
    } catch (error) {
      this.logger.error(`${AdminUserController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Patch(":id/role")
  @ApiOperation({
    description: "Update user",
  })
  // @ApiOkResponse({
  //   type: Response<User>,
  // })
  @UsePipes(ValidationPipe)
  @UseGuards(AuthAdminGuard)
  async updateRole(
    @Param("id", ParseIntPipe) id: number,
    @Body() roleDto: any
  ): Promise<any> {
    return this.adminUserService.update(id, null, roleDto);
  }

  @Patch(":id/block")
  @ApiOperation({
    description: "Block user",
  })
  @UsePipes(ValidationPipe)
  @UseGuards(AuthAdminGuard)
  async blockUser(
    @Param("id", ParseIntPipe) id: number,
    @Body() blockDto: BlockUserDto
  ): Promise<any> {
    return this.adminUserService.blockUser(id, null, blockDto);
  }

  @Get()
  @UseGuards(AuthAdminGuard, RolesGuard)
  @Roles(RIGHTS.ShowListAdminUsers)
  findAll(@Query() paginationQuery: any, @Request() req: any) {
    return this.adminUserService.findAll(paginationQuery, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminUserService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthAdminGuard, RolesGuard)
  @Roles(RIGHTS.EditAdminUser)
  update(@Param('id') id: string, @Body() updateAdminUserDto: UpdateAdminUserDto) {
    return this.adminUserService.update(+id, updateAdminUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthAdminGuard, RolesGuard)
  @Roles(RIGHTS.DeleteAdminUser)
  remove(@Param('id') id: string) {
    return this.adminUserService.remove(+id);
  }
}
