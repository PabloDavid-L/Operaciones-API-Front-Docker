import { Cafe } from 'src/cafes/entities/cafe.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Tipo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @OneToMany(() => Cafe, (cafe) => cafe.tipo)
  cafes: Cafe[];
}
