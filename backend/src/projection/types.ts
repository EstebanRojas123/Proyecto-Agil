export type PeriodoRaw = string; // onda -> 202320

export interface MallaItem { // API de la malla curricular qye da el cod de ramo, nombre, creditos, nivel y los prerequisitos
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  prereq?: string;
}

export type AvanceEstado = 'APROBADO' | 'REPROBADO' | 'INSCRITO';
export interface AvanceItem {
  nrc: string;
  period: PeriodoRaw;
  student: string;
  course: string;
  excluded: boolean;
  inscriptionType: string;
  status: AvanceEstado;
}

export interface ProyeccionRamo {
  codigo: string;
  nombre: string;
  estado: 'APROBADO' | 'REPROBADO' | 'INSCRITO' | 'PENDIENTE' | 'PROYECTADO';
  creditos: number;
  nivel: number;
  prerequisitos?: string[];
}

export interface ProyeccionSemestre {
  periodo: string; // el formato es de tipo 2023-1,2023-2, 2023-15 etc
  ramos: ProyeccionRamo[];
}

export interface ProyeccionResumen {
  creditosTotales: number;
  creditosAprobados: number;
  porcentaje: number;
}

export interface ProyeccionResponse {
  resumen: ProyeccionResumen;
  semestres: ProyeccionSemestre[];
  pendientes: {
    nivel: number;
    ramos: ProyeccionRamo[];
  }[];
}

export type Ramo = ProyeccionRamo;
export type SemestrePlaneado = ProyeccionSemestre;

export interface AlumnoParams {
  rut: string;
  codCarrera: string;
  catalogo: string;
}

export interface SemestreHistorial {
  periodo: string;
  ramos: (ProyeccionRamo & { estado: AvanceEstado })[];
}

export interface RawProjectionResponse { // Así etá la structura completa que entrega el endpoint base /projection

  resumen: ProyeccionResumen;
  semestres: SemestreHistorial[];
  pendientes: {
    nivel: number;
    ramos: ProyeccionRamo[];
  }[];
}

export interface NormalizedBase {
  semestres: SemestreHistorial[];
  aprobadosSet: Set<string>;
  inscritosSet: Set<string>;
  reprobadosSet: Set<string>;
  nivelBase: number;
}

export const MAX_CREDITOS_POR_SEMESTRE = 30 as const;
