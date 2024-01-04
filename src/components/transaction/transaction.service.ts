import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, startOfDay } from "date-fns";
import { RedisLockService } from "nestjs-simple-redis-lock";
import { Helper } from "src/common/helper";
import { Between, Connection, In, LessThan, Not, Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "winston";
import { PaginationQueryDto } from "../../common/common.dto";
import {
  BaseResponse,
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
import { ConnectService } from "../connect/connect.service";
// import { SubWalletCodeQueue } from "../subwallet/sub.wallet.code.queue";
// import { SubWallet } from "../subwallet/sub.wallet.entity";
// import { SubWalletHistory } from "../subwallet/sub.wallet.history.entity";
import {
  PrefixEnum,
  SYS_ITEM_ENUM,
  SYS_MODULE_ENUM,
  StatusSend,
} from "../sys.config/enums/sys.config.enum";
import { SysConfig } from "../sys.config/sys.config.entity";
import { UserRoles } from "../user/enums/user.enum";
import { User } from "../user/user.entity";
import { Wallet } from "../wallet/wallet.entity";
import { WalletHistory } from "../wallet/wallet.history.entity";
import { TopUpMainRequestDto, UpdateTransactionDto } from "./dto/index";
import { SubPaymentTransactionDto } from "./dto/sub.payment.dto";
import { GetUserWalletInfoDto } from "./dto/req.wallet.info.dto";
import {
  UserWalletFullInfo as ResUserWalletInfo,
  WalletInfo,
} from "./dto/res.wallet.info.dto";
import { TransferTransactionDto } from "./dto/transfer.dto";
import {
  AdjustmentMethod,
  DepositMethod,
  PaymentMethod,
  PointsEarnMethod,
  RefundMethod,
  TransactionType,
  TransferMethod,
} from "./enums/status.dto";
import { Transaction } from "./transaction.entity";
import { TransFtQueue } from "./transaction.ft.queue";
import { ListPaymentTransDto } from "./dto/list.payment.dto";
import { OrderRequestService } from "../order.request/order.request.service";
@Injectable()
export class TransactionService {
  private prefixLockKey = "wallet:username:";

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SysConfig)
    private sysConfigRepository: Repository<SysConfig>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(TransFtQueue)
    private transFtRepository: Repository<TransFtQueue>,
    // @InjectRepository(SubWallet)
    // private subWalletRepository: Repository<SubWallet>,
    // @InjectRepository(SubWalletCodeQueue)
    // private subCodeQueueRepository: Repository<SubWalletCodeQueue>,
    @InjectRepository(WalletHistory)
    private walletHistoryRepository: Repository<WalletHistory>,
    // @InjectRepository(SubWalletHistory)
    // private subWalletHistoryRepository: Repository<SubWalletHistory>,
    private connectService: ConnectService,
    protected readonly lockRedisService: RedisLockService,
    private connection: Connection,
    private orderRequestService: OrderRequestService,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async lockWallet(key: string, action = '') {
    key = this.prefixLockKey + key;
    /**
     * Automatically unlock after 2min
     * Try again after 500ms if failed
     * The max times to retry is 100
     */
    await this.lockRedisService.lock(key, 2 * 60 * 1000, 500, 100);
  }

  async unlockWallet(key: string) {
    key = this.prefixLockKey + key;
    await this.lockRedisService.unlock(key);
  }

  async userPayment(
    paymentTransDto: SubPaymentTransactionDto
  ): Promise<BaseResponse> {
    let key = null;
    try {
      key = paymentTransDto.username;
      await this.lockWallet(key);
      const {
        error: error,
        wallet,
        subWallet,
        user,
      } = await this.verifyUserAndWallet(
        paymentTransDto.username,
        paymentTransDto.gameCode
      );

      if (error) return error;

      const amount = +paymentTransDto.amount;
      const newTransaction = {
        amount,
        ft: "",
        walletCode: wallet?.walletCode,
        transRef1: paymentTransDto.transRef1,
        transType: `${TransactionType.PAYMENT}`,
        method: `${`${PaymentMethod.USER_MINI_GAME}`}`,
        createdBy: user.username,
        status: `${StatusSend.INIT}`,
        note: paymentTransDto.note,
      };
      const createdTransaction =
        this.transactionRepository.create(newTransaction);
      const { error: methodError } = await this.verifyTransTypeAndMethod(
        createdTransaction,
        subWallet,
        wallet
      );

      if (methodError) return methodError;

      createdTransaction.ft = await this.getTransactionFt();
      const transaction = await this.transactionRepository.save(
        createdTransaction
      );

      // wallet.version = wallet.version + 1;
      wallet.updatedBy = user.username;
      wallet.updatedAt = new Date();
      subWallet.version = subWallet.version + 1;
      subWallet.updatedBy = user.username;
      subWallet.updatedAt = new Date();
      transaction.username = user.username;
      await this.processPayment(transaction, wallet, subWallet, true, user);

      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        transaction,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    } finally {
      if (key) {
        await this.unlockWallet(key);
      }
    }
  }

  async listPayment(
    listPaymentDto: ListPaymentTransDto
  ): Promise<BaseResponse> {

    for (const paymentDto of listPaymentDto.payments) {
      let key = null;
      try {
        const {
          error: error,
          user,
        } = await this.verifyUsername(
          paymentDto.username,
        );
        if (error) {
          paymentDto.description = error.message;
          paymentDto.status = `${StatusSend.ERROR}`;
          continue;
        }

        key = paymentDto.username;
        await this.lockWallet(key);

        let foundWallet = await this.walletRepository.findOne({
          where: { user: { id: user.id } }
        });
        const { error: errorWallet, wallet } = await this.verifyWallet(
          foundWallet
        );
        if (errorWallet) {
          paymentDto.description = errorWallet.message;
          paymentDto.status = `${StatusSend.ERROR}`;
          continue;
        }

        const amount = +paymentDto.amount;
        const newTransaction = {
          amount,
          ft: "",
          walletCode: wallet?.walletCode,
          transRef1: paymentDto.transRef1,
          transType: `${paymentDto.transType}`,
          method: `${`${paymentDto.method}`}`,
          createdBy: user.username,
          status: `${StatusSend.INIT}`,
          note: paymentDto.note,
        };
        const createdTransaction =
          this.transactionRepository.create(newTransaction);
        const { error: methodError } = await this.verifyTransTypeAndMethod(
          createdTransaction,
          null,
          wallet
        );

        if (methodError) {
          paymentDto.description = methodError.result;
          paymentDto.status = `${StatusSend.ERROR}`;
          continue;
        }

        createdTransaction.ft = await this.getTransactionFt();
        paymentDto.ft = createdTransaction.ft;
        const transaction = await this.transactionRepository.save(
          createdTransaction
        );

        // wallet.version = wallet.version + 1;
        wallet.updatedBy = user.username;
        wallet.updatedAt = new Date();
        transaction.username = user.username;

        await this.processPayment(transaction, wallet, null, true, user);
        paymentDto.status = `${StatusSend.SUCCESS}`;
      } catch (error) {
        this.logger.debug(
          `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
        );
        const messageError = JSON.stringify(error);
        paymentDto.description = messageError.length > 255 ? messageError.slice(0, 255) : messageError;
        paymentDto.status = `${StatusSend.ERROR}`;
      } finally {
        if (key) {
          await this.unlockWallet(key);
        }
      }
    }

    return new SuccessResponse(
      STATUSCODE.COMMON_CREATE_SUCCESS,
      listPaymentDto,
      MESSAGE.CREATE_SUCCESS
    );
  }

  async userTransfer(
    transferTranDto: TransferTransactionDto,
    member: User
  ): Promise<BaseResponse> {
    let key = null;

    try {
      key = member.name;
      await this.lockWallet(key);
      const transRef1 = uuidv4();
      const {
        error: error,
        wallet,
        subWallet,
        user,
      } = await this.verifyUserAndWallet(
        member.name,
        transferTranDto.gameCode,
        transRef1
      );

      if (error) return error;

      const amount = +transferTranDto.amount;
      const newTransaction = {
        amount,
        ft: "",
        walletCode: wallet?.walletCode,
        transRef1: transRef1,
        transType: `${TransactionType.TRANSFER}`,
        method: transferTranDto.method,
        createdBy: user.username,
        status: StatusSend.INIT,
      };
      const createdTransaction =
        this.transactionRepository.create(newTransaction);
      const { error: methodError } = await this.verifyTransTypeAndMethod(
        createdTransaction,
        subWallet,
        wallet
      );

      if (methodError) return methodError;

      createdTransaction.ft = await this.getTransactionFt();
      const transaction = await this.transactionRepository.save(
        createdTransaction
      );

      // wallet.version = wallet.version + 1;
      wallet.updatedBy = user.username;
      wallet.updatedAt = new Date();
      subWallet.version = subWallet.version + 1;
      subWallet.updatedBy = user.username;
      subWallet.updatedAt = new Date();
      transaction.username = user.username;
      transaction.subWalletCode = subWallet.subWalletCode;
      await this.processPayment(transaction, wallet, subWallet, true, user);

      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        transaction,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    } finally {
      if (key) {
        await this.unlockWallet(key);
      }
    }
  }

  /**
   * only process payment with this function
   * @param transaction
   * @param wallet
   * @param subWallet
   * @param verify verifyTransTypeAndMethod before
   * @returns
   */

  async processPayment(
    transaction: Transaction,
    wallet: Wallet,
    subWallet: any,
    verify: boolean,
    user: User
  ) {
    if (!verify) return;
    let queryRunner = null;
    try {
      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      this.cacularWalletAndSubWallet(transaction, wallet, subWallet);

      if (wallet) {
        const walletUpdated = await this.walletRepository.save(wallet);

        const createdWalletHis = {
          ...walletUpdated,
          user: { id: user.id },
        };
        await this.walletHistoryRepository.save(createdWalletHis);
      }

      // if (subWallet) {
      //   const subWalletUpdated = await this.subWalletRepository.save(subWallet);
      //   const createdSubWalletHis = {
      //     ...subWalletUpdated,
      //     user: { id: user.id },
      //   };
      //   await this.subWalletHistoryRepository.save(createdSubWalletHis);
      // }

      transaction.status = StatusSend.SUCCESS;
      await this.transactionRepository.save(transaction);
      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner) await queryRunner.rollbackTransaction();

      transaction.status = StatusSend.ERROR;
      transaction.errorReason =
        JSON.stringify(error).length < 255
          ? JSON.stringify(error)
          : JSON.stringify(error).slice(0, 255);
      await this.transactionRepository.save(transaction);
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  cacularWalletAndSubWallet(
    transaction: Transaction,
    wallet: Wallet,
    subWallet: any
  ) {
    // if (transaction.transType === `${TransactionType.DEPOSIT}`) {
    //   wallet.balance = +wallet.balance + +transaction.amount;
    //   wallet.totalBalance = +wallet.totalBalance + +transaction.amount;
    //   wallet.totalDeposit = +wallet.totalDeposit + +transaction.amount;
    //   wallet.availableBalance = +wallet.availableBalance + +transaction.amount;
    //   wallet.totalAvailableBalance =
    //     +wallet.totalAvailableBalance + +transaction.amount;
    // } else if (transaction.transType === `${TransactionType.TRANSFER}`) {

    //   if (transaction.method === `${TransferMethod.WALLET_TO_SUB_WALLET}`) {
    //     wallet.availableBalance =
    //       +wallet.availableBalance - +transaction.amount;
    //     wallet.balance = +wallet.balance - +transaction.amount;
    //     subWallet.availableBalance =
    //       +subWallet.availableBalance + +transaction.amount;
    //     subWallet.balance = +subWallet.balance + +transaction.amount;
    //   } else if (
    //     transaction.method === `${TransferMethod.SUB_WALLET_TO_WALLET}`
    //   ) {

    //     wallet.availableBalance =
    //       +wallet.availableBalance + +transaction.amount;
    //     wallet.balance = +wallet.balance + +transaction.amount;
    //     subWallet.availableBalance =
    //       +subWallet.availableBalance - +transaction.amount;
    //     subWallet.balance = +subWallet.balance - +transaction.amount;
    //   }
    // } else if (transaction.transType === `${TransactionType.PAYMENT}`) {
    //   if (transaction.method === `${PaymentMethod.USER_MINI_GAME}`) {

    //     subWallet.availableBalance =
    //       +subWallet.availableBalance - +transaction.amount;
    //     subWallet.balance = +subWallet.balance - +transaction.amount;
    //     subWallet.totalUsedAmount =
    //       +subWallet.totalUsedAmount + +transaction.amount;
    //     wallet.totalAvailableBalance =
    //       +wallet.totalAvailableBalance - +transaction.amount;
    //     wallet.totalUsedAmount = +wallet.totalUsedAmount + +transaction.amount;
    //     wallet.totalBalance = +wallet.totalBalance - +transaction.amount;
    //   } else if (transaction.method === `${PaymentMethod.WALLET_MINI_GAME}`) {

    //     wallet.totalAvailableBalance =
    //       +wallet.totalAvailableBalance - +transaction.amount;
    //     wallet.totalUsedAmount = +wallet.totalUsedAmount + +transaction.amount;
    //     wallet.totalBalance = +wallet.totalBalance - +transaction.amount;
    //     wallet.balance = +wallet.balance - +transaction.amount;
    //     wallet.availableBalance = +wallet.availableBalance - +transaction.amount;
    //   }

    // } else if (transaction.transType === `${TransactionType.ADJUSTMENT}`) {
    //   if (transaction.method === `${AdjustmentMethod.ADMIN_TO_PLUS}`) {

    //     wallet.balance = +wallet.balance + +transaction.amount;
    //     wallet.totalBalance = +wallet.totalBalance + +transaction.amount;
    //     wallet.totalDeposit = +wallet.totalDeposit + +transaction.amount;
    //     wallet.availableBalance = +wallet.availableBalance + +transaction.amount;
    //     wallet.totalAvailableBalance =
    //       +wallet.totalAvailableBalance + +transaction.amount;
    //   } else if (transaction.method === `${AdjustmentMethod.ADMIN_TO_MINUS}`) {

    //     wallet.balance = +wallet.balance - +transaction.amount;
    //     wallet.totalBalance = +wallet.totalBalance - +transaction.amount;
    //     wallet.totalDeposit = +wallet.totalDeposit - +transaction.amount;
    //     wallet.availableBalance = +wallet.availableBalance - +transaction.amount;
    //     wallet.totalAvailableBalance =
    //       +wallet.totalAvailableBalance - +transaction.amount;
    //   }
    // } else if (transaction.transType === `${TransactionType.REFUND}`) {
    //   if (transaction.method === `${RefundMethod.WALLET_REFUND}`) {

    //     wallet.balance = +wallet.balance + +transaction.amount;
    //     wallet.totalBalance = +wallet.totalBalance + +transaction.amount;
    //     wallet.availableBalance = +wallet.availableBalance + +transaction.amount;
    //     wallet.totalAvailableBalance =
    //       +wallet.totalAvailableBalance + +transaction.amount;
    //   }
    // } else if (transaction.transType === `${TransactionType.POINTS_EARN}`) {
    //   if (transaction.method === `${PointsEarnMethod.WALLET_POINTS_EARN}`) {

    //     wallet.balance = +wallet.balance + +transaction.amount;
    //     wallet.totalBalance = +wallet.totalBalance + +transaction.amount;
    //     wallet.availableBalance = +wallet.availableBalance + +transaction.amount;
    //     wallet.totalAvailableBalance =
    //       +wallet.totalAvailableBalance + +transaction.amount;
    //   }
    // }
  }

  async verifyUserAndWallet(
    username: string,
    gameCode: string,
    transRef1 = ""
  ): Promise<{
    error: ErrorResponse;
    wallet: Wallet;
    subWallet: any;
    user: User;
  }> {
    const { error: errorUser, user } = await this.verifyUsername(username);

    if (errorUser)
      return { error: errorUser, wallet: null, subWallet: null, user: null };
    const { error: errorTransRef1 } = await this.verifyTransRef1(transRef1);

    if (errorTransRef1)
      return {
        error: errorTransRef1,
        wallet: null,
        subWallet: null,
        user: user,
      };

    const walletFound = await this.walletRepository.findOneBy({
      user: { id: user.id },
    });
    const { error: errorWallet, wallet } = await this.verifyWallet(walletFound);

    if (errorWallet)
      return { error: errorUser, wallet: wallet, subWallet: null, user: user };
    const { error: errorGameCode } = await this.verifyGameCode(gameCode);

    if (errorGameCode)
      return {
        error: errorGameCode,
        wallet: wallet,
        subWallet: null,
        user: user,
      };
    let subWallet;

    if (!subWallet) {
      subWallet = await this.initSubWallet(user, walletFound, gameCode);
    }
    const { error: errorSubWallet } = await this.verifySubWallet(subWallet);

    if (errorSubWallet)
      return {
        error: errorSubWallet,
        wallet: wallet,
        subWallet: subWallet,
        user: user,
      };

    return { error: null, wallet: wallet, subWallet: subWallet, user: user };
  }

  async verifyTransTypeAndMethod(
    transaction: Transaction,
    subWallet: any,
    wallet: Wallet
  ): Promise<{ error: ErrorResponse }> {

    // if (!transaction.transType) {
    //   return {
    //     error: new ErrorResponse(
    //       STATUSCODE.TRANS_TYPE_IS_NOT_SUPPORT,
    //       "transfer is not support",
    //       ERROR.UPDATE_FAILED
    //     ),
    //   };
    // }
    // if (transaction.transType === `${TransactionType.DEPOSIT}`) {
    //   return { error: null };
    // } else if (transaction.transType === `${TransactionType.TRANSFER}`) {
    //   if (transaction.method === `${TransferMethod.WALLET_TO_SUB_WALLET}`) {
    //     if (+wallet.availableBalance < transaction.amount) {
    //       return {
    //         error: new ErrorResponse(
    //           STATUSCODE.BALANCE_NOT_ENOUGH,
    //           "wallet balance not enough",
    //           ERROR.UPDATE_FAILED
    //         ),
    //       };
    //     }

    //     return { error: null };
    //   } else if (transaction.method === `${TransferMethod.SUB_WALLET_TO_WALLET}`) {
    //     if (+subWallet.availableBalance < transaction.amount) {
    //       return {
    //         error: new ErrorResponse(
    //           STATUSCODE.BALANCE_NOT_ENOUGH,
    //           "subwallet balance not enough",
    //           ERROR.UPDATE_FAILED
    //         ),
    //       };
    //     }

    //     return { error: null };
    //   }
    // } else if (transaction.transType === `${TransactionType.PAYMENT}`) {
    //   if (transaction.method === `${PaymentMethod.USER_MINI_GAME}`) {
    //     if (+subWallet.availableBalance < transaction.amount) {
    //       return {
    //         error: new ErrorResponse(
    //           STATUSCODE.BALANCE_NOT_ENOUGH,
    //           "balance not enough",
    //           ERROR.UPDATE_FAILED
    //         ),
    //       };
    //     }
    //   } else if (transaction.method === `${PaymentMethod.WALLET_MINI_GAME}`) {
    //     if (+wallet.availableBalance < transaction.amount) {
    //       return {
    //         error: new ErrorResponse(
    //           STATUSCODE.BALANCE_NOT_ENOUGH,
    //           "balance not enough",
    //           ERROR.UPDATE_FAILED
    //         ),
    //       };
    //     }
    //   }
    //   return { error: null };
    // } else if (transaction.transType === `${TransactionType.ADJUSTMENT}`) {

    //   return { error: null };
    // } else if (transaction.transType === `${TransactionType.REFUND}`) {
    //   if (transaction.method === `${RefundMethod.WALLET_REFUND}`) {
    //     return { error: null };
    //   }
    // } else if (transaction.transType === `${TransactionType.POINTS_EARN}`) {
    //   if (transaction.method === `${PointsEarnMethod.WALLET_POINTS_EARN}`) {
    //     return { error: null };
    //   }
    // }

    return {
      error: new ErrorResponse(
        STATUSCODE.TRANS_TYPE_AND_METHOD_IS_NOT_SUPPORT,
        "transaction type and method are not support",
        ERROR.UPDATE_FAILED
      ),
    };
  }

  async initSubWallet(
    user: User,
    walletFound: Wallet,
    gameCode: string
  ): Promise<any> {
    // const subCodeQueue = await this.subCodeQueueRepository.save({});
    const subWalletCode = PrefixEnum.SUB_WALLET_CODE + 1;
    const subWalletDto = {
      gameCode: gameCode,
      walletCode: walletFound.walletCode,
      user: { id: user.id },
      subWalletCode: subWalletCode,
      createdBy: user.username,
    };

    // const subWalletCreate = this.subWalletRepository.create(subWalletDto);
    // const subWallet = await this.subWalletRepository.save(subWalletCreate);
    return null;
  }

  async verifyGameCode(gameCode: string): Promise<{ error: ErrorResponse }> {
    const sysConfig = await this.sysConfigRepository.findOneBy({
      module: SYS_MODULE_ENUM.GAME_CODE,
      item: gameCode,
    });
    if (!sysConfig) {
      return {
        error: new ErrorResponse(
          STATUSCODE.GAME_CODE_INVALID,
          { message: `gameCode invalid` },
          ERROR.USER_NOT_FOUND
        ),
      };
    }
    if (sysConfig.isBlocked) {
      return {
        error: new ErrorResponse(
          STATUSCODE.GAME_CODE_IS_BLOCK,
          { message: `gamecode is blocked` },
          ERROR.USER_NOT_FOUND
        ),
      };
    }
    if (sysConfig.isDeleted) {
      return {
        error: new ErrorResponse(
          STATUSCODE.GAME_CODE_IS_DELETE,
          { message: `gameCode is deleted` },
          ERROR.USER_NOT_FOUND
        ),
      };
    }
    return { error: null };
  }

  async userTopUpWallet(member: User): Promise<BaseResponse> {
    let key = null;

    try {
      key = member.name;
      await this.lockWallet(key);
      const { error: errorUser, user } = await this.verifyUserId(member.id);
      if (errorUser) return errorUser;

      const walletFound = await this.walletRepository.findOneBy({
        user: { id: user.id },
      });
      const { error: errorWallet, wallet } = await this.verifyWallet(
        walletFound
      );
      if (errorWallet) return errorWallet;

      const now = new Date();
      const { deposit, revenue } =
        await this.connectService.getDepositAndRevenueFromToDate(
          user.username,
          now,
          now
        );
      const { rate, conditionDeposit } = await this.getRateAndCondition(1);
      if (deposit < conditionDeposit) {
        return new ErrorResponse(
          STATUSCODE.NOT_ENOUGH_DEPOSIT,
          "not enough conditionDeposit",
          ERROR.CREATE_FAILED
        );
      }
      const sumRevenue = await this.userGetSumRevenueFromToDate(
        user.id,
        now,
        now,
        1
      );
      const revenueAvailable = revenue - +sumRevenue;
      const amount = Math.floor(revenueAvailable / rate);

      if (amount == 0) {
        return new ErrorResponse(
          STATUSCODE.NOT_ENOUGH_REVENUE,
          "not enough revenueAvailable",
          ERROR.CREATE_FAILED
        );
      }

      const newTransaction = {
        amount,
        ft: "",
        deposit: deposit,
        revenue: amount * rate,
        walletCode: wallet?.walletCode,
        transRef1: uuidv4(),
        rate: rate,
        transType: `${TransactionType.DEPOSIT}`,
        method: `${DepositMethod.REVENUE_TO_WALLET}`,
        createdBy: user.username,
        status: StatusSend.INIT,
        createdAt: now,
      };
      const createdTransaction =
        this.transactionRepository.create(newTransaction);
      const { error: methodError } = await this.verifyTransTypeAndMethod(
        createdTransaction,
        null,
        wallet
      );

      if (methodError) return methodError;

      createdTransaction.ft = await this.getTransactionFt();
      const transaction = await this.transactionRepository.save(
        createdTransaction
      );
      wallet.updatedBy = user.username;
      wallet.updatedAt = new Date();
      // wallet.version = wallet.version + 1;et.version = wallet.version + 1;
      transaction.username = user.username;
      await this.processPayment(transaction, wallet, null, true, user);

      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        transaction,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    } finally {
      if (key) {
        await this.unlockWallet(key);
      }
    }
  }

  async getInfoDto(
    getInfoDto: GetUserWalletInfoDto,
    username = ""
  ): Promise<BaseResponse> {
    try {
      const user = await this.userRepository.findOneBy({ username: username });
      if (!user) {
        return new ErrorResponse(
          STATUSCODE.USER_NOT_FOUND,
          "user not found",
          ERROR.NOT_FOUND
        );
      }
      const now = new Date();
      if (!getInfoDto.fromDate || !getInfoDto.toDate) {
        getInfoDto.fromDate = startOfDay(now);
        getInfoDto.toDate = endOfDay(now);
      } else {
        getInfoDto.fromDate = startOfDay(new Date(getInfoDto.fromDate));
        getInfoDto.toDate = endOfDay(new Date(getInfoDto.toDate));
      }
      const promises = [];
      promises.push(this.userGetInfoWallet(user.id, getInfoDto.walletBalance));
      promises.push(this.getRateAndCondition(getInfoDto.rate));
      promises.push(
        this.userGetDepositRevenueFromToDate(
          user.username,
          new Date(getInfoDto.fromDate),
          new Date(getInfoDto.toDate),
          getInfoDto.depositRevenue
        )
      );
      promises.push(
        this.userGetSumRevenueFromToDate(
          user.id,
          new Date(getInfoDto.fromDate),
          new Date(getInfoDto.toDate),
          getInfoDto.sumRevenue
        )
      );
      promises.push(this.userGetSubWallet(user.id, getInfoDto.gamesCode));
      promises.push(this.getSysConfigs(getInfoDto.gameCodeInfo));
      const [
        wallet,
        rateAndCondition,
        depositRevenue,
        sumRevenue,
        subWallets,
        sysConfigs,
      ] = await Promise.all(promises);
      const deposit = depositRevenue?.deposit;
      const revenue = depositRevenue?.revenue;
      const rate = rateAndCondition?.rate;
      const conditionDeposit = rateAndCondition?.conditionDeposit;

      const games: SysConfig[] = [];
      let notiLight = null;
      let lockEarn = null;
      let lockTransfer = null;
      let lockPlay = null;

      if (sysConfigs && sysConfigs.length > 0) {
        for (let i = 0; i < sysConfigs.length; i++) {
          if (sysConfigs[i].module == `${SYS_MODULE_ENUM.GAME_CODE}`)
            games.push(sysConfigs[i]);
          else if (sysConfigs[i].module == `${SYS_MODULE_ENUM.NOTI}` && sysConfigs[i].item == `${SYS_ITEM_ENUM.NOTI_TRAFFIC_LIGHT}`) {
            notiLight = +sysConfigs[i].value;
          }
          else if (sysConfigs[i].module == `${SYS_MODULE_ENUM.CONDITION}` && sysConfigs[i].item == `${SYS_ITEM_ENUM.LOCK_EARN}`) {
            lockEarn = +sysConfigs[i].value;
          }
          else if (sysConfigs[i].module == `${SYS_MODULE_ENUM.CONDITION}` && sysConfigs[i].item == `${SYS_ITEM_ENUM.LOCK_TRANSFER}`) {
            lockTransfer = +sysConfigs[i].value;
          }
          else if (sysConfigs[i].module == `${SYS_MODULE_ENUM.CONDITION}` && sysConfigs[i].item == `${SYS_ITEM_ENUM.LOCK_PLAY}`) {
            lockPlay = +sysConfigs[i].value;
          }
        }
      }

      const result: ResUserWalletInfo = {
        username: user.username,
        wallet,
        rate: +rate,
        deposit: +deposit,
        revenue: +revenue,
        sumRevenue,
        conditionDeposit,
        games,
        subWallets,
        notiLight,
        lockEarn,
        lockTransfer,
        lockPlay,
      };
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        result,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async getSysConfigs(isGet = 0): Promise<SysConfig[]> {
    if (isGet == 0) {
      return null;
    }
    const sysConfigs = await this.sysConfigRepository.findBy({
      module: In([SYS_MODULE_ENUM.GAME_CODE, SYS_MODULE_ENUM.NOTI, SYS_MODULE_ENUM.CONDITION]),
    });
    return sysConfigs;
  }

  async userGetSubWallet(userId: number, gamesCode: string[]): Promise<any> {
    if (!gamesCode || gamesCode.length == 0) {
      return null;
    }
    // const subWallets = await this.subWalletRepository.findBy({
    //   gameCode: In(gamesCode),
    //   user: { id: userId },
    // });
    return null;
  }

  async userGetSumRevenueFromToDate(
    userId: number,
    fromDate: Date,
    toDate: Date,
    isGet = 0
  ): Promise<number> {
    if (isGet == 0) {
      return null;
    }
    const wallet = await this.userGetInfoWallet(userId, 1);
    if (!wallet || wallet.isBlock || wallet.isDelete) {
      return null;
    }
    const walletCode = wallet?.walletCode;
    const from = startOfDay(fromDate);
    const to = endOfDay(toDate);

    const sum = await this.transactionRepository
      .createQueryBuilder("transaction")
      .select("SUM(transaction.revenue)", "sum")
      .where("transaction.walletCode = :walletCode", { walletCode })
      .andWhere("transaction.createdAt > :from", { from })
      .andWhere("transaction.createdAt < :to", { to })
      .andWhere("transaction.status = :status", { status: "SUCCESS" })
      .getRawOne();
    const sumRevenue = sum?.sum || 0;

    return +sumRevenue;
  }

  async userGetDepositRevenueFromToDate(
    username: string,
    fromDate: Date,
    toDate: Date,
    isGet = 0
  ): Promise<{ deposit: number; revenue: number }> {
    if (isGet == 0) {
      return null;
    }
    return this.connectService.getDepositAndRevenueFromToDate(
      username,
      fromDate,
      toDate
    );
  }

  // async userGetDeposit(
  //   username: string,
  //   fromDate: Date,
  //   toDate: Date
  // ): Promise<any> {
  //   return this.connectService.getDepositFromToDate(username, fromDate, toDate);
  // }

  async getRateAndCondition(isGet = 0): Promise<{
    rate: number;
    conditionDeposit: number;
  }> {
    if (isGet == 0) {
      return null;
    }
    const sysConfigs = await this.sysConfigRepository.findBy({
      module: SYS_MODULE_ENUM.CONDITION,
    });
    const rate = sysConfigs.find(
      (config) => config.item === `${SYS_ITEM_ENUM.CONDITION_RATE}`
    )?.value;
    const conditionDeposit = sysConfigs.find(
      (config) => config.item === `${SYS_ITEM_ENUM.CONDITION_DEPOSIT}`
    )?.value;
    return { rate: +rate, conditionDeposit: +conditionDeposit };
  }

  async userGetInfoWallet(id: number, isGet = 0): Promise<WalletInfo> {
    if (isGet == 0) {
      return null;
    }
    // const wallet = await this.walletRepository.findOneBy({ user: { id } });
    // if (wallet) {
    //   const walletInfo: WalletInfo = {
    //     availableBalance: wallet.availableBalance,
    //     balance: wallet.balance,
    //     holdBalance: wallet.holdBalance,
    //     totalBalance: wallet.totalBalance,
    //     totalUsedAmount: wallet.totalUsedAmount,
    //     totalAvailableBalance: wallet.totalAvailableBalance,
    //     walletCode: wallet.walletCode,
    //     isBlock: wallet.isBlock,
    //     isDelete: wallet.isDelete,
    //   };
    //   return walletInfo;
    // }

    return null;
  }

  async getAll(
    paginationQueryDto: PaginationQueryDto,
    user: any = null
  ): Promise<BaseResponse> {
    try {
      const object: any = JSON.parse(paginationQueryDto.keyword);

      const listTransaction = await this.searchByTransaction(
        paginationQueryDto,
        object,
        user
      );

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listTransaction,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async searchByTransaction(
    paginationQuery: PaginationQueryDto,
    TransactionDto: any,
    user: any = null
  ) {
    const { member } = await this.getRoleById(user.id);
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }

    const skip = +perPage * +page - +perPage;
    const searching = await this.transactionRepository.findAndCount({
      where: this.holdQuery(TransactionDto, member),
      take: +perPage,
      skip,
      order: { id: paginationQuery.order },
    });

    return searching;
  }

  holdQuery(object: any = null, member: any = null) {
    const data: any = {};
    if (member) {
      data.username = member.username;

      if (!object) return data;
      for (const key in object) {
        switch (key) {
          case "type":
            data.type = object.type;
            break;
          case "transType":
            data.transType = object.transType;
            break;
          case "method":
            data.method = object.method;
            break;
          default:
            break;
        }
        if (key === "startDate" || key === "endDate") {
          const startDate = new Date(object.startDate);
          const endDate = new Date(object.endDate);
          data.createdAt = Between(startOfDay(startDate), endOfDay(endDate));
        }
      }
    } else {
      if (!object) return data;
      for (const key in object) {
        switch (key) {
          case "username":
            data.username = object.username;
            break;
          case "createdBy":
            data.createdBy = object.createdBy;
            break;
          case "type":
            data.type = object.type;
            break;
          case "method":
            data.method = object.method;
            break;
          case "transType":
            data.transType = object.transType;
            break;
          default:
            break;
        }

        if (key === "startDate" || key === "endDate") {
          const startDate = new Date(object.startDate);
          const endDate = new Date(object.endDate);
          data.createdAt = Between(startOfDay(startDate), endOfDay(endDate));
        }
      }
    }

    return data;
  }

  async getRoleById(id: number): Promise<any> {
    const user = await this.userRepository.findOne({
      select: {
        id: true,
        isBlocked: true,
        username: true,
      },
      where: {
        id,
        role: UserRoles.MEMBER,
        isBlocked: false,
      },
    });
    if (!user) {
      return {
        error: new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          { message: `Not found userId ${id}` },
          ERROR.USER_NOT_FOUND
        ),
      };
    }

    return { member: user };
  }

  async getOneById(id: number): Promise<BaseResponse> {
    try {
      const foundTransaction = await this.transactionRepository.findOneBy({
        id,
      });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        foundTransaction,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async verifyUserId(id: any): Promise<{ error: ErrorResponse; user: User }> {
    const user = await this.userRepository.findOne({
      select: {
        id: true,
        username: true,
        name: true,
      },
      where: {
        id,
      },
    });
    if (!user) {
      return {
        error: new ErrorResponse(
          STATUSCODE.USER_NOT_FOUND,
          { message: `Not found userId ${id}` },
          ERROR.USER_NOT_FOUND
        ),
        user: null,
      };
    }

    if (user.isBlocked || user.isDeleted) {
      return {
        error: new ErrorResponse(
          STATUSCODE.USER_IS_INVALID,
          { message: `User invalid, id ${id}` },
          ERROR.USER_NOT_FOUND
        ),
        user: null,
      };
    }

    return { error: null, user };
  }

  async verifyUsername(
    username: string
  ): Promise<{ error: ErrorResponse; user: User }> {
    const user = await this.userRepository.findOne({
      select: {
        id: true,
        username: true,
        name: true,
      },
      where: {
        username,
      },
    });
    if (!user) {
      return {
        error: new ErrorResponse(
          STATUSCODE.USER_NOT_FOUND,
          { message: `user not found ${username}` },
          ERROR.USER_NOT_FOUND
        ),
        user: null,
      };
    }

    if (user.isBlocked || user.isDeleted) {
      return {
        error: new ErrorResponse(
          STATUSCODE.USER_IS_INVALID,
          { message: `User invalid, id ${username}` },
          ERROR.USER_NOT_FOUND
        ),
        user: null,
      };
    }

    return { error: null, user };
  }

  async adminAdjustmentPlus(
    topUpTransMain: TopUpMainRequestDto,
    admin: User
  ): Promise<BaseResponse> {
    let key = null;
    try {
      topUpTransMain.transRef1 = uuidv4();
      const { error, wallet, user } = await this.verifyTopUpWallet(
        topUpTransMain.username,
        topUpTransMain.transRef1
      );
      if (error) return error;
      key = wallet.walletCode;
      const newTransaction = {
        ...topUpTransMain,
        createdBy: admin.name,
        status: StatusSend.REQUEST,
        transType: `${TransactionType.ADJUSTMENT}`,
        method: `${AdjustmentMethod.ADMIN_TO_PLUS}`,
        note: topUpTransMain.note,
      };
      const createdTransaction =
        this.transactionRepository.create(newTransaction);
      createdTransaction.walletCode = wallet.walletCode;
      createdTransaction.ft = await this.getTransactionFt();
      createdTransaction.username = user.username;
      const { error: methodError } = await this.verifyTransTypeAndMethod(
        createdTransaction,
        null,
        wallet
      );

      if (methodError) return methodError;
      await this.transactionRepository.save(createdTransaction);

      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        createdTransaction,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    } finally {
      if (key) {
        await this.unlockWallet(key);
      }
    }
  }

  async adminAdjustmentMinus(
    topUpTransMain: TopUpMainRequestDto,
    admin: User
  ): Promise<BaseResponse> {
    let key = null;
    try {
      topUpTransMain.transRef1 = uuidv4();
      const { error, wallet, user } = await this.verifyTopUpWallet(
        topUpTransMain.username,
        topUpTransMain.transRef1
      );
      if (error) return error;
      key = wallet.walletCode;
      const newTransaction = {
        ...topUpTransMain,
        createdBy: admin.name,
        status: StatusSend.REQUEST,
        transType: `${TransactionType.ADJUSTMENT}`,
        method: `${AdjustmentMethod.ADMIN_TO_MINUS}`,
        note: topUpTransMain.note,
      };
      const createdTransaction =
        this.transactionRepository.create(newTransaction);
      createdTransaction.walletCode = wallet.walletCode;
      createdTransaction.ft = await this.getTransactionFt();
      createdTransaction.username = user.username;
      const { error: methodError } = await this.verifyTransTypeAndMethod(
        createdTransaction,
        null,
        wallet
      );

      if (methodError) return methodError;
      await this.transactionRepository.save(createdTransaction);

      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        createdTransaction,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    } finally {
      if (key) {
        await this.unlockWallet(key);
      }
    }
  }

  async adminApprove(
    topUpTransMain: TopUpMainRequestDto,
    transId: number,
    user: User
  ): Promise<BaseResponse> {
    let key = null;

    try {
      key = topUpTransMain.username;
      await this.lockWallet(key);
      const transaction = await this.transactionRepository.findOneBy({
        id: transId,
      });

      if (!transaction) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Transaction with id: ${transId} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (transaction.status != `${StatusSend.REQUEST}`) {
        return new ErrorResponse(
          STATUSCODE.COMMON_INTERNAL_ERROR,
          `Transaction with id ${transId} status invalid!`,
          ERROR.NOT_FOUND
        );
      }

      let foundWallet = await this.walletRepository.findOne({
        relations: ["user"],
        where: { walletCode: transaction.walletCode }
      });


      const { error: errorWallet, wallet } = await this.verifyWallet(
        foundWallet
      );
      if (errorWallet) {
        return errorWallet;
      }
      const { error: methodError } = await this.verifyTransTypeAndMethod(
        transaction,
        null,
        wallet
      );
      if (methodError) return methodError;

      const now = new Date();
      // wallet.version = wallet.version + 1;
      wallet.updatedBy = transaction.createdBy;
      wallet.updatedAt = now;
      transaction.approverNote = topUpTransMain.note;
      transaction.approvedAt = now;
      transaction.approvedBy = user.name;
      await this.processPayment(transaction, wallet, null, true, foundWallet.user);

      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        transaction,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    } finally {
      if (key) {
        await this.unlockWallet(key);
      }
    }
  }

  async adminReject(
    topUpTransMain: TopUpMainRequestDto,
    transId: number,
    user: User
  ): Promise<BaseResponse> {
    try {
      const transaction = await this.transactionRepository.findOneBy({
        id: transId,
      });

      if (!transaction) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Transaction with id: ${transId} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (transaction.status != `${StatusSend.REQUEST}`) {
        return new ErrorResponse(
          STATUSCODE.COMMON_INTERNAL_ERROR,
          `Transaction with id ${transId} status invalid!`,
          ERROR.NOT_FOUND
        );
      }
      transaction.status = `${StatusSend.REJECT}`;
      transaction.approvedBy = user.name;
      transaction.approvedAt = new Date();
      transaction.approverNote = topUpTransMain.note;

      await this.transactionRepository.save(transaction);

      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        transaction,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async verifyTopUpWallet(
    username = "",
    transRef1 = ""
  ): Promise<{ error: ErrorResponse; wallet: Wallet; user: User }> {
    const { error } = await this.verifyTransRef1(transRef1);
    if (error) return { error, wallet: null, user: null };

    const { error: errorUser, user } = await this.verifyUsername(username);
    if (errorUser) return { error: errorUser, wallet: null, user: null };

    const walletFound = await this.walletRepository.findOneBy({
      user: { id: user.id },
    });
    const { error: errorWallet, wallet } = await this.verifyWallet(walletFound);
    if (errorWallet) return { error: errorWallet, wallet: null, user: null };

    return { error: null, wallet, user: user };
  }

  async verifyWallet(
    walletFound: Wallet
  ): Promise<{ error: ErrorResponse; wallet: Wallet }> {
    if (!walletFound) {
      return {
        error: new ErrorResponse(
          STATUSCODE.MAIN_WALLET_NOT_EXIST,
          `wallet is not exist`,
          ERROR.NOT_FOUND
        ),
        wallet: null,
      };
    }
    // if (walletFound.isBlock) {
    //   return {
    //     error: new ErrorResponse(
    //       STATUSCODE.MAIN_WALLET_IS_BLOCK,
    //       `wallet is block`,
    //       ERROR.NOT_FOUND
    //     ),
    //     wallet: null,
    //   };
    // }
    if (walletFound.isDelete) {
      return {
        error: new ErrorResponse(
          STATUSCODE.MAIN_WALLET_IS_DELETE,
          `wallet is delete`,
          ERROR.NOT_FOUND
        ),
        wallet: null,
      };
    }

    return { error: null, wallet: walletFound };
  }

  async verifySubWallet(
    subWallet: any
  ): Promise<{ error: ErrorResponse; subWallet: any }> {
    if (!subWallet) {
      return {
        error: new ErrorResponse(
          STATUSCODE.MAIN_WALLET_NOT_EXIST,
          `sub wallet is not exist`,
          ERROR.NOT_FOUND
        ),
        subWallet: null,
      };
    }

    if (subWallet.isBlock) {
      return {
        error: new ErrorResponse(
          STATUSCODE.MAIN_WALLET_IS_BLOCK,
          `sub wallet is block`,
          ERROR.NOT_FOUND
        ),
        subWallet: null,
      };
    }

    if (subWallet.isDelete) {
      return {
        error: new ErrorResponse(
          STATUSCODE.MAIN_WALLET_IS_DELETE,
          `sub wallet is delete`,
          ERROR.NOT_FOUND
        ),
        subWallet: null,
      };
    }
    return { error: null, subWallet: subWallet };
  }

  async verifyTransRef1(transRef1: string): Promise<{ error: ErrorResponse }> {
    const trans = await this.transactionRepository.findOneBy({
      transRef1: transRef1,
    });
    if (trans) {
      return {
        error: new ErrorResponse(
          STATUSCODE.TRANS_EXIST,
          `transRef1 duplicate ${transRef1}`,
          ERROR.NOT_FOUND
        ),
      };
    }
    return { error: null };
  }

  async getTransactionFt(): Promise<string> {
    const ftQueue = await this.transFtRepository.save({});
    const ft =
      PrefixEnum.FT +
      Helper.formatDateToYYMMDD(new Date()) +
      ftQueue.id.toString(16);

    return ft;
  }

  async update(
    id: number,
    updateTransactionDto: UpdateTransactionDto
  ): Promise<any> {
    try {
      let foundTransaction = await this.transactionRepository.findOneBy({
        id,
      });

      if (!foundTransaction) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Transaction with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      foundTransaction = {
        ...foundTransaction,
        ...updateTransactionDto,
      };
      await this.transactionRepository.save(foundTransaction);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        foundTransaction,
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
  }

  async delete(id: number): Promise<BaseResponse> {
    try {
      const foundTransaction = await this.transactionRepository.findOneBy({
        id,
      });

      if (!foundTransaction) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Transaction with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.transactionRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `Transaction has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }

  async deleteDataFake() {
    const currentDate = new Date();
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    try {
      const listUserFake = await this.userRepository.find({
        where: {
          usernameReal: Not(""),
          createdAt: LessThan(yesterday)
        }
      });

      if (listUserFake?.length > 0) {
        const deletePro = listUserFake?.map(async (user) => {
          // delete transaction
          const listTransactionFake = await this.transactionRepository.find({
            where: {
              username: user?.username,
            }
          });
          if (listTransactionFake?.length > 0) {
            listTransactionFake?.map(async (tra) => {
              await this.transactionRepository.delete(tra?.id)
            });
          }

          // delete wallet
          const listWalletFake = await this.walletRepository.find({
            where: {
              user: {
                username: user?.username
              }
            }
          });
          if (listWalletFake?.length > 0) {
            listWalletFake?.map(async (wallet) => {
              await this.walletRepository.delete(wallet?.id)
            });
          }

          // delete wallet history
          const listWalletHisFake = await this.walletHistoryRepository.find({
            where: {
              user: {
                username: user?.username
              }
            }
          });
          if (listWalletHisFake?.length > 0) {
            listWalletHisFake?.map(async (walletHis) => {
              await this.walletHistoryRepository.delete(walletHis?.hisId)
            });
          }

          await this.userRepository.delete(user?.id);

          await this.orderRequestService.deleteDataFake(user?.username);
        })

        await Promise.all(deletePro);
      }
    } catch (error) {
      this.logger.debug(
        `${TransactionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}
