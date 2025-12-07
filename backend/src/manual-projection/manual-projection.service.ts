import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { User } from './entities/user.entity';
import { ManualProjection } from './entities/manual-projection.entity';
import { ProjectedSemester } from './entities/projected-semester.entity';
import { ProjectedCourse } from './entities/projected-course.entity';

import {
  CreateManualProjectionDto,
  CreateProjectedSemesterDto,
  CreateProjectedCourseDto,
} from './dtos/create-manual-projection.dto';

@Injectable()
export class ManualProjectionService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(ManualProjection)
    private readonly projectionRepo: Repository<ManualProjection>,

    @InjectRepository(ProjectedSemester)
    private readonly semesterRepo: Repository<ProjectedSemester>,

    @InjectRepository(ProjectedCourse)
    private readonly courseRepo: Repository<ProjectedCourse>,

    private readonly dataSource: DataSource,
  ) {}

  async createFromManualJson(
    dto: CreateManualProjectionDto,
  ): Promise<ManualProjection> {
    return this.dataSource.transaction<ManualProjection>(async (manager) => {
      const userRepo = manager.getRepository(User);
      const projectionRepo = manager.getRepository(ManualProjection);

      // 1) Buscar o crear usuario por rut ------------------------------
      let user = await userRepo.findOne({
        where: { rut: dto.estudiante },
      });

      if (!user) {
        user = userRepo.create({ rut: dto.estudiante });
        user = await userRepo.save(user);
      }

      // 2) Crear la proyección -----------------------------------------
      const projection = new ManualProjection();
      projection.id = dto.proyeccionActivaId;
      projection.user = user;

      // 3) Crear semestres ---------------------------------------------
      projection.semestres = dto.semestresProyectados.map(
        (semDto: CreateProjectedSemesterDto, index: number) => {
          const semestre = new ProjectedSemester();
          semestre.periodo = semDto.periodo;
          semestre.orden = index + 1;

          // 4) Crear cursos -------------------------------------------
          semestre.cursos = semDto.cursos.map(
            (courseDto: CreateProjectedCourseDto) => {
              const course = new ProjectedCourse();
              course.codigo = courseDto.codigo;
              course.asignatura = courseDto.asignatura;
              course.creditos = courseDto.creditos;
              course.nivel = courseDto.nivel;
              course.prereq = courseDto.prereq ?? undefined;
              return course;
            },
          );

          return semestre;
        },
      );

      // 5) Guardar todo en cascada -------------------------------
      const saved = await projectionRepo.save(projection);
      return saved;
    });
  }

  async findByUser(rut: string): Promise<ManualProjection[]> {
    return this.projectionRepo.find({
      where: { user: { rut } },
      relations: ['semestres', 'semestres.cursos', 'user'],
      order: { semestres: { orden: 'ASC' } },
    });
  }

  async findOne(id: string): Promise<ManualProjection> {
    const proj = await this.projectionRepo.findOne({
      where: { id },
      relations: ['semestres', 'semestres.cursos', 'user'],
      order: { semestres: { orden: 'ASC' } },
    });

    if (!proj) {
      throw new NotFoundException(`Proyección ${id} no encontrada`);
    }

    return proj;
  }

  async remove(id: string): Promise<void> {
    const result = await this.projectionRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Proyección ${id} no encontrada`);
    }
  }
}
