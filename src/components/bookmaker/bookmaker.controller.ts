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
  import { BookMakerService } from "./bookmaker.service";
  import { PaginationQueryDto } from "../../common/common.dto/pagination.query.dto";
  import {
    CreateBookMakerDto,
    UpdateBookMakerDto
  } from "./dto/index";
  import { UserRoles } from "../user/enums/user.enum";
  import { BookMaker } from "./bookmaker.entity";
  import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
  @Controller("/api/v1/bookMaker")
  @ApiTags("BookMaker")
  export class BookMakerController {
    constructor(private bookMakerService: BookMakerService) { }
  
    @Get("all")
    @ApiOperation({
      description: "Get all BookMaker",
    })
    @ApiOkResponse({
      type: Response<BookMaker[]>,
    })
    @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMINISTRATORS_BOOKMAKER, UserRoles.ADMIN_BOOKMAKER)
    async GetAll(): Promise<any> {
      return this.bookMakerService.getAll();
    }

    @Get(":id")
    @ApiOperation({
      description: "Get bookmaker by id",
    })
    @ApiOkResponse({
      type: Response<BookMaker[]>,
    })
    @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMINISTRATORS_BOOKMAKER, UserRoles.ADMIN_BOOKMAKER)
    async GetById(@Param("id", ParseIntPipe) id: number): Promise<any> {
      return this.bookMakerService.getById(id);
    }
  
    @Post("create")
    @ApiOperation({
      description: "Create BookMaker",
    })
    @ApiOkResponse({
      type: Response<BookMaker>,
    })
    @ApiBearerAuth("Authorization")
    @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
    @Roles(UserRoles.SUPPER)
    async create(@Body() userDto: CreateBookMakerDto): Promise<any> {
      return this.bookMakerService.create(userDto);
    }
  
    @Patch(":id")
    @ApiOperation({
      description: "Update BookMaker",
    })
    @ApiOkResponse({
      type: Response<BookMaker>,
    })
    @UsePipes(ValidationPipe)
    @ApiBearerAuth("Authorization")
    @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
    @Roles(UserRoles.SUPPER)
    async updateBookMaker(
      @Param("id", ParseIntPipe) id: number,
      @Body() updateDto: UpdateBookMakerDto,
      @Request() req: any
    ): Promise<any> {
      return this.bookMakerService.update(id, updateDto, req.user);
    }
  
    @Delete(":id")
    @ApiOperation({
      description: "Delete BookMaker",
    })
    @ApiBearerAuth("Authorization")
    @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
    @Roles(UserRoles.SUPPER)
    async delete(@Param("id") id: number): Promise<any> {
      return this.bookMakerService.delete(id);
    }
  }