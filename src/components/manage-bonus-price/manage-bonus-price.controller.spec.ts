import { Test, TestingModule } from '@nestjs/testing';
import { ManageBonusPriceController } from './manage-bonus-price.controller';
import { ManageBonusPriceService } from './manage-bonus-price.service';

describe('ManageBonusPriceController', () => {
  let controller: ManageBonusPriceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManageBonusPriceController],
      providers: [ManageBonusPriceService],
    }).compile();

    controller = module.get<ManageBonusPriceController>(ManageBonusPriceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
