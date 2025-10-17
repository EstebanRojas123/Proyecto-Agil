export interface Curso {
  nrc: string;
  period: string;
  student: string;
  course: string;
  excluded: boolean;
  inscriptionType: string;
  status: 'APROBADO' | 'REPROBADO' | 'INSCRITO';
}

export interface AvanceResponse extends Array<Curso> {}

export async function getAvanceData(rut: string, codigoCarrera: string): Promise<AvanceResponse> {
  const response = await fetch(
    `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${rut}&codcarrera=${codigoCarrera}`
  );

  if (!response.ok) {
    throw new Error('Error al obtener datos de avance');
  }

  return response.json();
}

export function findMostRecentCareer(carreras: { codigo: string; nombre: string; catalogo: string }[]) {
  if (!carreras || carreras.length === 0) {
    return null;
  }

  // Carrera más reciente x el año
  const mostRecent = carreras.reduce((latest, current) => {
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
