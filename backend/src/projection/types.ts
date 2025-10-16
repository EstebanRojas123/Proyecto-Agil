// src/projection/types.ts
export type PeriodoRaw = string; // ej: "202320"

// ---- API: Malla ----
export interface MallaItem {
  codigo: string; // "DCCB-00106"
  asignatura: string; // "Cálculo I"
  creditos: number; // 6
  nivel: number; // 1..N
  prereq?: string; // CSV de codigos o vacío
}

// ---- API: Avance ----
export type AvanceEstado = 'APROBADO' | 'REPROBADO' | 'INSCRITO';
export interface AvanceItem {
  nrc: string;
  period: PeriodoRaw; // "202320"
  student: string; // rut sin dv o similar
  course: string; // "ECIN-00600"
  excluded: boolean;
  inscriptionType: string; // "REGULAR"
  status: AvanceEstado; // APROBADO | REPROBADO | INSCRITO
}

// ---- Salida final para el front ----
export interface ProyeccionRamo {
  codigo: string;
  nombre: string;
  estado: 'APROBADO' | 'REPROBADO' | 'INSCRITO' | 'PENDIENTE';
  creditos: number;
  nivel: number;
}

export interface ProyeccionSemestre {
  periodo: string; // "2023-1", "2023-2"
  ramos: ProyeccionRamo[];
}

export interface ProyeccionResumen {
  creditosTotales: number;
  creditosAprobados: number;
  porcentaje: number; // 0..100 (ej: 52.3)
}

export interface ProyeccionResponse {
  resumen: ProyeccionResumen;
  semestres: ProyeccionSemestre[];
  pendientes: {
    // ramos sin registro en avance
    nivel: number;
    ramos: ProyeccionRamo[];
  }[];
}
