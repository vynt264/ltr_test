import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { endOfDay, startOfDay, addHours } from "date-fns";
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ERROR, MESSAGE, PERIOD_CANNOT_CANCELED, PERIOD_CANNOT_ORDER, STATUSCODE } from 'src/system/constants';
import { Wallet } from '../wallet-handler/entities/wallet.entity';
import { User } from '../user/user.entity';
import { BookMaker } from '../bookmaker/bookmaker.entity';
import { Exchange } from './entities/exchange.entity';
import { WalletHistory } from '../wallet/wallet.history.entity';
import { WalletInout } from '../wallet.inout/wallet.inout.entity';
import { Order } from '../orders/entities/order.entity';
import VerifyAccountDto from './dto/verify.accout.dto';
import GetRefundableBalanceDto from './dto/get.refundable.balance.dto';
import DepositDto from './dto/deposit.dto';
import WithdrawDto from './dto/withdraw.dto';
import CheckStatusTransactionDto from './dto/check.status.transaction.dto';
import { ErrorResponse, SuccessResponse } from 'src/system/BaseResponse';
import { Logger } from "winston";
import { Helper } from 'src/common/helper';
import { StatusExchange, TypeExchange } from './enums/exchange.enum';
import GetBetInfoDto from './dto/get.bet.info.dto';
import * as moment from "moment";

@Injectable()
export class IntegrationService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(BookMaker)
    private bookmakerRepository: Repository<BookMaker>,
    @InjectRepository(Exchange)
    private exchangeRepository: Repository<Exchange>,
    @InjectRepository(WalletHistory)
    private walletHistoryRepository: Repository<WalletHistory>,
    @InjectRepository(WalletInout)
    private walletInoutRepository: Repository<WalletInout>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async verifyAccount(verifyAccountDto: VerifyAccountDto) {
    try {
      const bookmaker = await this.bookmakerRepository.findOneBy({
        id: verifyAccountDto.bookmakerId,
      });
      if (!bookmaker) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Bookmaker is not exists",
          MESSAGE.VERIFY_FAILURE
        );
      }

      const signLocal = Helper.endCodeUsername(
        `${verifyAccountDto.username}|${verifyAccountDto.bookmakerId}`
      );
      if (verifyAccountDto.sign != signLocal) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Sign is wrong",
          MESSAGE.VERIFY_FAILURE
        );
      }

      const usernameEncrypt = Helper.encryptData(verifyAccountDto.username)

      let user = await this.userRepository.findOneBy({
        username: usernameEncrypt,
        bookmaker: {
          id: verifyAccountDto.bookmakerId
        }
      })
      if (!user) {
        const userCreateDto = {
          username: usernameEncrypt,
          password: process.env.USER_PASSWORD,
          isAuth: false,
          usernameReal: "",
          bookmaker: { id: verifyAccountDto.bookmakerId },
        };
        const createdUser = this.userRepository.create(userCreateDto);
        user = await this.userRepository.save(createdUser);

        const walletDto = {
          walletCode: "",
          user: { id: user.id },
          createdBy: usernameEncrypt,
          balance: 0,
        };
        const walletCreate = await this.walletRepository.create(walletDto);
        await this.walletRepository.save(walletCreate);
      }

      const params = Helper.encryptData(
        `username=${verifyAccountDto.bookmakerId}|${usernameEncrypt}`
      );
      const url = `http://vntop.game.game8b.com/?params=${params}`

      const userResponse = {
        user: {
          sub: user?.id,
          username: usernameEncrypt,
        },
        url: url,
      } 

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        userResponse,
        MESSAGE.VERIFY_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${IntegrationService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.SYSTEM_OCCURRENCE
      );
    }
  }

  async getRefundableBalance(getRefundableBalanceDto: GetRefundableBalanceDto) {
    try {
      const bookmaker = await this.bookmakerRepository.findOneBy({ id: getRefundableBalanceDto.bookmakerId });
      if (!bookmaker) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Bookmaker is not exists",
          MESSAGE.GET_REFUNDABLE_BALANCE_FAILUTE
        );
      }

      const signLocal = Helper.endCodeUsername(`${getRefundableBalanceDto.username}|${getRefundableBalanceDto.bookmakerId}`);
      if (getRefundableBalanceDto.sign != signLocal) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Sign is wrong",
          MESSAGE.GET_REFUNDABLE_BALANCE_FAILUTE
        );
      }

      // check username có tồn tại
      const user = await this.userRepository.findOneBy({
        username: getRefundableBalanceDto.username,
        bookmaker: {
          id: getRefundableBalanceDto.bookmakerId
        }
      })
      if (!user) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Username is not exists",
          MESSAGE.GET_REFUNDABLE_BALANCE_FAILUTE
        );
      } else {
        const wallet = await this.walletRepository.findOneBy({
          user: {
            id: user?.id
          }
        })

        if (wallet) {
          const dataResponse = {
            balance: parseFloat(wallet.balance.toString())
          }

          return new SuccessResponse(
            STATUSCODE.COMMON_SUCCESS,
            dataResponse,
            MESSAGE.GET_REFUNDABLE_BALANCE_SUCCESS
          );
        }
      }  
    } catch (error) {
      this.logger.debug(
        `${IntegrationService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.SYSTEM_OCCURRENCE
      );
    }
  }

  async deposit(depostDto: DepositDto) {
    try {
      const bookmaker = await this.bookmakerRepository.findOneBy({ id: depostDto.bookmakerId });
      if (!bookmaker) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Bookmaker is not exists",
          MESSAGE.DEPOSIT_FAILUTE
        );
      }

      const signLocal = Helper.endCodeUsername(`${depostDto.username}|${depostDto.bookmakerId}|${depostDto.supplier}|${depostDto.amount.toFixed(2)}`);
      if (depostDto.sign != signLocal) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Sign is wrong",
          MESSAGE.DEPOSIT_FAILUTE
        );
      }

      const user = await this.userRepository.findOneBy({
        username: depostDto.username,
        bookmaker: {
          id: depostDto.bookmakerId
        }
      })
      if (!user) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Username is not exists",
          MESSAGE.DEPOSIT_FAILUTE
        );
      } else {
        // cộng amount vào ví của user
        // save vao wallet_history
        // save vao exchange
        const walletUser = await this.walletRepository.findOneBy({
          user: {
            id: user?.id
          }
        })
        
        if (walletUser) {
          // save exchange
          const exchangeDto = {
            userId: user.id,
            bookmakerId: depostDto.bookmakerId,
            orderKey: depostDto.orderKey,
            type: TypeExchange.DEPOSIT,
            status: StatusExchange.PROCESSING,
            amount: depostDto.amount
          }
          let exchangeCreated = await this.exchangeRepository.create(exchangeDto);
          await this.exchangeRepository.save(exchangeCreated);
          // update balance wallet
          const balanceUp = Number(walletUser.balance) + Number(depostDto.amount);
          const walletUpdate = {...walletUser, balance: balanceUp}
          const walletUpdated = await this.walletRepository.save(walletUpdate);

          if (walletUpdated.balance == balanceUp) {
            // save wallet history
            const walletHis = {
              id: walletUser.id,
              user: { id: user.id },
              subOrAdd: 1,
              amount: Number(depostDto.amount),
              detail: `Chuyển tiền vào ví`,
              balance: balanceUp,
              createdBy: user.username
            }
            const createdWalletHis = await this.walletHistoryRepository.create(walletHis);
            await this.walletHistoryRepository.save(createdWalletHis);
            // update exchange
            exchangeCreated = {
              ...exchangeCreated,
              status: StatusExchange.SUCCESS,
            }
            await this.exchangeRepository.save(exchangeCreated);
          } else {
            exchangeCreated = {
              ...exchangeCreated,
              status: StatusExchange.FAILURE,
            }
            await this.exchangeRepository.save(exchangeCreated);
          }

          return new SuccessResponse(
            STATUSCODE.COMMON_SUCCESS,
            {
              balance: parseFloat(balanceUp.toString()),
            },
            MESSAGE.DEPOSIT_SUCCESS
          );
        }
      }
    } catch (error) {
      this.logger.debug(
        `${IntegrationService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.SYSTEM_OCCURRENCE
      );
    }
  }

  async withdraw(withdrawDto: WithdrawDto) {
    try {
      const bookmaker = await this.bookmakerRepository.findOneBy({
        id: withdrawDto.bookmakerId,
      });
      if (!bookmaker) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Bookmaker is not exists",
          MESSAGE.WITHDRAW_FAILUTE
        );
      }

      const signLocal = Helper.endCodeUsername(
        `${withdrawDto.username}|${withdrawDto.bookmakerId}|${
          withdrawDto.supplier
        }|${withdrawDto.amount.toFixed(2)}`
      );
      if (withdrawDto.sign != signLocal) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Sign is wrong",
          MESSAGE.WITHDRAW_FAILUTE
        );
      }

      const user = await this.userRepository.findOneBy({
        username: withdrawDto.username,
        bookmaker: {
          id: withdrawDto.bookmakerId
        }
      })
      if (!user) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Username is not exists",
          MESSAGE.WITHDRAW_FAILUTE
        );
      } else {
        // cộng amount vào ví của user
        // save vao wallet_history
        // save vao exchange
        const walletUser = await this.walletRepository.findOneBy({
          user: {
            id: user?.id
          }
        })

        if (walletUser) {
          const balanceUp =
            Number(walletUser.balance) - Number(withdrawDto.amount);
          // check balance available
          if (balanceUp < 0) {
            return new SuccessResponse(
              STATUSCODE.COMMON_BAD_REQUEST,
              "The balance is not enough to withdraw",
              MESSAGE.WITHDRAW_FAILUTE
            );
          }
          // save exchange
          const exchangeDto = {
            userId: user.id,
            bookmakerId: withdrawDto.bookmakerId,
            orderKey: withdrawDto.orderKey,
            type: TypeExchange.WITHDRAW,
            status: StatusExchange.PROCESSING,
            amount: withdrawDto.amount
          }
          let exchangeCreated = await this.exchangeRepository.create(exchangeDto);
          await this.exchangeRepository.save(exchangeCreated);
          // update balance wallet
          const walletUpdate = { ...walletUser, balance: balanceUp }
          const walletUpdated = await this.walletRepository.save(walletUpdate);

          if (walletUpdated.balance == balanceUp) {
            // save wallet history
            const walletHis = {
              id: walletUser.id,
              user: { id: user.id },
              subOrAdd: 0,
              amount: Number(withdrawDto.amount),
              detail: `Rút tiền vào ví`,
              balance: balanceUp,
              createdBy: user.username
            }
            const createdWalletHis = await this.walletHistoryRepository.create(walletHis);
            await this.walletHistoryRepository.save(createdWalletHis);
            // update exchange
            exchangeCreated = {
              ...exchangeCreated,
              status: StatusExchange.SUCCESS,
            }
            await this.exchangeRepository.save(exchangeCreated);
          } else {
            exchangeCreated = {
              ...exchangeCreated,
              status: StatusExchange.FAILURE,
            }
            await this.exchangeRepository.save(exchangeCreated);
          }

          return new SuccessResponse(
            STATUSCODE.COMMON_SUCCESS,
            {
              balance: parseFloat(balanceUp.toString()),
            },
            MESSAGE.WITHDRAW_SUCCESS
          );
        }
      }
    } catch (error) {
      this.logger.debug(
        `${IntegrationService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.SYSTEM_OCCURRENCE
      );
    }
  }

  async checkStatusTransaction(
    checkStatusTransactionDto: CheckStatusTransactionDto
  ) {
    try {
      const bookmaker = await this.bookmakerRepository.findOneBy({
        id: checkStatusTransactionDto.bookmakerId,
      });
      if (!bookmaker) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Bookmaker is not exists",
          MESSAGE.CHECK_STATUS_TRANSACTION_FAILUTE
        );
      }

      const signLocal = Helper.endCodeUsername(
        `${checkStatusTransactionDto.username}|${checkStatusTransactionDto.bookmakerId}`
      );
      if (checkStatusTransactionDto.sign != signLocal) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Sign is wrong",
          MESSAGE.CHECK_STATUS_TRANSACTION_FAILUTE
        );
      }

      const user = await this.userRepository.findOneBy({
        username: checkStatusTransactionDto.username,
        bookmaker: {
          id: checkStatusTransactionDto.bookmakerId
        }
      })
      if (!user) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Username is not exists",
          MESSAGE.CHECK_STATUS_TRANSACTION_FAILUTE
        );
      } else {
        const exchangeFind = await this.exchangeRepository.findOneBy({
          orderKey: checkStatusTransactionDto.orderKey
        })

        let response: any;
        if (exchangeFind) {
          response = {
            type: exchangeFind.type,
            status: exchangeFind.status,
            amount: parseFloat(exchangeFind.amount.toString())
          }
        } else {
          response = {
            type: -1,
            status: StatusExchange.INEXISTENCE,
            amount: 0
          }
        }

        return new SuccessResponse(
          STATUSCODE.COMMON_SUCCESS,
          response,
          MESSAGE.CHECK_STATUS_TRANSACTION_SUCCESS
        );
      }
    } catch (error) {
      this.logger.debug(
        `${IntegrationService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.SYSTEM_OCCURRENCE
      );
    }
  }

  async getBetInfo(getBetInfo: GetBetInfoDto) {
    try {
      const bookmaker = await this.bookmakerRepository.findOneBy({
        id: getBetInfo.bookmakerId,
      });
      if (!bookmaker) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Bookmaker is not exists",
          MESSAGE.GET_BET_INFO_FAILUTE
        );
      }

      const signLocal = Helper.endCodeUsername(
        `${getBetInfo.bookmakerId}|${getBetInfo.timeStart}|${getBetInfo.timeEnd}`
      );
      if (getBetInfo.sign != signLocal) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Sign is wrong",
          MESSAGE.GET_BET_INFO_FAILUTE
        );
      }

      const tiemStartCV = moment(getBetInfo.timeStart, "YYYYMMDDHHmmss").utcOffset(0).format("YYYY-MM-DD HH:mm:ss");
      const timeEndCV = moment(getBetInfo.timeEnd, "YYYYMMDDHHmmss").utcOffset(0).format("YYYY-MM-DD HH:mm:ss");
      const whereCondition: any = {};
      let condition = "bookmaker.id = :bookmarkerFind AND (entity.created_at BETWEEN :timeStart AND :timeEnd)";
      const conditionParams: any = { 
        bookmarkerFind: bookmaker.id,
        timeStart: tiemStartCV,
        timeEnd: timeEndCV
      }
      if (getBetInfo.username) {
        const userFind: User = await this.userRepository.findOneBy({
          username: getBetInfo.username,
          bookmaker: {
            id: getBetInfo.bookmakerId
          }
        })

        if (!userFind) {
          return new SuccessResponse(
            STATUSCODE.COMMON_BAD_REQUEST,
            "Username is not exists",
            MESSAGE.GET_BET_INFO_FAILUTE
          );
        } else {
          condition = condition.concat(` AND user.id = :userId`);
          conditionParams.userId = userFind.id;
        }
      }

      const orders = await this.orderRepository
        .createQueryBuilder("entity")
        .leftJoinAndSelect("users", "user", "entity.userId = user.id")
        .leftJoinAndSelect(
          "bookmaker",
          "bookmaker",
          "entity.bookmakerId = bookmaker.id"
        )
        .select("bookmaker.id as bookmakerId")
        .addSelect("user.username as username")
        .addSelect("entity.type as type")
        .addSelect("entity.seconds as seconds")
        .addSelect("entity.revenue as revenue")
        .addSelect("entity.betType as betType")
        .addSelect("entity.betTypeName as betTypeName")
        .addSelect("entity.childBetType as childBetType")
        .addSelect("entity.childBetTypeName as childBetTypeName")
        .addSelect("entity.detail as detail")
        .addSelect("entity.multiple as multiple")
        .addSelect("entity.created_at as created_at")
        .addSelect("entity.status as status")
        .addSelect("entity.paymentWin as paymentWin")
        .addSelect("entity.updated_at as updated_at")
        .where(condition, conditionParams)
        .getRawMany();

      const result: any = [];
      orders.map((order: any) => {
        const newIt = {
          username: order?.username,
          gameCategory: order?.type.indexOf("xs") > -1 ? 0 : 1, // 0: xoso
          gameType: `${order?.type}${order.seconds}s`,
          amount: parseFloat(order?.revenue.toString()),
          betType: order?.betType,
          betTypeName: order?.betTypeName,
          childBetType: order?.childBetType,
          childBetTypeName: order?.childBetTypeName,
          detail: order?.detail,
          multiple: order?.multiple,
          timeCreate: moment(order?.created_at).utcOffset(7).format("yyyyMMDDHHmmss"),
          status: order?.status,
          paymentWin: order?.paymentWin ? parseFloat(order?.paymentWin.toString()) : 0.00,
          timeResult: order?.status != "pending" ? moment(order?.updated_at).utcOffset(7).format("yyyyMMDDHHmmss") : "" // tính lại time kết thúc
        };
        result.push(newIt)
      })

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        result,
        MESSAGE.GET_BET_INFO_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${IntegrationService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.SYSTEM_OCCURRENCE
      );
    }
  }
}