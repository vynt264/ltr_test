import { Test, TestingModule } from '@nestjs/testing';
import { WalletHandlerService } from './wallet-handler.service';

describe('WalletHandlerService', () => {
  let service: WalletHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletHandlerService],
    }).compile();

    service = module.get<WalletHandlerService>(WalletHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
