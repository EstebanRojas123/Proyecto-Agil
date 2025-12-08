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

const CAPSTONE_CODE = 'ECIN-01000';

@Injectable()
export class AutomaticProjectionService {
  constructor(private readonly projectionService: ProjectionService) {}

  async buildAutomaticProjection(
    params: AlumnoParams,
  ): Promise<ProyeccionResponse> {
    const data = (await this.projectionService.buildProjection({
      rut: params.rut,
      codCarrera: params.codCarrera,
      catalogo: params.catalogo,
    })) as RawProjectionResponse;

    const base = normalizeHistorial(data);

    const periodoActual = detectPeriodoActual(base.semestres);
    let periodoPlan = nextPeriodoForProjection(periodoActual);

    const {
      prereqMap,
      dependentsMap,
      pendientesIndex,
      aprobadosSet,
      reprobadosPendientesSet,
    } = buildGraphs(base);
    const unlockScore = computeUnlockScores(pendientesIndex, dependentsMap);

    const plan: SemestrePlaneado[] = [];
    let nivelBase = base.nivelBase;

    const pendientesTotales = new Set<string>(Object.keys(pendientesIndex));
    let safety = 0;

    while (pendientesTotales.size > 0 && safety < 100) {
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
                creditos: capstone.creditos,
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

      const DESPLAZAMIENTO = 2; // Límite para no poder inscribir/simular cursos de más de 2 nivel al más atrasado
      const NIVEL_MAX_PERMITIDO = nivelBase + DESPLAZAMIENTO;

      const candidatos: Ramo[] = [];
      for (const codigo of pendientesTotales) {
        const ramo = pendientesIndex[codigo];
        if (!ramo) continue;

        if (ramo.nivel > NIVEL_MAX_PERMITIDO) continue;
        const prereqsOK = canTake(
          ramo,
          aprobadosSet,
          tomadosEsteSemestre,
          prereqMap,
          pendientesIndex,
        );
        if (prereqsOK) candidatos.push(ramo);
      }

      const grupoA = candidatos.filter((r) => r.nivel <= nivelBase);
      const grupoB1 = candidatos.filter((r) => r.nivel === nivelBase + 1);
      const grupoB2 = candidatos.filter((r) => r.nivel === nivelBase + 2);

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

      for (const r of grupoA) {
        if (creditos + r.creditos > MAX_CREDITOS_POR_SEMESTRE) continue;
        tomadosEsteSemestre.push(r);
        creditos += r.creditos;
      }

      for (const r of grupoB1) {
        if (creditos + r.creditos > MAX_CREDITOS_POR_SEMESTRE) continue;
        tomadosEsteSemestre.push(r);
        creditos += r.creditos;
      }

      for (const r of grupoB2) {
        if (creditos + r.creditos > MAX_CREDITOS_POR_SEMESTRE) continue;
        tomadosEsteSemestre.push(r);
        creditos += r.creditos;
      }

      const filtradosPorNivel = tomadosEsteSemestre.filter(
        (r) => r.nivel <= NIVEL_MAX_PERMITIDO,
      );

      if (filtradosPorNivel.length !== tomadosEsteSemestre.length) {
        creditos = filtradosPorNivel.reduce((acc, r) => acc + r.creditos, 0);
        tomadosEsteSemestre.length = 0;
        tomadosEsteSemestre.push(...filtradosPorNivel);
      }

      if (tomadosEsteSemestre.length === 0) {
        periodoPlan = nextPeriodoForProjection(periodoPlan);
        nivelBase = Math.max(nivelBase, nivelBase + 1);
        safety += 1;
        continue;
      }

      safety = 0;

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

      periodoPlan = nextPeriodoForProjection(periodoPlan);
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

