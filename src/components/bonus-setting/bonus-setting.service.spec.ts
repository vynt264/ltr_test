import { Test, TestingModule } from '@nestjs/testing';
import { BonusSettingService } from './bonus-setting.service';

describe('BonusSettingService', () => {
  let service: BonusSettingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BonusSettingService],
    }).compile();

    service = module.get<BonusSettingService>(BonusSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
