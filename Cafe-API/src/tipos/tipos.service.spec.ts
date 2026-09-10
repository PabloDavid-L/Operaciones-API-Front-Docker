import { Test, TestingModule } from '@nestjs/testing';
import { TiposService } from './tipos.service';

describe('TiposService', () => {
  let service: TiposService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TiposService],
    }).compile();

    service = module.get<TiposService>(TiposService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
