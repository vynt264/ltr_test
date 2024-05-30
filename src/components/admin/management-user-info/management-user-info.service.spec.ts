import { Test, TestingModule } from '@nestjs/testing';
import { ManagementUserInfoService } from './management-user-info.service';

describe('ManagementUserInfoService', () => {
  let service: ManagementUserInfoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManagementUserInfoService],
    }).compile();

    service = module.get<ManagementUserInfoService>(ManagementUserInfoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
