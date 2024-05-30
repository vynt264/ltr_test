import { Test, TestingModule } from '@nestjs/testing';
import { ManagementUserInfoController } from './management-user-info.controller';
import { ManagementUserInfoService } from './management-user-info.service';

describe('ManagementUserInfoController', () => {
  let controller: ManagementUserInfoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManagementUserInfoController],
      providers: [ManagementUserInfoService],
    }).compile();

    controller = module.get<ManagementUserInfoController>(ManagementUserInfoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
