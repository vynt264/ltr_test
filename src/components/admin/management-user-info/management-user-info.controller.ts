import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, UsePipes, UseGuards } from '@nestjs/common';
import { ManagementUserInfoService } from './management-user-info.service';
import { CreateManagementUserInfoDto } from './dto/create-management-user-info.dto';
import { UpdateUserInfoDto } from 'src/components/user.info/dto';
import { AuthAdminGuard } from 'src/components/auth/guards/auth-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from 'src/components/auth/roles.guard/roles.decorator';
import { RIGHTS } from 'src/system/constants/rights';

@Controller('api/v1/management-user-info')
@UseGuards(AuthAdminGuard, RolesGuard)
export class ManagementUserInfoController {
  constructor(private readonly managementUserInfoService: ManagementUserInfoService) { }

  @Post()
  create(@Body() createManagementUserInfoDto: CreateManagementUserInfoDto) {
    return this.managementUserInfoService.create(createManagementUserInfoDto);
  }

  @Get()
  findAll() {
    return this.managementUserInfoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.managementUserInfoService.findOne(+id);
  }

  @Patch(':id')
  @UsePipes(ValidationPipe)
  @Roles(RIGHTS.ChangeNickNameUserPlayGame)
  update(@Param('id') id: string, @Body() updateManagementUserInfoDto: UpdateUserInfoDto) {
    return this.managementUserInfoService.update(+id, updateManagementUserInfoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.managementUserInfoService.remove(+id);
  }
}
