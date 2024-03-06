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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { PaginationQueryDto } from "../../common/common.dto";
import { Response } from "../../system/interfaces";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { BacklistGuard } from "../backlist/backlist.guard";
import { UserRoles } from "../user/enums/user.enum";
import { CancelOrderRequestDto } from "./dto/cancel.dto";
import { ListOrderRequestDto } from "./dto/create.list.dto";
import { UpdateOrderRequestDto } from "./dto/index";
import { OrderRequest } from "./order.request.entity";
import { OrderRequestService } from "./order.request.service";
import { User } from "../user/user.entity";
import { DelDataFakeReqDto } from "./dto/delete.data.fake.dto";
import { OrderByUserInfoReqDto } from "./dto/oder.by.user.info.dto";
import { AuthGuard } from "../auth/guards/auth.guard";

@Controller("/api/v1/OrderRequest")
@ApiTags("OrderRequest")
@ApiBearerAuth("Authorization")

export class OrderRequestController {
  constructor(private orderRequestService: OrderRequestService) { }

  @Get("admin-all")
  @ApiResponse({
    status: 2000,
    description: "Get list OrderRequest success",
  })
  @ApiQuery({
    name: "take",
    type: "number",
    description: "enter take (Take is limit in sql) of record",
    required: true,
  })
  @ApiQuery({
    name: "skip",
    type: "number",
    description: "enter skip (Skip is offset in sql) of record",
    required: true,
  })
  @ApiQuery({
    name: "order",
    type: "string",
    description:
      "The ORDER BY keyword sorts the records in ascending order by default. To sort the records in descending order, use the DESC|ASC keyword",
    required: true,
  })
  @ApiOperation({
    description: "Get all OrderRequest",
  })
  @ApiOkResponse({
    type: Response<OrderRequest[]>,
  })
  // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
  async AdminGetAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Request() req: any
  ): Promise<any> {
    return this.orderRequestService.adminGetAll(paginationQueryDto);
  }
  
  @Get("balance")
  @ApiOperation({
    description: "User Get user information",
  })
  @ApiOkResponse({
    type: Response<User>,
  })
  // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
  async userGetBalanceInfo(@Request() req: any): Promise<any> {
    return this.orderRequestService.userGetBalanceInfo(req.user.id);
  }
  
  @Post("create")
  @ApiOperation({
    description: "Create OrderRequest",
  })
  @ApiOkResponse({
    type: Response<OrderRequest>,
  })
  // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
  async create(@Body() listOrderRequestDto: ListOrderRequestDto,
    @Request() req: any): Promise<any> {
    return this.orderRequestService.create(listOrderRequestDto, req.user);
  }

  @Post("create-45s-fakes")
  @ApiOperation({
    description: "Create OrderRequest",
  })
  @ApiOkResponse({
    type: Response<OrderRequest>,
  })
  // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
  async create45sFake(@Body() listOrderRequestDto: ListOrderRequestDto,
    @Request() req: any): Promise<any> {
    return this.orderRequestService.create45sFake(listOrderRequestDto, req.user);
  }

  @Post("cancel")
  @ApiOperation({
    description: "Create OrderRequest",
  })
  @ApiOkResponse({
    type: Response<OrderRequest>,
  })
  // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
  async cancel(
    @Body() cancelOrderRequestDto: CancelOrderRequestDto,
    @Request() req: any): Promise<any> {
    return this.orderRequestService.cancel(cancelOrderRequestDto, req.user);
  }

  @Get("all")
  @ApiResponse({
    status: 2000,
    description: "Get list OrderRequest success",
  })
  @ApiQuery({
    name: "take",
    type: "number",
    description: "enter take (Take is limit in sql) of record",
    required: true,
  })
  @ApiQuery({
    name: "skip",
    type: "number",
    description: "enter skip (Skip is offset in sql) of record",
    required: true,
  })
  @ApiQuery({
    name: "order",
    type: "string",
    description:
      "The ORDER BY keyword sorts the records in ascending order by default. To sort the records in descending order, use the DESC|ASC keyword",
    required: true,
  })
  @ApiOperation({
    description: "Get all OrderRequest",
  })
  @ApiOkResponse({
    type: Response<OrderRequest[]>,
  })
  // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
  async GetAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Request() req: any
  ): Promise<any> {
    return this.orderRequestService.userGetAll(paginationQueryDto, req.user);
  }

  @Get(":id")
  @ApiOperation({
    description: "Get OrderRequest by id",
  })
  @ApiOkResponse({
    type: Response<OrderRequest>,
  })
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER)
  async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
    return this.orderRequestService.getOneById(id);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update OrderRequest",
  })
  @ApiOkResponse({
    type: Response<OrderRequest>,
  })
  @UsePipes(ValidationPipe)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateOrderRequestDto: UpdateOrderRequestDto
  ): Promise<any> {
    return this.orderRequestService.update(id, updateOrderRequestDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete OrderRequest",
  })
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.orderRequestService.delete(id);
  }


  @Post("deteleDataFake")
  @ApiOperation({
    description: "Delete data fake",
  })
  @ApiOkResponse({
    type: Response<OrderRequest>,
  })
  async deteleDataFake(
    @Body() delDataFakeReqDto: DelDataFakeReqDto,
    ): Promise<any> {
    return this.orderRequestService.deleteDataFake(delDataFakeReqDto?.usernameFake);
  }

  @Post("orderByUserInfo")
  @ApiOperation({
    description: "List order by user info",
  })
  @ApiOkResponse({
    type: Response<OrderRequest>,
  })
  async orderByUserInfo(
    @Body() orderByUserInfoReqDto: OrderByUserInfoReqDto,
    ): Promise<any> {
    return this.orderRequestService.getAllOrderUserInfo(orderByUserInfoReqDto?.username);
  }
}
