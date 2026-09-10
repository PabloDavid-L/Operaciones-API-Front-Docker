import { PartialType } from '@nestjs/mapped-types';
import { CreateCafeDto } from './create-cafe.dto';

//toma las propiedades de createCafeDto
export class UpdateCafeDto extends PartialType(CreateCafeDto) {}
