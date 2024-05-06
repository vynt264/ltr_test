import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
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
import { Roles } from "../auth/roles.guard/roles.decorator";
import { QaService } from "./qa.service";
import { CreateQaDto, UpdateQaDto } from "./dto/index";
import { UserRoles } from "../user/enums/user.enum";
import { Qa } from "./qa.entity";
import { AuthAdminGuard } from "../auth/guards/auth-admin.guard";

@Controller("/api/v1/qa")
@ApiTags("Qa")
export class QaController {
  constructor(private qaService: QaService) {}

  @Get("all")
  @ApiOperation({
    description: "Get all QA",
  })
  @ApiOkResponse({
    type: Response<Qa[]>,
  })
  async GetAll(): Promise<any> {
    return this.qaService.getAll();
  }

  @Post("create")
  @ApiOperation({
    description: "Create Qa",
  })
  @ApiOkResponse({
    type: Response<Qa>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthAdminGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER, UserRoles.ADMINISTRATORS, UserRoles.ADMINISTRATORS_BOOKMAKER)
  async create(@Body() userDto: CreateQaDto): Promise<any> {
    return this.qaService.create(userDto);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update Qa",
  })
  @ApiOkResponse({
    type: Response<Qa>,
  })
  @UsePipes(ValidationPipe)
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthAdminGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER, UserRoles.ADMINISTRATORS, UserRoles.ADMINISTRATORS_BOOKMAKER)
  async updateCommon(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateQaDto,
    @Request() req: any
  ): Promise<any> {
    return this.qaService.update(id, updateDto, req.user);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete Qa",
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthAdminGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER, UserRoles.ADMINISTRATORS, UserRoles.ADMINISTRATORS_BOOKMAKER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.qaService.delete(id);
  }
}
