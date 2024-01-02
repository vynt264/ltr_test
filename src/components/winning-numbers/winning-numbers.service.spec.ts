import { Test, TestingModule } from '@nestjs/testing';
import { WinningNumbersService } from './winning-numbers.service';

describe('WinningNumbersService', () => {
  let service: WinningNumbersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WinningNumbersService],
    }).compile();

    service = module.get<WinningNumbersService>(WinningNumbersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
