import { BacklistGuard } from "../backlist/backlist.guard";
import { JwtAuthGuard } from "./../auth/jwt/jwt-auth.guard";
import { TestActionDto } from "./dto/action.dto";
import { CreateConnectDto, TestLoginDto } from "./dto/index";
import { Controller, Get, Body, Post, UseGuards } from "@nestjs/common";
import { ConnectService } from "./connect.service";
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { AuthGuard } from "../auth/guards/auth.guard";

@Controller("/api/v1/connect")
@ApiTags("Connect")
@ApiBearerAuth("Authorization")
// @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
@UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
export class ConnectController {
  constructor(private connectService: ConnectService) {}

  @Post("data")
  @ApiResponse({
    status: 9200,
    description: "Get list connect success",
  })
  @ApiOperation({
    description: "Get all connect",
  })
  async GetData(@Body() connectDto: TestActionDto): Promise<any> {
    const { action } = connectDto;
    return this.connectService.getDataApi(action, 1);
  }

  @Get("time")
  @ApiResponse({
    status: 9200,
    description: "Get list connect success",
  })
  @ApiOperation({
    description: "Get all connect",
  })
  async GetTime(): Promise<any> {
    // return this.connectService.getEventTime(1);
  }

  @Post("test-login")
  @ApiResponse({
    status: 9200,
    description: "Get list connect success",
  })
  async testLogin(@Body() testLoginDto: TestLoginDto): Promise<any> {
    return this.connectService.logIn(testLoginDto.userName);
  }

  @Post("test-update")
  @ApiResponse({
    status: 9200,
    description: "Get list connect success",
  })
  async testUpdate(@Body() connectDto: CreateConnectDto): Promise<any> {
    const { awardAmount, userName } = connectDto;
    return this.connectService.update(userName, awardAmount);
  }
}
