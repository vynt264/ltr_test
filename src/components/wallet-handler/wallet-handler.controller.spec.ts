import { Test, TestingModule } from '@nestjs/testing';
import { WalletHandlerController } from './wallet-handler.controller';
import { WalletHandlerService } from './wallet-handler.service';

describe('WalletHandlerController', () => {
  let controller: WalletHandlerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletHandlerController],
      providers: [WalletHandlerService],
    }).compile();

    controller = module.get<WalletHandlerController>(WalletHandlerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
