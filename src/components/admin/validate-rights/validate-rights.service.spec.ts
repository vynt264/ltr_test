import { Test, TestingModule } from '@nestjs/testing';
import { ValidateRightsService } from './validate-rights.service';

describe('ValidateRightsService', () => {
  let service: ValidateRightsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidateRightsService],
    }).compile();

    service = module.get<ValidateRightsService>(ValidateRightsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
