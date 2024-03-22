import { Test, TestingModule } from '@nestjs/testing';
import { LotteryAwardService } from './lottery.award.service';

describe('LotteryAwardService', () => {
  let service: LotteryAwardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LotteryAwardService],
    }).compile();

    service = module.get<LotteryAwardService>(LotteryAwardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
