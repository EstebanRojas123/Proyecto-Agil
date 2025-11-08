// src/projection/services/automatic-projection.service.ts
import { Injectable } from '@nestjs/common';
import { ProjectionService } from './projection.service';
import {
  AlumnoParams,
  ProyeccionResponse,
  RawProjectionResponse,
  Ramo,
  SemestrePlaneado,
} from './types';
import {
  detectPeriodoActual,
  nextPeriodoForProjection,
  normalizeHistorial,
  buildGraphs,
  canTake,
  computeUnlockScores,
  MAX_CREDITOS_POR_SEMESTRE,
} from './utils/scheduler';

const CAPSTONE_CODE = 'ECIN-01000'; // ajusta si tu código de capstone es otro

@Injectable()
export class AutomaticProjectionService {
  constructor(private readonly projectionService: ProjectionService) {}

  async buildAutomaticProjection(
    params: AlumnoParams,
  ): Promise<ProyeccionResponse> {
    // 1) Traer base de datos directo del service existente
    const data = (await this.projectionService.buildProjection({
      rut: params.rut,
      codCarrera: params.codCarrera,
      catalogo: params.catalogo,
    })) as RawProjectionResponse;

    // 2) Normalizar historial
    const base = normalizeHistorial(data);

    // 3) Siguiente periodo al actual (SIN invierno)
    const periodoActual = detectPeriodoActual(base.semestres);
    let periodoPlan = nextPeriodoForProjection(periodoActual);

    // 4) Grafos + unlockScore
    const {
      prereqMap,
      dependentsMap,
      pendientesIndex,
      aprobadosSet,
      reprobadosPendientesSet,
    } = buildGraphs(base);
    const unlockScore = computeUnlockScores(pendientesIndex, dependentsMap);

    // 5) Planificación semestre a semestre
    const plan: SemestrePlaneado[] = [];
    let nivelBase = base.nivelBase;

    const pendientesTotales = new Set<string>(Object.keys(pendientesIndex));
    let safety = 0; // por si pasamos varios semestres sin progreso

    while (pendientesTotales.size > 0 && safety < 100) {
      // --- Capstone prioritario: si ya cumple, agenda solo Capstone y termina
      const capstone = pendientesIndex[CAPSTONE_CODE];
      if (capstone) {
        const reqs = prereqMap[CAPSTONE_CODE] || [];
        const allOK = reqs.every((req) => aprobadosSet.has(req));
        if (allOK) {
          plan.push({
            periodo: periodoPlan,
            ramos: [
              {
                codigo: capstone.codigo,
                nombre: capstone.nombre,
                estado: 'PROYECTADO',
                creditos: capstone.creditos, // usualmente 30
                nivel: capstone.nivel,
                prerequisitos: capstone.prerequisitos || [],
              },
            ],
          });
          pendientesTotales.delete(CAPSTONE_CODE);
          return {
            resumen: data.resumen,
            semestres: plan,
            pendientes: [],
          };
        }
      }

      let creditos = 0;
      const tomadosEsteSemestre: Ramo[] = [];

      // ✅ Límite ESTRICTO de nivel: k, k+1, k+2
      const DESPLAZAMIENTO = 2;
      const NIVEL_MAX_PERMITIDO = nivelBase + DESPLAZAMIENTO;

      // candidatos habilitados (nivel y prerrequisitos; sin co-req gracias a canTake)
      const candidatos: Ramo[] = [];
      for (const codigo of pendientesTotales) {
        const ramo = pendientesIndex[codigo];
        if (!ramo) continue;

        if (ramo.nivel > NIVEL_MAX_PERMITIDO) continue; // ⛔ corte duro por nivel

        const prereqsOK = canTake(
          ramo,
          aprobadosSet,
          tomadosEsteSemestre,
          prereqMap,
          pendientesIndex,
        );
        if (prereqsOK) candidatos.push(ramo);
      }

      // ---- Selección en 2 pasos (reduce dispersión) ----
      const grupoA = candidatos.filter((r) => r.nivel <= nivelBase); // backlog
      const grupoB1 = candidatos.filter((r) => r.nivel === nivelBase + 1); // +1
      const grupoB2 = candidatos.filter((r) => r.nivel === nivelBase + 2); // +2

      const cmp = (a: Ramo, b: Ramo) => {
        const aRep = reprobadosPendientesSet.has(a.codigo) ? 1 : 0;
        const bRep = reprobadosPendientesSet.has(b.codigo) ? 1 : 0;
        if (aRep !== bRep) return bRep - aRep;

        const s = (unlockScore[b.codigo] || 0) - (unlockScore[a.codigo] || 0);
        if (s !== 0) return s;

        if (a.nivel !== b.nivel) return a.nivel - b.nivel;

        const ap = a.prerequisitos?.length || 0;
        const bp = b.prerequisitos?.length || 0;
        if (ap !== bp) return ap - bp;

        return a.creditos - b.creditos;
      };

      grupoA.sort(cmp);
      grupoB1.sort(cmp);
      grupoB2.sort(cmp);

      // Paso A: backlog primero
      for (const r of grupoA) {
        if (creditos + r.creditos > MAX_CREDITOS_POR_SEMESTRE) continue;
        tomadosEsteSemestre.push(r);
        creditos += r.creditos;
      }

      // Paso B1: luego nivel base + 1
      for (const r of grupoB1) {
        if (creditos + r.creditos > MAX_CREDITOS_POR_SEMESTRE) continue;
        tomadosEsteSemestre.push(r);
        creditos += r.creditos;
      }

      // Paso B2: por último nivel base + 2
      for (const r of grupoB2) {
        if (creditos + r.creditos > MAX_CREDITOS_POR_SEMESTRE) continue;
        tomadosEsteSemestre.push(r);
        creditos += r.creditos;
      }

      // ⛔ Guard post-selección por si algo se coló por datos malos:
      const filtradosPorNivel = tomadosEsteSemestre.filter(
        (r) => r.nivel <= NIVEL_MAX_PERMITIDO,
      );
      // si hubo recorte, recalcula créditos
      if (filtradosPorNivel.length !== tomadosEsteSemestre.length) {
        creditos = filtradosPorNivel.reduce((acc, r) => acc + r.creditos, 0);
        tomadosEsteSemestre.length = 0;
        tomadosEsteSemestre.push(...filtradosPorNivel);
      }

      // si no se pudo meter nada, NO cortar: avanzar (sin invierno) y reintentar
      if (tomadosEsteSemestre.length === 0) {
        periodoPlan = nextPeriodoForProjection(periodoPlan);
        // destrabe suave: avanza el piso en 1 cuando no hay progreso
        nivelBase = Math.max(nivelBase, nivelBase + 1);
        safety += 1;
        continue;
      }

      // hubo progreso
      safety = 0;

      // mover a aprobados “futuros”
      for (const r of tomadosEsteSemestre) {
        aprobadosSet.add(r.codigo);
        pendientesTotales.delete(r.codigo);
      }

      plan.push({
        periodo: periodoPlan,
        ramos: tomadosEsteSemestre.map((r) => ({
          codigo: r.codigo,
          nombre: r.nombre,
          estado: 'PROYECTADO',
          creditos: r.creditos,
          nivel: r.nivel,
          prerequisitos: r.prerequisitos || [],
        })),
      });

      // avanzar periodo (sin 15)
      periodoPlan = nextPeriodoForProjection(periodoPlan);

      // ✅ piso académico para el próximo semestre:
      // toma el máximo nivel realmente cursado este semestre (no +1 ciego)
      const maxNivelTomado = Math.max(
        ...tomadosEsteSemestre.map((r) => r.nivel),
      );
      nivelBase = Math.max(nivelBase, maxNivelTomado);
    }

    return {
      resumen: data.resumen,
      semestres: plan,
      pendientes: [],
    };
  }
}
