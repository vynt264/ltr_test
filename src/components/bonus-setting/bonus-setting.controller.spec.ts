import { Test, TestingModule } from '@nestjs/testing';
import { BonusSettingController } from './bonus-setting.controller';
import { BonusSettingService } from './bonus-setting.service';

describe('BonusSettingController', () => {
  let controller: BonusSettingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BonusSettingController],
      providers: [BonusSettingService],
    }).compile();

    controller = module.get<BonusSettingController>(BonusSettingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
