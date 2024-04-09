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
import { IntegrationService } from "./integration.service";
import VerifyAccountDto from "./dto/verify.accout.dto";
import GetRefundableBalanceDto from "./dto/get.refundable.balance.dto";
import DepositDto from "./dto/deposit.dto";
import WithdrawDto from "./dto/withdraw.dto";
import CheckStatusTransactionDto from "./dto/check.status.transaction.dto";
import GetBetInfoDto from "./dto/get.bet.info.dto";

@Controller("/api/v1/")
@ApiTags("Integration")
export class IntegrationController {
  constructor(private integrationService: IntegrationService) { }

  @Post("veriFyAccount")
  @ApiOperation({
    description: "Verify Account",
  })
  @ApiOkResponse({
    type: Response<any>,
  })
  async veriFyAccount(@Body() verifyAccountDto: VerifyAccountDto): Promise<any> {
    return this.integrationService.verifyAccount(verifyAccountDto);
  }

  @Post("getRefundableBalance")
  @ApiOperation({
    description: "Get refundable balance",
  })
  @ApiOkResponse({
    type: Response<any>,
  })
  async getRefundableBalance(@Body() getRefundableBalanceDto: GetRefundableBalanceDto): Promise<any> {
    return this.integrationService.getRefundableBalance(getRefundableBalanceDto);
  }

  @Post("deposit")
  @ApiOperation({
    description: "Deposit",
  })
  @ApiOkResponse({
    type: Response<any>,
  })
  async deposit(@Body() depositDto: DepositDto): Promise<any> {
    return this.integrationService.deposit(depositDto);
  }

  @Post("withdraw")
  @ApiOperation({
    description: "Withdraw",
  })
  @ApiOkResponse({
    type: Response<any>,
  })
  async withdraw(@Body() withdrawDto: WithdrawDto): Promise<any> {
    return this.integrationService.withdraw(withdrawDto);
  }

  @Post("checkStatusTransaction")
  @ApiOperation({
    description: "Check status transaction",
  })
  @ApiOkResponse({
    type: Response<any>,
  })
  async checkStatusTransaction(@Body() checkStatusTransactionDto: CheckStatusTransactionDto): Promise<any> {
    return this.integrationService.checkStatusTransaction(checkStatusTransactionDto);
  }

  @Post("getBetInfo")
  @ApiOperation({
    description: "Get bet info",
  })
  @ApiOkResponse({
    type: Response<any>,
  })
  async getBetInfo(@Body() getBetInfo: GetBetInfoDto): Promise<any> {
    return this.integrationService.getBetInfo(getBetInfo);
  }

  @Post("getBetOriginalsInfo")
  @ApiOperation({
    description: "Get bet originals info",
  })
  @ApiOkResponse({
    type: Response<any>,
  })
  async getBetOriginalsInfo(@Body() getBetInfo: GetBetInfoDto): Promise<any> {
    return this.integrationService.getBetOriginalsInfo(getBetInfo);
  }
}