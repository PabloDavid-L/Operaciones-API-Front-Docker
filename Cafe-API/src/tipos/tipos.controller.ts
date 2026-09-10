import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TiposService } from './tipos.service';
import { CreateTipoDto } from './dto/create-tipo.dto';
import { UpdateTipoDto } from './dto/update-tipo.dto';

@Controller('tipos')
export class TiposController {
  constructor(private readonly tiposService: TiposService) {}

  //Crea un tipo
  @Post()
  create(@Body() createTipoDto: CreateTipoDto) {
    console.log('Creando un nuevo tipo');
    return this.tiposService.create(createTipoDto);
  }

  //Retorna todos los tipos
  @Get()
  findAll() {
    console.log('Obteniendo todos los tipos');
    return this.tiposService.findAll();
  }

  //Retorna un tipo por Id
  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log(`Obteniendo tipo con ID: ${id}`);
    return this.tiposService.findOne(+id);
  }

  //Actualiza un tipo
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTipoDto: UpdateTipoDto) {
    console.log(`Actualizando tipo con ID: ${id}`);
    return this.tiposService.update(+id, updateTipoDto);
  }

  //Elimina un tipo
  @Delete(':id')
  remove(@Param('id') id: string) {
    console.log(`Eliminando tipo con ID: ${id}`);
    return this.tiposService.remove(+id);
  }
}
