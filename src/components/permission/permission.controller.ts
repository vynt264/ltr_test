import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "../../system/interfaces";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { RolesGuard } from "../auth/roles.guard/roles.guard";
import { BacklistGuard } from "../backlist/backlist.guard";
import { UserRoles } from "../user/enums/user.enum";
import { CreatePermissionDto, UpdatePermissionDto } from "./dto/index";
import { Permission } from "./permission.entity";
import { PermissionService } from "./permission.service";
@Controller("/api/v1/permission")
@ApiTags("Permissions")
@ApiBearerAuth("Authorization")
@UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
@Roles(UserRoles.SUPPER)
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Post("create")
  @ApiOperation({
    description: "Create permission",
  })
  @ApiOkResponse({
    type: Response<Permission>,
  })
  async create(@Body() permissionDto: CreatePermissionDto): Promise<any> {
    return this.permissionService.create(permissionDto);
  }

  @Get("all")
  @ApiOperation({
    description: "Get all permission",
  })
  @ApiOkResponse({
    type: Response<Permission[]>,
  })
  async GetAll(): Promise<any> {
    return this.permissionService.getAll();
  }

  @Get(":id")
  @ApiOperation({
    description: "Get permission by id",
  })
  @ApiOkResponse({
    type: Response<Permission>,
  })
  async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
    return this.permissionService.getOneById(id);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update permission",
  })
  @ApiOkResponse({
    type: Response<Permission>,
  })
  @UsePipes(ValidationPipe)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() permissionDto: UpdatePermissionDto
  ): Promise<any> {
    return this.permissionService.update(id, permissionDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete permission",
  })
  async delete(@Param("id") id: number): Promise<any> {
    return this.permissionService.delete(id);
  }
}
