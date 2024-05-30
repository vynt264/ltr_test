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
import { Response } from "../../../system/interfaces";
import { Roles } from "src/components/auth/roles.guard/roles.decorator";
import { AdminGameService } from "./admin.game.service";
import { CreateGameDto, UpdateGameDto } from "./dto/index";
import { Game } from "./game.entity";
import { AuthAdminGuard } from "../../auth/guards/auth-admin.guard";
import { RolesGuard } from "../../admin/guards/roles.guard";
import { RIGHTS } from "src/system/constants/rights";

@Controller("/api/v1/admin-game")
@ApiTags("AdminGame")
@UseGuards(AuthAdminGuard, RolesGuard)
export class AdminGameController {
  constructor(private adminGameService: AdminGameService) { }

  @Get("all")
  @ApiOperation({
    description: "Get all game",
  })
  @ApiOkResponse({
    type: Response<Game[]>,
  })
  @Roles(RIGHTS.ShowSettingLayout)
  async GetAll(): Promise<any> {
    return this.adminGameService.getAll();
  }

  @Post("create")
  @ApiOperation({
    description: "Create game",
  })
  @ApiOkResponse({
    type: Response<Game>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthAdminGuard, RolesGuard)
  @Roles(RIGHTS.EditSettingLayout)
  async create(@Body() userDto: CreateGameDto): Promise<any> {
    return this.adminGameService.create(userDto);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update game",
  })
  @ApiOkResponse({
    type: Response<Game>,
  })
  @UsePipes(ValidationPipe)
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthAdminGuard, RolesGuard)
  @Roles(RIGHTS.EditSettingLayout)
  async updateGame(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateGameDto
  ): Promise<any> {
    return this.adminGameService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete game",
  })
  @ApiBearerAuth("Authorization")
  async delete(@Param("id") id: number): Promise<any> {
    return this.adminGameService.delete(id);
  }
}