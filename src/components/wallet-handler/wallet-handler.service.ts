import { Injectable } from '@nestjs/common';
import { CreateWalletHandlerDto } from './dto/create-wallet-handler.dto';
import { UpdateWalletHandlerDto } from './dto/update-wallet-handler.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { Repository } from 'typeorm';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { OrderHelper } from 'src/common/helper';

@Injectable()
export class WalletHandlerService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private readonly redisService: RedisCacheService,

  ) { }

  create(createWalletHandlerDto: CreateWalletHandlerDto) {
    return this.walletRepository.save(createWalletHandlerDto);
  }

  findAll() {
    return `This action returns all walletHandler`;
  }

  findOne(id: number) {
    return this.walletRepository.findOne({
      where: {
        user: { id: id },
      },
    });
  }

  async findWalletByUserId(userId: number) {
    const balance = await this.redisService.get(OrderHelper.getKeySaveBalanceOfUser(userId.toString()));

    if(!balance && balance !== 0) {
      return {
        id: userId,
        balance: Number(balance),
      }
    }

    return this.walletRepository.findOneBy({
      user: { id: userId }
    });
  }

  update(id: number, updateWalletHandlerDto: UpdateWalletHandlerDto) {
    return this.walletRepository.update(id, updateWalletHandlerDto);
  }

  async updateWalletByUserId(userId: number, updateWalletHandlerDto: any) {
    const wallet = await this.findWalletByUserId(userId);
    wallet.balance = updateWalletHandlerDto.balance;
    return this.walletRepository.save(wallet);
  }

  async updateWallet(userId: number, remainBalance: number) {
    return this.walletRepository.update({ user: { id: userId } }, { balance: remainBalance });
  }

  remove(id: number) {
    return `This action removes a #${id} walletHandler`;
  }
}
