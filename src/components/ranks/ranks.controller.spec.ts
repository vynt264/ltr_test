import { Test, TestingModule } from '@nestjs/testing';
import { RanksController } from './ranks.controller';
import { RanksService } from './ranks.service';

describe('RanksController', () => {
  let controller: RanksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RanksController],
      providers: [RanksService],
    }).compile();

    controller = module.get<RanksController>(RanksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
