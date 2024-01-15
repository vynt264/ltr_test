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
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { RolesGuard } from "../auth/roles.guard/roles.guard";
import { BacklistGuard } from "../backlist/backlist.guard";
import { SysLayoutService } from "./sys.layout.service";
import { PaginationQueryDto } from "../../common/common.dto/pagination.query.dto";
import { CreateSysLayoutDto, UpdateSysLayoutDto } from "./dto/index";
import { UserRoles } from "../user/enums/user.enum";
import { SysLayout } from "./sys.layout.entity";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
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

  @Post("create")
  @ApiOperation({
    description: "Create SysLayout",
  })
  @ApiOkResponse({
    type: Response<SysLayout>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER, UserRoles.ADMINISTRATORS, UserRoles.ADMINISTRATORS_BOOKMAKER)
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
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER, UserRoles.ADMINISTRATORS, UserRoles.ADMINISTRATORS_BOOKMAKER)
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
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER, UserRoles.ADMINISTRATORS, UserRoles.ADMINISTRATORS_BOOKMAKER)
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
  @UseInterceptors(FileInterceptor("image"))
  async uploadFile(@UploadedFile() image: Express.Multer.File): Promise<any> {
    // console.log(image)
    return this.sysLayoutService.uploadImage(image);
  }
}
