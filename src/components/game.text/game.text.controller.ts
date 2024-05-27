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
import { GameTextService } from "./game.text.service";
import {
  CreateGameTextDto,
  UpdateGameTextDto
} from "./dto/index";
import { GameText } from "./game.text.entity";
import { AuthAdminGuard } from "../auth/guards/auth-admin.guard";
import { RolesGuard } from "../admin/guards/roles.guard";
import { RIGHTS } from "src/system/constants/rights";

@Controller("/api/v1/gameText")
@ApiTags("GameText")
@UseGuards(AuthAdminGuard, RolesGuard)
export class GameTextController {
  constructor(private gameTextService: GameTextService) { }

  @Get("all")
  @ApiOperation({
    description: "Get all GameText",
  })
  @ApiOkResponse({
    type: Response<GameText[]>,
  })
  @Roles(RIGHTS.ShowSettingGameText)
  async GetAll(): Promise<any> {
    return this.gameTextService.getAll();
  }

  @Get(":childBetType")
  @ApiOperation({
    description: "Get GameText by childBetType",
  })
  @ApiOkResponse({
    type: Response<GameText[]>,
  })
  async GetByChildBetType(@Param("childBetType") childBetType: string): Promise<any> {
    return this.gameTextService.getByChildBetType(childBetType);
  }

  @Get("tutorial/:betType")
  @ApiOperation({
    description: "Get GameText by betType",
  })
  @ApiOkResponse({
    type: Response<GameText[]>,
  })
  async GetByBetType(@Param("betType") betType: string): Promise<any> {
    return this.gameTextService.getTutorial(betType);
  }

  @Post("create")
  @ApiOperation({
    description: "Create GameText",
  })
  @ApiOkResponse({
    type: Response<GameText>,
  })
  @ApiBearerAuth("Authorization")
  async create(@Body() userDto: CreateGameTextDto): Promise<any> {
    return this.gameTextService.create(userDto);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update GameText",
  })
  @ApiOkResponse({
    type: Response<GameText>,
  })
  @UsePipes(ValidationPipe)
  @ApiBearerAuth("Authorization")
  @Roles(RIGHTS.EditSettingGameText)
  async updateGameText(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateGameTextDto
  ): Promise<any> {
    return this.gameTextService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete GameText",
  })
  @ApiBearerAuth("Authorization")
  async delete(@Param("id") id: number): Promise<any> {
    return this.gameTextService.delete(id);
  }
}