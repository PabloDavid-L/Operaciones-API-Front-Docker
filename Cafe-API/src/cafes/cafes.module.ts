import { Module } from '@nestjs/common';
import { CafesService } from './cafes.service';
import { CafesController } from './cafes.controller';
import { Cafe } from './entities/cafe.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Cafe])],
  controllers: [CafesController],
  providers: [CafesService],
})
export class CafesModule {}
