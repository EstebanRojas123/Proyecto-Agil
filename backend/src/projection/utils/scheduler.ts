import {
  NormalizedBase,
  RawProjectionResponse,
  Ramo,
  SemestreHistorial,
  AvanceEstado,
} from '../types';

const MAX_CREDITOS_POR_SEMESTRE = 30;

function comparePeriodo(a: string, b: string): number {
  const [ya, ta] = a.split('-').map((n) => parseInt(n, 10));
  const [yb, tb] = b.split('-').map((n) => parseInt(n, 10));
  if (ya !== yb) return ya - yb;
  return ta - tb;
}

function nextPeriodo(periodo: string): string {
  const [yStr, tStr] = periodo.split('-');
  let y = parseInt(yStr, 10);
  const t = parseInt(tStr, 10);
  if (t === 1) return `${y}-2`;
  if (t === 2) return `${y}-15`;
  if (t === 15) return `${y + 1}-1`;
  return `${y}-2`;
}

function isInvierno(periodo: string): boolean {
  const t = parseInt(periodo.split('-')[1] || '1', 10);
  return t === 15;
}

function nextPeriodoForProjection(periodo: string): string {
  const [yStr, tStr] = periodo.split('-');
  const y = parseInt(yStr, 10);
  const t = parseInt(tStr, 10);
  if (t === 1) return `${y}-2`;
  if (t === 2) return `${y + 1}-1`;
  if (t === 15) return `${y}-2`;
  return `${y}-2`;
}

function detectPeriodoActual(semestres: SemestreHistorial[]): string {
  let conInscritos: string | null = null;
  for (const s of semestres) {
    if (s.ramos.some((r) => r.estado === 'INSCRITO')) {
      if (!conInscritos || comparePeriodo(s.periodo, conInscritos) > 0) {
        conInscritos = s.periodo;
      }
    }
  }
  if (conInscritos) return conInscritos;

  let maxP = semestres[0]?.periodo ?? '1900-1';
  for (const s of semestres)
    if (comparePeriodo(s.periodo, maxP) > 0) maxP = s.periodo;
  return maxP;
}

function isAvanceEstado(x: any): x is AvanceEstado {
  return x === 'APROBADO' || x === 'REPROBADO' || x === 'INSCRITO';
}

function normalizeHistorial(
  data: RawProjectionResponse,
): NormalizedBase & RawProjectionResponse {
  const rank: Record<string, number> = {
    INSCRITO: 3,
    APROBADO: 2,
    REPROBADO: 1,
  };
  const aprobadosSet = new Set<string>();
  const inscritosSet = new Set<string>();
  const reprobadosSet = new Set<string>();

  const semestres: SemestreHistorial[] = data.semestres.map((s) => {
    const seen = new Map<string, Ramo>();
    for (const r of s.ramos) {
      const prev = seen.get(r.codigo);
      if (
        !prev ||
        (rank[(r as any).estado] || 0) > (rank[(prev as any).estado] || 0)
      ) {
        seen.set(r.codigo, r);
      }
    }
    const ramos = Array.from(seen.values()).map((r) => {
      const estado = isAvanceEstado(r.estado) ? r.estado : 'REPROBADO';
      const rr = { ...r, estado } as Ramo & { estado: AvanceEstado };
      if (rr.estado === 'INSCRITO') inscritosSet.add(rr.codigo);
      else if (rr.estado === 'APROBADO') aprobadosSet.add(rr.codigo);
      else if (rr.estado === 'REPROBADO') reprobadosSet.add(rr.codigo);
      return rr;
    });
    return { periodo: s.periodo, ramos };
  });

  let maxNivel = 1;
  for (const s of semestres) {
    for (const r of s.ramos) {
      if (
        (r.estado === 'APROBADO' || r.estado === 'INSCRITO') &&
        r.nivel > maxNivel
      ) {
        maxNivel = r.nivel;
      }
    }
  }

  return {
    ...data,
    semestres,
    aprobadosSet,
    inscritosSet,
    reprobadosSet,
    nivelBase: maxNivel,
  };
}

function buildGraphs(base: NormalizedBase & RawProjectionResponse) {
  const pendientesIndex: Record<string, Ramo> = {};
  for (const grupo of base.pendientes) {
    for (const r of grupo.ramos) {
      if (base.aprobadosSet.has(r.codigo)) continue;
      if (base.inscritosSet.has(r.codigo)) continue;
      pendientesIndex[r.codigo] = r;
    }
  }

  const reprobadosPendientesSet = new Set<string>();
  for (const s of base.semestres) {
    for (const r of s.ramos) {
      if (r.estado === 'REPROBADO' && !base.inscritosSet.has(r.codigo)) {
        if (base.aprobadosSet.has(r.codigo)) continue;
        reprobadosPendientesSet.add(r.codigo);
        if (!pendientesIndex[r.codigo])
          pendientesIndex[r.codigo] = { ...r, estado: 'PENDIENTE' };
      }
    }
  }

  const prereqMap: Record<string, string[]> = {};
  for (const codigo in pendientesIndex) {
    prereqMap[codigo] = pendientesIndex[codigo].prerequisitos || [];
  }

  const dependentsMap: Record<string, string[]> = {};
  for (const codigo in pendientesIndex) {
    for (const p of prereqMap[codigo]) {
      if (!dependentsMap[p]) dependentsMap[p] = [];
      dependentsMap[p].push(codigo);
    }
  }

  const aprobadosSet = new Set<string>(base.aprobadosSet);

  return {
    prereqMap,
    dependentsMap,
    pendientesIndex,
    aprobadosSet,
    reprobadosPendientesSet,
  };
}

function canTake(
  ramo: Ramo,
  aprobadosSet: Set<string>,
  tomadosEsteSemestre: Ramo[],
  prereqMap: Record<string, string[]>,
  pendientesIndex?: Record<string, Ramo>,
): boolean {
  const reqs = prereqMap[ramo.codigo] || [];

  for (const req of reqs) {
    const existeEnMalla = pendientesIndex ? !!pendientesIndex[req] : true;
    if (!existeEnMalla) continue;
    if (!aprobadosSet.has(req)) return false;
    if (tomadosEsteSemestre.some((r) => r.codigo === req)) return false;
  }
  return true;
}

function computeUnlockScores(
  pendientesIndex: Record<string, Ramo>,
  dependentsMap: Record<string, string[]>,
): Record<string, number> {
  const memo: Record<string, number> = {};
  const visit = (codigo: string, seen: Set<string>) => {
    if (memo[codigo] !== undefined) return memo[codigo];
    const deps = dependentsMap[codigo] || [];
    let count = 0;
    for (const d of deps) {
      if (!pendientesIndex[d]) continue;
      if (seen.has(d)) continue;
      seen.add(d);
      count += 1 + visit(d, seen);
    }
    memo[codigo] = count;
    return count;
  };
  const score: Record<string, number> = {};
  for (const codigo in pendientesIndex)
    score[codigo] = visit(codigo, new Set<string>());
  return score;
}

export {
  MAX_CREDITOS_POR_SEMESTRE,
  comparePeriodo,
  nextPeriodo,
  isInvierno,
  nextPeriodoForProjection,
  detectPeriodoActual,
  normalizeHistorial,
  buildGraphs,
  canTake,
  computeUnlockScores,
};

