import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { ManualProjection } from './manual-projection.entity';

@Entity('users')
export class User {
  @PrimaryColumn()
  rut: string;

  @OneToMany(() => ManualProjection, (proj) => proj.user)
  proyecciones: ManualProjection[];
}
