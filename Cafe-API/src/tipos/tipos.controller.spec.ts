import { Test, TestingModule } from '@nestjs/testing';
import { TiposController } from './tipos.controller';
import { TiposService } from './tipos.service';

describe('TiposController', () => {
  let controller: TiposController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiposController],
      providers: [TiposService],
    }).compile();

    controller = module.get<TiposController>(TiposController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
