export class CreateProjectedCourseDto {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  prereq?: string;
}

export class CreateProjectedSemesterDto {
  id: string;
  periodo: string;
  cursos: CreateProjectedCourseDto[];
}

export class CreateManualProjectionDto {
  Carrera: string;
  estudiante: string;
  proyeccionActivaId: string;
  nombre?: string;
  semestresProyectados: CreateProjectedSemesterDto[];
}
