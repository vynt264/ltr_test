import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AuthAdminGuard } from 'src/components/auth/guards/auth-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from 'src/components/auth/roles.guard/roles.decorator';
import { RIGHTS } from 'src/system/constants/rights';
import { Logger } from 'winston';

@Controller('api/v1/admin-roles')
@UseGuards(AuthAdminGuard, RolesGuard)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,

    @Inject("winston")
    private readonly logger: Logger,
  ) { }

  @Post()
  @Roles(RIGHTS.CreateRole)
  async create(@Body() createRoleDto: CreateRoleDto) {
    try {
      return await this.rolesService.create(createRoleDto);
    } catch (error) {
      this.logger.error(`${RolesController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Get()
  @Roles(RIGHTS.ShowListRoles)
  findAll(@Query() paginationQuery: any) {
    try {
      return this.rolesService.findAll(paginationQuery);
    } catch (error) {
      this.logger.error(`${RolesController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.rolesService.findOne(+id);
    } catch (error) {
      this.logger.error(`${RolesController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Patch(':id')
  @Roles(RIGHTS.EditRole)
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    try {
      return this.rolesService.update(+id, updateRoleDto);
    } catch (error) {
      this.logger.error(`${RolesController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Delete(':id')
  @Roles(RIGHTS.DeleteRole)
  remove(@Param('id') id: string) {
    try {
      return this.rolesService.remove(+id);
    } catch (error) {
      this.logger.error(`${RolesController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }
}
