import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsInt,
  IsPositive,
} from 'class-validator';

export class CreateCafeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  tipoId: number;
}
