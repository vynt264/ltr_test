import { Test, TestingModule } from '@nestjs/testing';
import { ManageBonusPriceService } from './manage-bonus-price.service';

describe('ManageBonusPriceService', () => {
  let service: ManageBonusPriceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManageBonusPriceService],
    }).compile();

    service = module.get<ManageBonusPriceService>(ManageBonusPriceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
