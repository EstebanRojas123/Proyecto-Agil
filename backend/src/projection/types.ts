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
  estado: 'APROBADO' | 'REPROBADO' | 'INSCRITO' | 'PENDIENTE' | 'PROYECTADO';
  creditos: number;
  nivel: number;
  prerequisitos?: string[];
}

export interface ProyeccionSemestre {
  periodo: string; // "2023-1", "2023-2", "2023-15"
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

// =======================
// 👇 Alias y tipos internos para el algoritmo automático
// =======================

// Alias para usar el mismo shape internamente
export type Ramo = ProyeccionRamo;
export type SemestrePlaneado = ProyeccionSemestre;

// Parámetros de ambos endpoints
export interface AlumnoParams {
  rut: string;
  codCarrera: string;
  catalogo: string;
}

// Historial por semestre (estados reales del avance)
export interface SemestreHistorial {
  periodo: string; // "YYYY-1" | "YYYY-2" | "YYYY-15"
  ramos: (ProyeccionRamo & { estado: AvanceEstado })[];
}

// Estructura completa que entrega el endpoint base /projection
export interface RawProjectionResponse {
  resumen: ProyeccionResumen;
  semestres: SemestreHistorial[];
  pendientes: {
    nivel: number;
    ramos: ProyeccionRamo[];
  }[];
}

// Base normalizada para correr el algoritmo
export interface NormalizedBase {
  semestres: SemestreHistorial[];
  aprobadosSet: Set<string>;
  inscritosSet: Set<string>;
  reprobadosSet: Set<string>;
  nivelBase: number;
}

// Constante de negocio
export const MAX_CREDITOS_POR_SEMESTRE = 30 as const;
