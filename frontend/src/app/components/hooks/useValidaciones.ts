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

  const getNivelBase = (periodoActual: string, semestresToCheck?: ProyectadoSemestre[]): number => {
    if (!mallaData) return 1;

    const cursosCompletados = new Set<string>();
    if (avanceData && avanceData.length > 0) {
      for (const curso of avanceData) {
        if (curso.status === "APROBADO" || curso.status === "INSCRITO") {
          cursosCompletados.add(curso.course);
        }
      }
    }

    const semestresAUsar = semestresToCheck || semestresProyectados;
    const semestresOrdenados = [...semestresAUsar].sort((a, b) => {
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
    cursosDelSemestre: MallaItem[],
    semestresToCheck?: ProyectadoSemestre[]
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

      const semestresAUsar = semestresToCheck || semestresProyectados;
      const semestresOrdenados = [...semestresAUsar].sort((a, b) => {
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
            const cursoEncontrado = semestresOrdenados[i].cursos.find((c) => c.codigo === prereq);
            if (cursoEncontrado) {
              if (cursoEncontrado.asignatura && cursoEncontrado.asignatura.trim() !== "") {
                encontradoEnProyecciones = true;
                break;
              }
            }
          }

          if (!encontradoEnProyecciones) {
            const cursoPrereq = mallaData?.find((m) => m.codigo === prereq);
            if (cursoPrereq && cursoPrereq.asignatura && cursoPrereq.asignatura.trim() !== "") {
              prerequisitosFaltantes.push(cursoPrereq.asignatura);
            }
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

    const nivelBase = getNivelBase(periodo, semestresToCheck);
    const DESPLAZAMIENTO = 2;
    const NIVEL_MAX_PERMITIDO = nivelBase + DESPLAZAMIENTO;

    if (curso.nivel > NIVEL_MAX_PERMITIDO) {
      return {
        valid: false,
        reason: `Dispersión: No puedes inscribir cursos de nivel ${curso.nivel} en el semestre que seleccionaste.`,
      };
    }

    const MAX_CREDITOS_POR_SEMESTRE = 30;
    
    const esPractica = (nombre: string): boolean => {
      const nombreLower = nombre.toLowerCase();
      return nombreLower.includes("práctica profesional") || 
             nombreLower.includes("practica profesional") ||
             nombreLower.includes("práctica pre-profesional") ||
             nombreLower.includes("practica pre-profesional") ||
             nombreLower.includes("práctica preprofesional") ||
             nombreLower.includes("practica preprofesional");
    };

    const creditosActuales = cursosDelSemestre.reduce(
      (sum, c) => {
        if (esPractica(c.asignatura)) {
          return sum;
        }
        return sum + c.creditos;
      },
      0
    );
    
    const creditosCursoActual = esPractica(curso.asignatura) ? 0 : curso.creditos;
    const creditosTotales = creditosActuales + creditosCursoActual;

    if (creditosTotales > MAX_CREDITOS_POR_SEMESTRE) {
      return {
        valid: false,
        reason: `Excedes el límite de créditos. Este semestre tendría ${creditosTotales} créditos (máximo ${MAX_CREDITOS_POR_SEMESTRE}).`,
      };
    }

    return { valid: true };
  };

  const validateAllProjection = (
    semestresToValidate?: ProyectadoSemestre[]
  ): {
    valid: boolean;
    violations: Array<{ curso: MallaItem; semestre: string; reason: string }>;
  } => {
    const violations: Array<{
      curso: MallaItem;
      semestre: string;
      reason: string;
    }> = [];

    const semestresAValidar = semestresToValidate || semestresProyectados;
    const semestresOrdenados = [...semestresAValidar].sort((a, b) => {
      const [aYear, aTerm] = a.periodo.split("-").map(Number);
      const [bYear, bTerm] = b.periodo.split("-").map(Number);
      if (aYear !== bYear) return aYear - bYear;
      return aTerm - bTerm;
    });

    for (const semestre of semestresOrdenados) {
      for (const curso of semestre.cursos) {
        const validation = canEnrollInSemester(
          curso,
          semestre.periodo,
          semestre.cursos.filter((c) => c.codigo !== curso.codigo),
          semestresAValidar
        );

        if (!validation.valid && validation.reason) {
          violations.push({
            curso,
            semestre: semestre.periodo,
            reason: validation.reason,
          });
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  };

  return {
    canEnrollInSemester,
    cursosAprobadosOInscritos,
    validateAllProjection,
  };
};

