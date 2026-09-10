import { Tipo } from 'src/tipos/entities/tipo.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Cafe {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column()
  description: string;
  @ManyToOne(() => Tipo, (tipo) => tipo.cafes, { onDelete: 'CASCADE' })
  tipo: Tipo;
}
