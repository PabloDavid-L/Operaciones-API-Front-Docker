import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { CreateCafeDto } from './dto/create-cafe.dto';
import { UpdateCafeDto } from './dto/update-cafe.dto';
import { Cafe } from './entities/cafe.entity';
import { QueryCafeDto } from './dto/query-cafe.dto';

@Injectable()
export class CafesService {
  constructor(
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
  ) {}

  async create(createCafeDto: CreateCafeDto): Promise<Cafe> {
    const { name, description, tipoId } = createCafeDto;

    const cafeToCreate = {
      name: name,
      description: description,
      tipo: { id: tipoId }, // Asigna la relación por ID
    };

    const cafe = this.cafeRepository.create(cafeToCreate);
    return this.cafeRepository.save(cafe);
  }

  async findAll(query: QueryCafeDto): Promise<Cafe[]> {
    const {
      tipoId,
      description,
      sortBy = 'id',
      orderBy = 'ASC',
      page = 1,
      limit = 10,
    } = query;

    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Cafe> = {};

    // Filtro por tipoId
    if (tipoId) {
      where.tipo = { id: tipoId }; // Asignamos al objeto 'where'
    }

    // Filtro por descripción
    if (description) {
      where.description = ILike(`%${description}%`); // Asignamos al objeto 'where'
    }

    // Construir las opciones finales
    const options: FindManyOptions<Cafe> = {
      relations: ['tipo'],
      where: where,
      order: {
        [sortBy]: orderBy.toUpperCase() as 'ASC' | 'DESC',
      },
      skip: skip,
      take: limit,
    };

    return this.cafeRepository.find(options);
  }

  async findOne(id: number): Promise<Cafe> {
    const cafe = await this.cafeRepository.findOne({
      where: { id },
      relations: ['tipo'],
    });
    if (!cafe) {
      throw new NotFoundException(`Café con id #${id} no encontrado`);
    }
    return cafe;
  }

  async update(id: number, updateCafeDto: UpdateCafeDto): Promise<Cafe> {
    const { tipoId, ...restOfDto } = updateCafeDto;

    const dataToPreload: Partial<Cafe> = { ...restOfDto };

    if (tipoId) {
      dataToPreload.tipo = { id: tipoId } as any;
    }

    const cafe = await this.cafeRepository.preload({
      id: id,
      ...dataToPreload,
    });

    if (!cafe) {
      throw new NotFoundException(
        `Update failed: Café con id #${id} no encontrado`,
      );
    }
    return this.cafeRepository.save(cafe);
  }

  async remove(id: number): Promise<Cafe> {
    const cafe = await this.findOne(id);
    return this.cafeRepository.remove(cafe);
  }
}