import { Test, TestingModule } from '@nestjs/testing';
import { LotteriesController } from './lotteries.controller';
import { LotteriesService } from './lotteries.service';

describe('LotteriesController', () => {
  let controller: LotteriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LotteriesController],
      providers: [LotteriesService],
    }).compile();

    controller = module.get<LotteriesController>(LotteriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
