import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Query, ParseIntPipe, UsePipes, ValidationPipe } from '@nestjs/common';
import { AdminUserService } from './admin.user.service';
import { CreateAdminUserDto } from './dto/create-admin.user.dto';
import { UpdateAdminUserDto } from './dto/update-admin.user.dto';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AdminUser } from './entities/admin.user.entity';
import { JWTResult } from 'src/system/interfaces';
import { AuthAdminGuard } from 'src/components/auth/guards/auth-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { UserRoles } from 'src/components/user/enums/user.enum';
import { PaginationQueryDto } from 'src/common/common.dto';
import BlockUserDto from './dto/block.dto';

@Controller('api/v1/admin-users')
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) { }

  @Post('register')
  @UseGuards(AuthAdminGuard)
  async register(@Body() createAdminUserDto: CreateAdminUserDto, @Request() req: any,) {
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
  // @UseGuards(AuthAdminGuard, RolesGuard)
  @UseGuards(AuthAdminGuard)
  // @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER, UserRoles.ADMINISTRATORS, UserRoles.ADMINISTRATORS_BOOKMAKER)
  async GetAll(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    return this.adminUserService.getAll(paginationQuery);
  }

  @Patch(":id/role")
  @ApiOperation({
    description: "Update user",
  })
  // @ApiOkResponse({
  //   type: Response<User>,
  // })
  @UsePipes(ValidationPipe)
  // @UseGuards(AuthAdminGuard, RolesGuard)
  @UseGuards(AuthAdminGuard)
  // @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER)
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
  // @UseGuards(AuthAdminGuard, RolesGuard)
  // @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER)
  async blockUser(
    @Param("id", ParseIntPipe) id: number,
    @Body() blockDto: BlockUserDto
  ): Promise<any> {
    return this.adminUserService.blockUser(id, null, blockDto);
  }

  @Get()
  findAll(@Query() paginationQuery: any) {
    return this.adminUserService.findAll(paginationQuery);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminUserService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminUserDto: UpdateAdminUserDto) {
    return this.adminUserService.update(+id, updateAdminUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminUserService.remove(+id);
  }
}
