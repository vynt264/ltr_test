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
  import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
  import { Roles } from "../auth/roles.guard/roles.decorator";
  import { RolesGuard } from "../auth/roles.guard/roles.guard";
  import { BacklistGuard } from "../backlist/backlist.guard";
  import { GameService } from "./game.service";
  import { PaginationQueryDto } from "./../../common/common.dto/pagination.query.dto";
  import {
    CreateGameDto,
    UpdateGameDto
  } from "./dto/index";
  import { UserRoles } from "../user/enums/user.enum";
  import { Game } from "./game.entity";
  import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { AuthGuard } from "../auth/guards/auth.guard";
import { AuthAdminGuard } from "../auth/guards/auth-admin.guard";
  @Controller("/api/v1/game")
  @ApiTags("Game")
  export class GameController {
    constructor(private gameService: GameService) { }
  
    @Get("all")
    @ApiOperation({
      description: "Get all game",
    })
    @ApiOkResponse({
      type: Response<Game[]>,
    })
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
    @UseGuards(AuthAdminGuard)
    @Roles(UserRoles.SUPPER)
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
    @UseGuards(AuthAdminGuard)
    @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS)
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
    @UseGuards(AuthAdminGuard)
    @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS)
    async delete(@Param("id") id: number): Promise<any> {
      return this.gameService.delete(id);
    }
  }