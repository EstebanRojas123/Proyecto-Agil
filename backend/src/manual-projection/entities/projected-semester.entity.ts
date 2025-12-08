import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ManualProjection } from './manual-projection.entity';
import { ProjectedCourse } from './projected-course.entity';

@Entity('projected_semesters')
export class ProjectedSemester {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  periodo: string;

  @Column({ nullable: true })
  orden?: number;

  @ManyToOne(
    () => ManualProjection,
    (projection: ManualProjection) => projection.semestres,
    { onDelete: 'CASCADE' },
  )
  projection: ManualProjection;

  @OneToMany(
    () => ProjectedCourse,
    (course: ProjectedCourse) => course.semestre,
    { cascade: true },
  )
  cursos: ProjectedCourse[];
}
