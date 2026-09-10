import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsIn,
  IsPositive,
} from 'class-validator';

// Valores por defecto
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export class QueryCafeDto {
  @IsOptional()
  @IsInt() // Es un número
  @IsPositive() // Es positivo
  @Type(() => Number) // Convertir string de query a número
  tipoId?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'id';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderBy?: 'ASC' | 'DESC' = 'ASC';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = DEFAULT_PAGE;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  @Type(() => Number)
  limit?: number = DEFAULT_LIMIT;
}
