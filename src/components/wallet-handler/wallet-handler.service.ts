import { Injectable } from '@nestjs/common';
import { CreateWalletHandlerDto } from './dto/create-wallet-handler.dto';
import { UpdateWalletHandlerDto } from './dto/update-wallet-handler.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WalletHandlerService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>
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
    return this.walletRepository.findOneBy({
      user: { id: userId }
    });
  }

  update(id: number, updateWalletHandlerDto: UpdateWalletHandlerDto) {
    return this.walletRepository.update(id, updateWalletHandlerDto);
  }

  remove(id: number) {
    return `This action removes a #${id} walletHandler`;
  }
}
