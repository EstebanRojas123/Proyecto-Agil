// src/manual-projection/entities/manual-projection.entity.ts

import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ProjectedSemester } from './projected-semester.entity';

@Entity('manual_projections')
export class ManualProjection {
  @PrimaryColumn()
  id: string; // proy_...

  @CreateDateColumn()
  fechaCreacion: Date;

  @ManyToOne(() => User, (user: User) => user.proyecciones, {
    onDelete: 'CASCADE',
  })
  user: User;

  @OneToMany(
    () => ProjectedSemester,
    (sem: ProjectedSemester) => sem.projection,
    { cascade: true },
  )
  semestres: ProjectedSemester[];
}
