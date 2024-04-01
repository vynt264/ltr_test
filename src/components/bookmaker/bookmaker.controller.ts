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
import { AuthGuard } from "../auth/guards/auth.guard";
import { AuthAdminGuard } from "../auth/guards/auth-admin.guard";
@Controller("/api/v1/bookMaker")
@ApiTags("BookMaker")
export class BookMakerController {
  constructor(private bookMakerService: BookMakerService) { }
}