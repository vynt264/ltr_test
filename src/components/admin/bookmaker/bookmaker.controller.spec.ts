import { Test, TestingModule } from '@nestjs/testing';
import { BookmakerController } from './bookmaker.controller';
import { BookmakerService } from './bookmaker.service';

describe('BookmakerController', () => {
  let controller: BookmakerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmakerController],
      providers: [BookmakerService],
    }).compile();

    controller = module.get<BookmakerController>(BookmakerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
