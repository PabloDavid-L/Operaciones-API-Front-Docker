import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CafesService } from './cafes.service';
import { CreateCafeDto } from './dto/create-cafe.dto';
import { UpdateCafeDto } from './dto/update-cafe.dto';
import { QueryCafeDto } from './dto/query-cafe.dto';

@Controller('cafes')
export class CafesController {
  constructor(private readonly cafesService: CafesService) {}

  @Post()
  create(@Body() createCafeDto: CreateCafeDto) {
    console.log('Creando un Cafe');
    return this.cafesService.create(createCafeDto);
  }

  // findAll ahora maneja los filtros
  @Get()
  findAll(@Query() query: QueryCafeDto) {
    console.log('Buscando Cafes');
    return this.cafesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log('Buscando un Cafe');
    return this.cafesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCafeDto: UpdateCafeDto) {
    console.log('Actualizando un Cafe');
    return this.cafesService.update(+id, updateCafeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    console.log('Eliminando un Cafe');
    return this.cafesService.remove(+id);
  }
}
