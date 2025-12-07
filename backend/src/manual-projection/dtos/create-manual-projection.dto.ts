// manual-projection/dtos/create-manual-projection.dto.ts

export class CreateProjectedCourseDto {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  prereq?: string; // puede venir vacío
}

export class CreateProjectedSemesterDto {
  id: string; // "2026-1" (no lo usamos como PK, solo referencia lógica)
  periodo: string; // "2026-1"
  cursos: CreateProjectedCourseDto[];
}

export class CreateManualProjectionDto {
  estudiante: string; // rut: "12345678-k"
  proyeccionActivaId: string; // "proy_1763513493468_hr171kro6"
  nombre?: string; // opcional, por si el front manda un nombre
  semestresProyectados: CreateProjectedSemesterDto[];
}
