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
import VerifyAccountDto from './dto/verify.accout.dto';
import GetRefundableBalanceDto from './dto/get.refundable.balance.dto';
import DepositDto from './dto/deposit.dto';
import WithdrawDto from './dto/withdraw.dto';
import CheckStatusTransactionDto from './dto/check.status.transaction.dto';
import { ErrorResponse, SuccessResponse } from 'src/system/BaseResponse';
import { Logger } from "winston";
import { Helper } from 'src/common/helper';
import { StatusExchange, TypeExchange } from './enums/exchange.enum';

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
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async verifyAccount(verifyAccountDto: VerifyAccountDto) {
    try {
      const bookmaker = await this.bookmakerRepository.findOneBy({ id: verifyAccountDto.bookmakerId });
      if (!bookmaker) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Bookmaker is not exists",
          MESSAGE.VERIFY_FAILURE
        );
      }

      const signLocal = Helper.endCodeUsername(`${verifyAccountDto.username}|${verifyAccountDto.bookmakerId}`);
      if (verifyAccountDto.sign != signLocal) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Sign is wrong",
          MESSAGE.VERIFY_FAILURE
        );
      }

      let user = await this.userRepository.findOneBy({
        username: verifyAccountDto.username,
        bookmaker: {
          id: verifyAccountDto.bookmakerId
        }
      })
      if (!user) {
        const userCreateDto = {
          username: verifyAccountDto.username,
          password: process.env.USER_PASSWORD,
          isAuth: false,
          usernameReal: '',
          bookmaker: { id: verifyAccountDto.bookmakerId },
        };
        const createdUser = this.userRepository.create(userCreateDto);
        user = await this.userRepository.save(createdUser);

        const walletDto = {
          walletCode: "",
          user: { id: user.id },
          createdBy: user.username,
          balance: 0,
        };
        const walletCreate = await this.walletRepository.create(walletDto);
        await this.walletRepository.save(walletCreate);
      }

      const userResponse = {
        super: user?.id,
        username: user?.username,
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
            balance: wallet.balance
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
              balance: balanceUp,
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
      const bookmaker = await this.bookmakerRepository.findOneBy({ id: withdrawDto.bookmakerId });
      if (!bookmaker) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Bookmaker is not exists",
          MESSAGE.WITHDRAW_FAILUTE
        );
      }

      const signLocal = Helper.endCodeUsername(`${withdrawDto.username}|${withdrawDto.bookmakerId}|${withdrawDto.supplier}|${withdrawDto.amount.toFixed(2)}`);
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
          const balanceUp = Number(walletUser.balance) - Number(withdrawDto.amount);
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
              balance: balanceUp,
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

  async checkStatusTransaction(checkStatusTransactionDto: CheckStatusTransactionDto) {
    try {
      const bookmaker = await this.bookmakerRepository.findOneBy({ id: checkStatusTransactionDto.bookmakerId });
      if (!bookmaker) {
        return new SuccessResponse(
          STATUSCODE.COMMON_BAD_REQUEST,
          "Bookmaker is not exists",
          MESSAGE.CHECK_STATUS_TRANSACTION_FAILUTE
        );
      }

      const signLocal = Helper.endCodeUsername(`${checkStatusTransactionDto.username}|${checkStatusTransactionDto.bookmakerId}`);
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
            status: exchangeFind.status,
            amount: exchangeFind.amount
          }
        } else {
          response = {
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
}