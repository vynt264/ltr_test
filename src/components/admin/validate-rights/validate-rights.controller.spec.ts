import { Test, TestingModule } from '@nestjs/testing';
import { ValidateRightsController } from './validate-rights.controller';
import { ValidateRightsService } from './validate-rights.service';

describe('ValidateRightsController', () => {
  let controller: ValidateRightsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValidateRightsController],
      providers: [ValidateRightsService],
    }).compile();

    controller = module.get<ValidateRightsController>(ValidateRightsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
