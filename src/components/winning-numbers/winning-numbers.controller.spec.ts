import { Test, TestingModule } from '@nestjs/testing';
import { WinningNumbersController } from './winning-numbers.controller';
import { WinningNumbersService } from './winning-numbers.service';

describe('WinningNumbersController', () => {
  let controller: WinningNumbersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WinningNumbersController],
      providers: [WinningNumbersService],
    }).compile();

    controller = module.get<WinningNumbersController>(WinningNumbersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
