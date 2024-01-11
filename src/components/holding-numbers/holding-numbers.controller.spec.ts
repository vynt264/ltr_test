import { Test, TestingModule } from '@nestjs/testing';
import { HoldingNumbersController } from './holding-numbers.controller';
import { HoldingNumbersService } from './holding-numbers.service';

describe('HoldingNumbersController', () => {
  let controller: HoldingNumbersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HoldingNumbersController],
      providers: [HoldingNumbersService],
    }).compile();

    controller = module.get<HoldingNumbersController>(HoldingNumbersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
