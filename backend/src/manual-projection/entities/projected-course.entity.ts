import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { ProjectedSemester } from './projected-semester.entity';

@Entity('projected_courses')
export class ProjectedCourse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  codigo: string;

  @Column()
  asignatura: string;

  @Column('int')
  creditos: number;

  @Column('int')
  nivel: number;

  @Column({ nullable: true })
  prereq?: string;

  @ManyToOne(() => ProjectedSemester, (sem: ProjectedSemester) => sem.cursos, {
    onDelete: 'CASCADE',
  })
  semestre: ProjectedSemester;
}
