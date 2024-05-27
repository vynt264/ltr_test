import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express/multer";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "../../system/interfaces";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { SysLayoutService } from "./sys.layout.service";
import { CreateSysLayoutDto, UpdateSysLayoutDto } from "./dto/index";
import { SysLayout } from "./sys.layout.entity";
import { AuthAdminGuard } from "../auth/guards/auth-admin.guard";
import { RolesGuard } from "../admin/guards/roles.guard";
import { RIGHTS } from "src/system/constants/rights";

@UseGuards(AuthAdminGuard, RolesGuard)
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
  @Roles(RIGHTS.ShowSettingLayout)
  async GetAll(): Promise<any> {
    return this.sysLayoutService.getAll();
  }

  @Post("create")
  @ApiOperation({
    description: "Create SysLayout",
  })
  @ApiOkResponse({
    type: Response<SysLayout>,
  })
  @ApiBearerAuth("Authorization")
  @Roles(RIGHTS.EditSettingLayout)
  async create(
    @Body() userDto: CreateSysLayoutDto,
    @Request() req: any
  ): Promise<any> {
    return this.sysLayoutService.create(userDto, req?.user);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update SysLayout",
  })
  @ApiOkResponse({
    type: Response<SysLayout>,
  })
  @UsePipes(ValidationPipe)
  @ApiBearerAuth("Authorization")
  @Roles(RIGHTS.EditSettingLayout)
  async updateSysLayout(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateSysLayoutDto,
    @Request() req: any
  ): Promise<any> {
    return this.sysLayoutService.update(id, updateDto, req?.user);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete SysLayout",
  })
  @ApiBearerAuth("Authorization")
  async delete(@Param("id") id: number): Promise<any> {
    return this.sysLayoutService.delete(id);
  }

  @Post("upload")
  @ApiOperation({
    description: "Upload file image",
  })
  @ApiOkResponse({
    type: Response<unknown>,
  })
  @Roles(RIGHTS.EditSettingLayout)
  @UseInterceptors(FileInterceptor("image"))
  async uploadFile(@UploadedFile() image: Express.Multer.File): Promise<any> {
    return this.sysLayoutService.uploadImage(image);
  }
}
