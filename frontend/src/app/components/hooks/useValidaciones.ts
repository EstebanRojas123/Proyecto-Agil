import { MallaItem, Curso } from "@/services/AvanceService";
import { ProyectadoSemestre } from "../types/proyecciones.types";

interface UseValidacionesProps {
  mallaData: MallaItem[] | null;
  avanceData: Curso[] | null;
  semestresProyectados: ProyectadoSemestre[];
}

export const useValidaciones = ({
  mallaData,
  avanceData,
  semestresProyectados,
}: UseValidacionesProps) => {
  const cursosAprobadosOInscritos = new Set(
    (avanceData || [])
      .filter(
        (curso) => curso.status === "APROBADO" || curso.status === "INSCRITO"
      )
      .map((curso) => curso.course)
  );

  const tieneNumeroRomano = (nombre: string): boolean => {
    const patterns = [/\s+(I{1,3})\s/, /\s+(I{1,3})$/];
    for (const pattern of patterns) {
      if (pattern.test(nombre)) {
        return true;
      }
    }
    return false;
  };

  const getSemestreDelAnioPorNivel = (nivel: number): number => {
    return nivel % 2 === 1 ? 1 : 2;
  };

  const getNivelBase = (periodoActual: string): number => {
    if (!mallaData) return 1;

    const cursosCompletados = new Set<string>();
    if (avanceData && avanceData.length > 0) {
      for (const curso of avanceData) {
        if (curso.status === "APROBADO" || curso.status === "INSCRITO") {
          cursosCompletados.add(curso.course);
        }
      }
    }

    const semestresOrdenados = [...semestresProyectados].sort((a, b) => {
      const [aYear, aTerm] = a.periodo.split("-").map(Number);
      const [bYear, bTerm] = b.periodo.split("-").map(Number);
      if (aYear !== bYear) return aYear - bYear;
      return aTerm - bTerm;
    });

    const indiceSemestreActual = semestresOrdenados.findIndex(
      (s) => s.periodo === periodoActual
    );

    for (let i = 0; i < indiceSemestreActual; i++) {
      const semestre = semestresOrdenados[i];
      for (const curso of semestre.cursos) {
        cursosCompletados.add(curso.codigo);
      }
    }

    const cursosPorNivel = mallaData.reduce((acc, curso) => {
      if (!acc[curso.nivel]) {
        acc[curso.nivel] = [];
      }
      acc[curso.nivel].push(curso);
      return acc;
    }, {} as { [key: number]: MallaItem[] });

    const niveles = Object.keys(cursosPorNivel)
      .map(Number)
      .sort((a, b) => a - b);
    let nivelBase = 1;

    for (const nivel of niveles) {
      const cursosDelNivel = cursosPorNivel[nivel];
      const todosCompletos = cursosDelNivel.every((curso) =>
        cursosCompletados.has(curso.codigo)
      );

      if (todosCompletos) {
        nivelBase = nivel + 1;
      } else {
        break;
      }
    }

    return nivelBase;
  };

  const canEnrollInSemester = (
    curso: MallaItem,
    periodo: string,
    cursosDelSemestre: MallaItem[]
  ): { valid: boolean; reason?: string } => {
    if (tieneNumeroRomano(curso.asignatura)) {
      const [, term] = periodo.split("-");
      const semestreProyectado = parseInt(term, 10);
      const semestreDelAnio = getSemestreDelAnioPorNivel(curso.nivel);

      if (semestreProyectado !== semestreDelAnio) {
        return {
          valid: false,
          reason: `El curso sólo se imparte en ${semestreDelAnio}° semestre.`,
        };
      }
    }

    if (curso.prereq && curso.codigo !== "ECIN-00663") {
      const prerequisitos = curso.prereq
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);
      const prerequisitosFaltantes: string[] = [];

      const semestresOrdenados = [...semestresProyectados].sort((a, b) => {
        const [aYear, aTerm] = a.periodo.split("-").map(Number);
        const [bYear, bTerm] = b.periodo.split("-").map(Number);
        if (aYear !== bYear) return aYear - bYear;
        return aTerm - bTerm;
      });

      const indiceSemestreActual = semestresOrdenados.findIndex(
        (s) => s.periodo === periodo
      );

      for (const prereq of prerequisitos) {
        if (!cursosAprobadosOInscritos.has(prereq)) {
          let encontradoEnProyecciones = false;

          for (let i = 0; i < indiceSemestreActual; i++) {
            if (semestresOrdenados[i].cursos.some((c) => c.codigo === prereq)) {
              encontradoEnProyecciones = true;
              break;
            }
          }

          if (!encontradoEnProyecciones) {
            const cursoPrereq = mallaData?.find((m) => m.codigo === prereq);
            prerequisitosFaltantes.push(cursoPrereq?.asignatura || prereq);
          }
        }
      }

      if (prerequisitosFaltantes.length > 0) {
        return {
          valid: false,
          reason: `Debes aprobar primero: ${prerequisitosFaltantes.join(", ")}`,
        };
      }
    }

    const nivelBase = getNivelBase(periodo);
    const DESPLAZAMIENTO = 2;
    const NIVEL_MAX_PERMITIDO = nivelBase + DESPLAZAMIENTO;

    if (curso.nivel > NIVEL_MAX_PERMITIDO) {
      return {
        valid: false,
        reason: `Dispersión: No puedes inscribir cursos de nivel ${curso.nivel} en el semestre que seleccionaste.`,
      };
    }

    const MAX_CREDITOS_POR_SEMESTRE = 30;
    const creditosActuales = cursosDelSemestre.reduce(
      (sum, c) => sum + c.creditos,
      0
    );
    const creditosTotales = creditosActuales + curso.creditos;

    if (creditosTotales > MAX_CREDITOS_POR_SEMESTRE) {
      return {
        valid: false,
        reason: `Excedes el límite de créditos. Este semestre tendría ${creditosTotales} créditos (máximo ${MAX_CREDITOS_POR_SEMESTRE}).`,
      };
    }

    return { valid: true };
  };

  return {
    canEnrollInSemester,
    cursosAprobadosOInscritos,
  };
};

