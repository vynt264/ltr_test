import { Test, TestingModule } from '@nestjs/testing';
import { BookmakerService } from './bookmaker.service';

describe('BookmakerService', () => {
  let service: BookmakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookmakerService],
    }).compile();

    service = module.get<BookmakerService>(BookmakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
