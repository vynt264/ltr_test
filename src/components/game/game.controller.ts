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
import { GameService } from "./game.service";
import {
  CreateGameDto,
  UpdateGameDto
} from "./dto/index";
import { UserRoles } from "../user/enums/user.enum";
import { Game } from "./game.entity";
import { AuthAdminGuard } from "../auth/guards/auth-admin.guard";
import { RolesGuard } from "../admin/guards/roles.guard";
import { RIGHTS } from "src/system/constants/rights";

@Controller("/api/v1/game")
@ApiTags("Game")
@UseGuards(AuthAdminGuard, RolesGuard)
export class GameController {
  constructor(private gameService: GameService) { }

  @Get("all")
  @ApiOperation({
    description: "Get all game",
  })
  @ApiOkResponse({
    type: Response<Game[]>,
  })
  @Roles(RIGHTS.ShowSettingLayout)
  async GetAll(): Promise<any> {
    return this.gameService.getAll();
  }

  @Post("create")
  @ApiOperation({
    description: "Create game",
  })
  @ApiOkResponse({
    type: Response<Game>,
  })
  @ApiBearerAuth("Authorization")
  @Roles(RIGHTS.EditSettingLayout)
  async create(@Body() userDto: CreateGameDto): Promise<any> {
    return this.gameService.create(userDto);
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
  @Roles(RIGHTS.EditSettingLayout)
  async updateGame(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateGameDto
  ): Promise<any> {
    return this.gameService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete game",
  })
  @ApiBearerAuth("Authorization")
  async delete(@Param("id") id: number): Promise<any> {
    return this.gameService.delete(id);
  }
}