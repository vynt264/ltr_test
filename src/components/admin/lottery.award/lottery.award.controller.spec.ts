import { Test, TestingModule } from '@nestjs/testing';
import { LotteryAwardController } from './lottery.award.controller';
import { LotteryAwardService } from './lottery.award.service';

describe('LotteryAwardController', () => {
  let controller: LotteryAwardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LotteryAwardController],
      providers: [LotteryAwardService],
    }).compile();

    controller = module.get<LotteryAwardController>(LotteryAwardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
