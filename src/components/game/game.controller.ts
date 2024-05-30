import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "../../system/interfaces";
import { GameService } from "./game.service";
import { Game } from "./game.entity";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RolesGuard } from "../admin/guards/roles.guard";

@Controller("/api/v1/game")
@ApiTags("Game")
@UseGuards(AuthGuard, RolesGuard)
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

}