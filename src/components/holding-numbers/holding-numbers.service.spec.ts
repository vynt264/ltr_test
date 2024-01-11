import { Test, TestingModule } from '@nestjs/testing';
import { HoldingNumbersService } from './holding-numbers.service';

describe('HoldingNumbersService', () => {
  let service: HoldingNumbersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HoldingNumbersService],
    }).compile();

    service = module.get<HoldingNumbersService>(HoldingNumbersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
