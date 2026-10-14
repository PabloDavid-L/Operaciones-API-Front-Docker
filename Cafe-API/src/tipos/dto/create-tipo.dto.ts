import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateTipoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3) // requerir al menos 3 caracteres
  name: string;

  @IsString()
  @IsOptional() // la descripción opcional
  description: string;
}
