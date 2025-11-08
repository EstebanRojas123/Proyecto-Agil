// src/projection/projection.service.ts
import { Injectable } from '@nestjs/common';
import { ExternalApiService } from '../external/external-api.service';
import {
  AvanceItem,
  MallaItem,
  ProyeccionResponse,
  ProyeccionRamo,
  ProyeccionSemestre,
} from './types';

function parsePeriodoLabel(period: string): string {
  const year = period.slice(0, 4); // saca los primeros 4 caracteres (el año)
  const code = period.slice(4); // saca lo que queda (el código del semestre)

  // Si es "10" lo interpretamos como primer semestre, si es "20" como segundo semestre
  const term = code === '10' ? '1' : code === '20' ? '2' : code;

  // Template literal correcto
  return `${year}-${term}`;
}

function sortPeriodoAsc(a: string, b: string): number {
  const [ay, at] = a.split('-').map(Number);
  const [by, bt] = b.split('-').map(Number);
  if (ay !== by) return ay - by;
  return at - bt;
}

@Injectable()
export class ProjectionService {
  constructor(private readonly api: ExternalApiService) {}

  async buildProjection(params: {
    rut: string;
    codCarrera: string;
    catalogo: string;
  }): Promise<ProyeccionResponse> {
    const { rut, codCarrera, catalogo } = params;

    const [malla, avance] = await Promise.all([
      this.api.getMalla(codCarrera, catalogo),
      this.api.getAvance(rut, codCarrera),
    ]);

    const mallaByCode = new Map<string, MallaItem>();
    for (const m of malla) mallaByCode.set(m.codigo, m);

    const periodoMap = new Map<string, ProyeccionRamo[]>();

    // === Ramos cursados o inscritos ===
    for (const a of avance) {
      const periodo = parsePeriodoLabel(a.period);
      const def = mallaByCode.get(a.course);
      if (!def) continue;

      const entry: ProyeccionRamo = {
        codigo: def.codigo,
        nombre: def.asignatura,
        estado: a.status,
        creditos: def.creditos,
        nivel: def.nivel,
        prerequisitos: def.prereq
          ? def.prereq.split(',').map((p) => p.trim())
          : [], // ✅ Agregamos los prerequisitos
      };

      if (!periodoMap.has(periodo)) periodoMap.set(periodo, []);
      periodoMap.get(periodo)!.push(entry);
    }

    // === Ramos pendientes ===
    const cursadosSet = new Set(avance.map((a) => a.course));
    const pendientesPorNivel = new Map<number, ProyeccionRamo[]>();

    for (const def of malla) {
      if (!cursadosSet.has(def.codigo)) {
        const p: ProyeccionRamo = {
          codigo: def.codigo,
          nombre: def.asignatura,
          estado: 'PENDIENTE',
          creditos: def.creditos,
          nivel: def.nivel,
          prerequisitos: def.prereq
            ? def.prereq.split(',').map((p) => p.trim())
            : [], // ✅ También en pendientes
        };

        if (!pendientesPorNivel.has(def.nivel))
          pendientesPorNivel.set(def.nivel, []);
        pendientesPorNivel.get(def.nivel)!.push(p);
      }
    }

    // === Ordenar los ramos dentro de cada semestre ===
    for (const [periodo, ramos] of periodoMap) {
      ramos.sort(
        (a, b) => a.nivel - b.nivel || a.nombre.localeCompare(b.nombre),
      );
      periodoMap.set(periodo, ramos);
    }

    // === Construir respuesta final ===
    const semestres: ProyeccionSemestre[] = Array.from(periodoMap.entries())
      .sort(([pa], [pb]) => sortPeriodoAsc(pa, pb))
      .map(([periodo, ramos]) => ({ periodo, ramos }));

    const pendientes = Array.from(pendientesPorNivel.entries())
      .sort(([na], [nb]) => na - nb)
      .map(([nivel, ramos]) => ({
        nivel,
        ramos: ramos.sort((a, b) => a.nombre.localeCompare(b.nombre)),
      }));

    const resumen = computeProgress(malla, avance);

    return { resumen, semestres, pendientes };
  }
}

function computeProgress(malla: MallaItem[], avance: AvanceItem[]) {
  const mallaByCode = new Map(malla.map((m) => [m.codigo, m] as const));
  const creditosTotales = malla.reduce((acc, m) => acc + (m.creditos || 0), 0);

  const aprobadosUnicos = new Set<string>();
  for (const a of avance) {
    if (a.status === 'APROBADO' && mallaByCode.has(a.course)) {
      aprobadosUnicos.add(a.course);
    }
  }

  let creditosAprobados = 0;
  for (const codigo of aprobadosUnicos) {
    const def = mallaByCode.get(codigo)!;
    creditosAprobados += def.creditos || 0;
  }

  const porcentaje =
    creditosTotales > 0
      ? Number(((creditosAprobados / creditosTotales) * 100).toFixed(1))
      : 0;

  return { creditosTotales, creditosAprobados, porcentaje };
}
