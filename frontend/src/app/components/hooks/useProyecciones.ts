import { useState } from "react";
import { MallaItem } from "@/services/AvanceService";
import {
  ProyeccionGuardada,
  ProyeccionesData,
} from "../types/proyecciones.types";
import {
  getStorageKey,
  generarIdProyeccion,
  cargarProyeccionesGuardadas,
  guardarProyecciones,
} from "../utils/proyecciones.utils";
import {
  getUserManualProjections,
} from "@/services/manualProjectionsService";

interface UseProyeccionesProps {
  user: { rut: string } | null;
  selectedCareer: { codigo: string; catalogo: string } | null;
  mallaData: MallaItem[] | null;
}

export const useProyecciones = ({
  user,
  selectedCareer,
  mallaData,
}: UseProyeccionesProps) => {
  const [proyeccionesGuardadas, setProyeccionesGuardadas] = useState<
    ProyeccionGuardada[]
  >([]);
  const [proyeccionActivaId, setProyeccionActivaId] = useState<string | null>(
    null
  );
  const [mostrarSelectorProyecciones, setMostrarSelectorProyecciones] =
    useState(false);

  const cargarProyeccionesDesdeBackend = async (
    preservarProyeccionActiva: boolean = false
  ) => {
    if (!user?.rut || !selectedCareer || !mallaData) {
      return;
    }

    try {
      const proyeccionesBackend = await getUserManualProjections(user.rut);

      interface BackendProjection {
        id: string;
        Carrera: string;
        fechaCreacion?: string;
        semestres?: Array<{
          id?: string;
          periodo?: string;
          cursos?: Array<{ codigo: string }>;
        }>;
      }

      const proyeccionesFiltradas = (proyeccionesBackend as BackendProjection[])
        .filter((proj) => proj.Carrera === selectedCareer.codigo)
        .map((proj, index: number) => {
          const proyeccionMapeada: ProyeccionGuardada = {
            id: proj.id,
            nombre: `Proyección ${index + 1}`,
            fechaCreacion: proj.fechaCreacion
              ? new Date(proj.fechaCreacion).toISOString()
              : new Date().toISOString(),
            fechaModificacion: proj.fechaCreacion
              ? new Date(proj.fechaCreacion).toISOString()
              : new Date().toISOString(),
            semestresProyectados: (proj.semestres || []).map((sem) => ({
              id: sem.periodo || `${sem.id || ""}`,
              periodo: sem.periodo || "",
              cursos: (sem.cursos || [])
                .map((curso) =>
                  mallaData.find((m) => m.codigo === curso.codigo)
                )
                .filter(
                  (curso: MallaItem | undefined): curso is MallaItem =>
                    curso !== undefined
                ),
            })),
          };
          return proyeccionMapeada;
        });

      const storageKey = getStorageKey(selectedCareer);
      const dataLocal = storageKey
        ? cargarProyeccionesGuardadas(storageKey, generarIdProyeccion)
        : null;
      const proyeccionesLocalesNoGuardadas =
        dataLocal?.proyecciones.filter(
          (pLocal: ProyeccionGuardada) =>
            !proyeccionesFiltradas.some(
              (pBackend: ProyeccionGuardada) => pBackend.id === pLocal.id
            )
        ) || [];

      const proyeccionesFiltradasConNombre = proyeccionesFiltradas.map(
        (projBackend: ProyeccionGuardada, index: number) => {
          const proyeccionLocal = dataLocal?.proyecciones.find(
            (pLocal: ProyeccionGuardada) => pLocal.id === projBackend.id
          );
          if (
            proyeccionLocal &&
            proyeccionLocal.nombre &&
            proyeccionLocal.nombre.startsWith("Proyección ")
          ) {
            return {
              ...projBackend,
              nombre: proyeccionLocal.nombre,
            };
          }
          const numeroProyeccion = index + 1;
          return {
            ...projBackend,
            nombre: `Proyección ${numeroProyeccion}`,
          };
        }
      );

      const todasLasProyecciones = [
        ...proyeccionesFiltradasConNombre,
        ...proyeccionesLocalesNoGuardadas,
      ];

      if (todasLasProyecciones.length > 0) {
        const proyeccionActivaActual = preservarProyeccionActiva
          ? proyeccionActivaId
          : null;

        const proyeccionActivaIdFinal =
          proyeccionActivaActual &&
          todasLasProyecciones.some(
            (p: ProyeccionGuardada) => p.id === proyeccionActivaActual
          )
            ? proyeccionActivaActual
            : todasLasProyecciones[0].id;

        const data: ProyeccionesData = {
          proyecciones: todasLasProyecciones,
          proyeccionActiva: proyeccionActivaIdFinal,
        };
        if (storageKey) {
          guardarProyecciones(storageKey, data);
        }
        setProyeccionesGuardadas(todasLasProyecciones);

        if (!preservarProyeccionActiva || !proyeccionActivaId) {
          setProyeccionActivaId(proyeccionActivaIdFinal);
        }
      } else {
        setProyeccionesGuardadas([]);
        if (!preservarProyeccionActiva) {
          setProyeccionActivaId(null);
        }
      }
    } catch (error) {
      console.error("Error al cargar proyecciones desde el backend:", error);
      const storageKey = getStorageKey(selectedCareer);
      const data = storageKey
        ? cargarProyeccionesGuardadas(storageKey, generarIdProyeccion)
        : null;
      if (data) {
        setProyeccionesGuardadas(data.proyecciones);
        if (!preservarProyeccionActiva) {
          setProyeccionActivaId(data.proyeccionActiva);
        }
      } else {
        setProyeccionesGuardadas([]);
        if (!preservarProyeccionActiva) {
          setProyeccionActivaId(null);
        }
      }
    }
  };

  const crearNuevaProyeccion = () => {
    const nuevoId = generarIdProyeccion();
    const storageKey = getStorageKey(selectedCareer);
    if (!storageKey) return;

    const data =
      cargarProyeccionesGuardadas(storageKey, generarIdProyeccion) || {
        proyecciones: [],
        proyeccionActiva: null,
      };

    const nuevaProyeccion: ProyeccionGuardada = {
      id: nuevoId,
      nombre: `Proyección ${data.proyecciones.length + 1}`,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
      semestresProyectados: [],
    };

    data.proyecciones.push(nuevaProyeccion);
    data.proyeccionActiva = nuevoId;

    guardarProyecciones(storageKey, data);
    setProyeccionesGuardadas(data.proyecciones);
    setProyeccionActivaId(nuevoId);
    setMostrarSelectorProyecciones(false);

    return nuevaProyeccion;
  };

  return {
    proyeccionesGuardadas,
    setProyeccionesGuardadas,
    proyeccionActivaId,
    setProyeccionActivaId,
    mostrarSelectorProyecciones,
    setMostrarSelectorProyecciones,
    cargarProyeccionesDesdeBackend,
    crearNuevaProyeccion,
  };
};

