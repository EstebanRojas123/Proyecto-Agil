import { ProyeccionesData, ProyeccionGuardada } from "../types/proyecciones.types";

export const generarIdProyeccion = (): string => {
  return `proy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getStorageKey = (selectedCareer: { codigo: string; catalogo: string } | null): string | null => {
  if (!selectedCareer) return null;
  return `proyecciones_${selectedCareer.codigo}_${selectedCareer.catalogo}`;
};

export const getSessionStorageKey = (selectedCareer: { codigo: string; catalogo: string } | null): string | null => {
  if (!selectedCareer) return null;
  return `proyecciones_session_${selectedCareer.codigo}_${selectedCareer.catalogo}`;
};

export const getLevelStorageKey = (selectedCareer: { codigo: string; catalogo: string } | null): string | null => {
  if (!selectedCareer) return null;
  return `selectedLevel_${selectedCareer.codigo}_${selectedCareer.catalogo}`;
};

export const formatPeriodo = (periodo: string): string => {
  const [year, term] = periodo.split("-");
  const termRoman = term === "1" ? "I" : "II";
  return `${year}-${termRoman}`;
};

export const getNextSemester = (): string => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (currentMonth < 6) {
    return `${currentYear}-2`;
  } else {
    return `${currentYear + 1}-1`;
  }
};

export const toRoman = (num: number): string => {
  const romanNumerals: { [key: number]: string } = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
    10: "X",
    11: "XI",
    12: "XII",
    13: "XIII",
    14: "XIV",
    15: "XV",
  };
  return romanNumerals[num] || num.toString();
};

export const cargarProyeccionesGuardadas = (
  storageKey: string | null,
  generarIdProyeccion: () => string
): ProyeccionesData | null => {
  if (!storageKey) return null;

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const proyeccionMigrada: ProyeccionGuardada = {
          id: generarIdProyeccion(),
          nombre: "Proyección 1",
          fechaCreacion: new Date().toISOString(),
          fechaModificacion: new Date().toISOString(),
          semestresProyectados: parsed,
        };
        const nuevoData: ProyeccionesData = {
          proyecciones: [proyeccionMigrada],
          proyeccionActiva: proyeccionMigrada.id,
        };
        localStorage.setItem(storageKey, JSON.stringify(nuevoData));
        return nuevoData;
      }
      return parsed as ProyeccionesData;
    }
  } catch (error) {
    console.error("Error al cargar proyecciones guardadas:", error);
  }
  return null;
};

export const guardarProyecciones = (storageKey: string | null, data: ProyeccionesData): void => {
  if (!storageKey) return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error("Error al guardar proyecciones:", error);
  }
};

