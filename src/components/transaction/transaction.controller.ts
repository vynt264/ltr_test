import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
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
import { Logger } from "winston";
import { PaginationQueryDto } from "../../common/common.dto";
import { Response } from "../../system/interfaces";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { BacklistGuard } from "../backlist/backlist.guard";
import { UserRoles } from "../user/enums/user.enum";
import { TopUpMainRequestDto, UpdateTransactionDto } from "./dto/index";
import { SubPaymentTransactionDto } from "./dto/sub.payment.dto";
import { GetUserWalletInfoDto } from "./dto/req.wallet.info.dto";
import { TransferTransactionDto } from "./dto/transfer.dto";
import { Transaction } from "./transaction.entity";
import { TransactionService } from "./transaction.service";
import { ListPaymentTransDto } from "./dto/list.payment.dto";
import { Cron, CronExpression } from "@nestjs/schedule";
const crypto = require("crypto");
const fs = require("fs");

@Controller("/api/v1/Transaction")
@ApiTags("Transaction")
@ApiBearerAuth("Authorization")
export class TransactionController {
  private publicKey;

  private verify;

  constructor(
    private transactionService: TransactionService,
    @Inject("winston")
    private readonly logger: Logger
  ) {
    this.publicKey = fs.readFileSync("public.pem", "utf8");
    this.verify = crypto.createVerify("RSA-SHA256");
  }

  @Post("qc-test-payment")
  @ApiOperation({
    description: "Create transfer",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  // TODO check security ssl certificate service
  async testPayment(
    @Body() paymentTransactionDto: SubPaymentTransactionDto
  ): Promise<any> {
    const res = await this.transactionService.userPayment(
      paymentTransactionDto
    );
    return res;
  }

  @Post("request/plus")
  @ApiOperation({
    description: "Create Transaction",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @Roles(UserRoles.SUPPER, UserRoles.REQUEST_TOP_UP)
  async adminAdjustmentPlus(
    @Body() topUpMainTransDto: TopUpMainRequestDto,
    @Request() req: any
  ): Promise<any> {
    return this.transactionService.adminAdjustmentPlus(
      topUpMainTransDto,
      req?.user
    );
  }

  @Post("request/minus")
  @ApiOperation({
    description: "Create Transaction",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @Roles(UserRoles.SUPPER, UserRoles.REQUEST_TOP_UP)
  async adminAdjustmentMinus(
    @Body() topUpMainTransDto: TopUpMainRequestDto,
    @Request() req: any
  ): Promise<any> {
    return this.transactionService.adminAdjustmentMinus(
      topUpMainTransDto,
      req?.user
    );
  }

  @Post(":id/approve")
  @ApiOperation({
    description: "Create Transaction",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @Roles(UserRoles.SUPPER, UserRoles.APPROVE_TOP_UP)
  async approve(
    @Body() topUpMainTransDto: TopUpMainRequestDto,
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number
  ): Promise<any> {
    return this.transactionService.adminApprove(
      topUpMainTransDto,
      id,
      req?.user
    );
  }

  @Post(":id/reject")
  @ApiOperation({
    description: "Create Transaction",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @Roles(UserRoles.SUPPER, UserRoles.APPROVE_TOP_UP)
  async reject(
    @Body() topUpMainTransDto: TopUpMainRequestDto,
    @Request() req: any,
    @Param("id", ParseIntPipe) id: number
  ): Promise<any> {
    return this.transactionService.adminReject(
      topUpMainTransDto,
      id,
      req?.user
    );
  }

  @Post("top-up")
  @ApiOperation({
    description: "Create Transaction",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async userTopUpWallet(@Request() req: any): Promise<any> {
    return this.transactionService.userTopUpWallet(req?.user);
  }

  @Post("transfer")
  @ApiOperation({
    description: "Create transfer",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @Roles(UserRoles.SUPPER, UserRoles.OPTION1)
  async userTransfer(
    @Body() transferTransactionDto: TransferTransactionDto,
    @Request() req: any
  ): Promise<any> {
    return this.transactionService.userTransfer(
      transferTransactionDto,
      req?.user
    );
  }

  @Post("test")
  @ApiOperation({
    description: "Creasaate Transaction",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  async testEsa(@Body() paymentTransDto: SubPaymentTransactionDto): Promise<any> {
    // Read public key file

    // Read private key file
    const privateKey = fs.readFileSync("private.pem", "utf8");

    const sign = crypto.createSign("RSA-SHA256");
    sign.update(
      `${paymentTransDto.username}_${paymentTransDto.gameCode}_${paymentTransDto.amount}_${paymentTransDto.transRef1}`
    );
    const signature = sign.sign(privateKey, "base64");

    return signature;
  }

  @Post("payment")
  @ApiOperation({
    description: "Create transfer",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  async userPayment(
    @Body() paymentTransDto: SubPaymentTransactionDto
  ): Promise<any> {
    // this.verify.update(
    //   `${paymentTransDto.username}_${paymentTransDto.gameCode}_${paymentTransDto.amount}_${paymentTransDto.transRef1}`
    // );
    // const isSignatureValid = this.verify.verify(
    //   this.publicKey,
    //   paymentTransDto.signature,
    //   "base64"
    // );
    // if (!isSignatureValid) {
    //   return new ErrorResponse(
    //     STATUSCODE.COMMON_FAILED,
    //     "Invalid signature",
    //     ERROR.CREATE_FAILED
    //   );
    // }
    const res = await this.transactionService.userPayment(paymentTransDto);
    return res;
  }

  @Post("list-payment")
  @ApiOperation({
    description: "Create transfer",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  async guestPayment(
    @Body() listPayment: ListPaymentTransDto
  ): Promise<any> {
    // TODO verify signature
    const res = await this.transactionService.listPayment(listPayment);
    return res;
  }

  @Post("wallet-info")
  @ApiOperation({
    description: "Create Transaction",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async getInfo(
    @Body() getInfoDto: GetUserWalletInfoDto,
    @Request() req: any
  ): Promise<any> {
    return this.transactionService.getInfoDto(getInfoDto, req?.user?.name);
  }

  @Post("partnert-wallet-info")
  @ApiOperation({
    description: "Create Transaction",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  async partnerGetInfo(@Body() getInfoDto: GetUserWalletInfoDto): Promise<any> {
    return this.transactionService.getInfoDto(getInfoDto, getInfoDto.username);
  }

  @Get("all")
  @ApiResponse({
    status: 2000,
    description: "Get list Transaction success",
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
    description: "Get all Transaction",
  })
  @ApiOkResponse({
    type: Response<Transaction[]>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @Roles(UserRoles.SUPPER)
  async GetAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Request() req: any
  ): Promise<any> {
    return this.transactionService.getAll(paginationQueryDto, req.user);
  }

  @Get(":id")
  @ApiOperation({
    description: "Get Transaction by id",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @Roles(UserRoles.SUPPER, UserRoles.TRANSACTION_VIEW)
  async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
    return this.transactionService.getOneById(id);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update Transaction",
  })
  @ApiOkResponse({
    type: Response<Transaction>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @UsePipes(ValidationPipe)
  @Roles(UserRoles.SUPPER)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto
  ): Promise<any> {
    return this.transactionService.update(id, updateTransactionDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete Transaction",
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @Roles(UserRoles.SUPPER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.transactionService.delete(id);
  }

  // delete data
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async handleCronDeleteDataFake() {
    await this.transactionService.deleteDataFake();
  }
}
