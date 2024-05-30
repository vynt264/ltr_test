import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "../../system/interfaces";
import { SysLayoutService } from "./sys.layout.service";
import { SysLayout } from "./sys.layout.entity";
import { RolesGuard } from "../admin/guards/roles.guard";
import { AuthGuard } from "../auth/guards/auth.guard";

@UseGuards(AuthGuard, RolesGuard)
@Controller("/api/v1/sysLayout")
@ApiTags("SysLayout")
export class SysLayoutController {
  constructor(private sysLayoutService: SysLayoutService) {}

  @Get("all")
  @ApiOperation({
    description: "Get all SysLayout",
  })
  @ApiOkResponse({
    type: Response<SysLayout[]>,
  })
  async GetAll(): Promise<any> {
    return this.sysLayoutService.getAll();
  }
}
