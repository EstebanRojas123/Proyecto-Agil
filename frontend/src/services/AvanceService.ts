export interface Curso {
  course: string;
  nombre: string;
  status: 'APROBADO' | 'REPROBADO' | 'INSCRITO';
  period: string;
  nrc: string;
}

export interface AvanceResponse extends Array<Curso> {}

export interface MallaItem {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  prereq?: string;
}

export interface MallaResponse extends Array<MallaItem> {}

export async function getAvanceData(rut: string, codigoCarrera: string, catalogo: string): Promise<AvanceResponse> {
  const response = await fetch(
    `http://localhost:3000/avance?rut=${rut}&codCarrera=${codigoCarrera}&catalogo=${catalogo}`
  );

  if (!response.ok) {
    throw new Error('Error al obtener datos de avance');
  }

  return response.json();
}

export async function getMallaData(codigoCarrera: string, catalogo: string): Promise<MallaResponse> {
  const response = await fetch(
    `http://localhost:3000/avance/malla?codCarrera=${codigoCarrera}&catalogo=${catalogo}`
  );

  if (!response.ok) {
    throw new Error('Error al obtener datos de malla curricular');
  }

  return response.json();
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
  periodo: string;
  ramos: ProyeccionRamo[];
}

export interface ProyeccionResponse {
  resumen: {
    creditosTotales: number;
    creditosAprobados: number;
    porcentaje: number;
  };
  semestres: ProyeccionSemestre[];
  pendientes: {
    nivel: number;
    ramos: ProyeccionRamo[];
  }[];
}

export async function getAutomaticProjection(rut: string, codigoCarrera: string, catalogo: string): Promise<ProyeccionResponse> {
  const response = await fetch(
    `http://localhost:3000/projection/automatic-projection?rut=${rut}&codcarrera=${codigoCarrera}&catalogo=${catalogo}`
  );

  if (!response.ok) {
    throw new Error('Error al obtener proyección automática');
  }

  return response.json();
}

export function findMostRecentCareer(carreras: { codigo: string; nombre: string; catalogo: string }[]) {
  if (!carreras || carreras.length === 0) {
    return null;
  }

  const mostRecent = carreras.reduce((latest, current) => {   // Carrera más reciente x año
    const currentYear = parseInt(current.catalogo.substring(0, 4));
    const latestYear = parseInt(latest.catalogo.substring(0, 4));
    
    if (currentYear > latestYear) {
      return current;
    } else if (currentYear === latestYear) {
      const currentSemester = parseInt(current.catalogo.substring(4, 6));
      const latestSemester = parseInt(latest.catalogo.substring(4, 6));
      
      if (currentSemester > latestSemester) {
        return current;
      }
    }
    
    return latest;
  });

  return mostRecent;
}

