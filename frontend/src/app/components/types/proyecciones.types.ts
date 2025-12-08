import { MallaItem } from "@/services/AvanceService";

export interface ProyectadoSemestre {
  id: string;
  periodo: string;
  cursos: MallaItem[];
}

export interface ProyeccionGuardada {
  id: string;
  nombre: string;
  fechaCreacion: string;
  fechaModificacion: string;
  semestresProyectados: ProyectadoSemestre[];
}

export interface ProyeccionesData {
  proyecciones: ProyeccionGuardada[];
  proyeccionActiva: string | null;
}

export interface NotificationState {
  message: string;
  type: "success" | "error" | "info" | "warning";
}

