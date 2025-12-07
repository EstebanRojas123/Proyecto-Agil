"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCareerSelection } from "@/hooks/useCareerSelection";
import CareerSelector from "./CareerSelector";
import {
  getMallaData,
  getAvanceData,
  MallaItem,
  Curso,
} from "@/services/AvanceService";
import Notification from "./Notification";
import styles from "./MisProyecciones.module.css";
import {
  saveManualProjection,
  ManualProjectionPayload,
} from "@/services/manualProjectionsService";
import { deleteManualProjectionById } from "@/services/manualProjectionsService";

export default function MisProyecciones() {
  const { user } = useAuth();
  const { selectedCareer, handleCareerChange } = useCareerSelection();
  const [mallaData, setMallaData] = useState<MallaItem[] | null>(null);
  const [avanceData, setAvanceData] = useState<Curso[] | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  interface ProyectadoSemestre {
    id: string;
    periodo: string;
    cursos: MallaItem[];
  }

  interface ProyeccionGuardada {
    id: string;
    nombre: string;
    fechaCreacion: string;
    fechaModificacion: string;
    semestresProyectados: ProyectadoSemestre[];
  }

  interface ProyeccionesData {
    proyecciones: ProyeccionGuardada[];
    proyeccionActiva: string | null;
  }

  const [semestresProyectados, setSemestresProyectados] = useState<
    ProyectadoSemestre[]
  >([]);
  const [proyeccionActivaId, setProyeccionActivaId] = useState<string | null>(
    null
  );
  const [proyeccionesGuardadas, setProyeccionesGuardadas] = useState<
    ProyeccionGuardada[]
  >([]);
  const [mostrarSelectorProyecciones, setMostrarSelectorProyecciones] =
    useState(false);
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);

  const [lastDeletedState, setLastDeletedState] = useState<
    ProyectadoSemestre[] | null
  >(null);

  const [draggedCourse, setDraggedCourse] = useState<MallaItem | null>(null);
  const [dragOverSemester, setDragOverSemester] = useState<string | null>(null);

  const [cursosConAdvertencia, setCursosConAdvertencia] = useState<Set<string>>(
    new Set()
  );

  const getStorageKey = () => {
    if (!selectedCareer) return null;
    return `proyecciones_${selectedCareer.codigo}_${selectedCareer.catalogo}`;
  };

  const getSessionStorageKey = () => {
    if (!selectedCareer) return null;
    return `proyecciones_session_${selectedCareer.codigo}_${selectedCareer.catalogo}`;
  };

  const generarIdProyeccion = () => {
    return `proy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const cargarProyeccionesGuardadas = (): ProyeccionesData | null => {
    const storageKey = getStorageKey();
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

  // Guardar todas las proyecciones
  const guardarProyecciones = (data: ProyeccionesData) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Error al guardar proyecciones:", error);
    }
  };

  const crearNuevaProyeccion = () => {
    const nuevoId = generarIdProyeccion();
    const nuevaProyeccion: ProyeccionGuardada = {
      id: nuevoId,
      nombre: `Proyección ${proyeccionesGuardadas.length + 1}`,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
      semestresProyectados: [],
    };

    const data = cargarProyeccionesGuardadas() || {
      proyecciones: [],
      proyeccionActiva: null,
    };
    data.proyecciones.push(nuevaProyeccion);
    data.proyeccionActiva = nuevoId;

    guardarProyecciones(data);
    setProyeccionesGuardadas(data.proyecciones);
    setProyeccionActivaId(nuevoId);
    setSemestresProyectados([]);
    setHayCambiosSinGuardar(false);
    setLastDeletedState(null);
    setMostrarSelectorProyecciones(false);
    showNotification("Nueva proyección creada", "success");
  };

  const buildManualProjectionPayload = (): ManualProjectionPayload | null => {
    if (!user || !user.rut || !proyeccionActivaId) {
      console.warn(
        "Falta user.rut o proyeccionActivaId para guardar en backend"
      );
      return null;
    }

    return {
      estudiante: user.rut, // <- AQUÍ va el rut del usuario logueado
      proyeccionActivaId,
      semestresProyectados: semestresProyectados.map((sem) => ({
        id: sem.id,
        periodo: sem.periodo,
        cursos: sem.cursos.map((curso) => ({
          codigo: curso.codigo,
          asignatura: curso.asignatura,
          creditos: curso.creditos,
          nivel: curso.nivel,
          prereq: (curso as any).prereq ?? "", // depende de tu MallaItem
        })),
      })),
    };
  };

  const guardarProyeccionActual = async () => {
    if (!proyeccionActivaId) {
      crearNuevaProyeccion();
      return;
    }

    const semestresVacios = semestresProyectados.filter(
      (semestre) => semestre.cursos.length === 0
    );
    if (semestresVacios.length > 0) {
      const periodosVacios = semestresVacios
        .map((s) => formatPeriodo(s.periodo))
        .join(", ");
      showNotification(
        `No se puede guardar: los siguientes semestres están vacíos: ${periodosVacios}. Cada semestre debe tener al menos un curso.`,
        "warning"
      );
      return;
    }

    const data = cargarProyeccionesGuardadas() || {
      proyecciones: [],
      proyeccionActiva: null,
    };
    const indice = data.proyecciones.findIndex(
      (p) => p.id === proyeccionActivaId
    );

    if (indice !== -1) {
      data.proyecciones[indice].semestresProyectados = semestresProyectados;
      data.proyecciones[indice].fechaModificacion = new Date().toISOString();
      guardarProyecciones(data);
      setProyeccionesGuardadas(data.proyecciones);
      setHayCambiosSinGuardar(false);

      const sessionKey = getSessionStorageKey();
      if (sessionKey) {
        sessionStorage.removeItem(sessionKey);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("proyecciones-cambios-sin-guardar", {
            detail: { hayCambios: false },
          })
        );
      }

      showNotification("Proyección guardada (local)", "success");
    }

    // 👉 AHORA: guardar también en el backend
    const payload = buildManualProjectionPayload();
    if (!payload) return;

    try {
      await saveManualProjection(payload);
      showNotification("Proyección sincronizada con el servidor", "success");
    } catch (err) {
      console.error("Error al guardar proyección en backend:", err);
      showNotification(
        "Se guardó localmente, pero falló al guardar en el servidor",
        "error"
      );
    }
  };

  const descartarCambios = () => {
    if (!proyeccionActivaId) return;

    const data = cargarProyeccionesGuardadas();
    if (!data) return;

    const proyeccion = data.proyecciones.find(
      (p) => p.id === proyeccionActivaId
    );
    if (proyeccion && mallaData) {
      const proyeccionesValidadas = proyeccion.semestresProyectados.map(
        (semestre: ProyectadoSemestre) => ({
          ...semestre,
          cursos: semestre.cursos
            .map((cursoGuardado: MallaItem) =>
              mallaData.find((m) => m.codigo === cursoGuardado.codigo)
            )
            .filter(
              (curso: MallaItem | undefined): curso is MallaItem =>
                curso !== undefined
            ),
        })
      );
      setSemestresProyectados(proyeccionesValidadas);
      guardarEnSessionStorage(proyeccionesValidadas);
      setHayCambiosSinGuardar(false);
      setLastDeletedState(null);

      const sessionKey = getSessionStorageKey();
      if (sessionKey) {
        sessionStorage.removeItem(sessionKey);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("proyecciones-cambios-sin-guardar", {
            detail: { hayCambios: false },
          })
        );
      }

      showNotification("Cambios descartados", "info");
    }
  };

  const verificarCambiosSinGuardar = (): boolean => {
    if (!proyeccionActivaId) return false;

    const data = cargarProyeccionesGuardadas();
    if (!data) return false;

    const proyeccionGuardada = data.proyecciones.find(
      (p) => p.id === proyeccionActivaId
    );
    if (!proyeccionGuardada) return false;

    const guardados = JSON.stringify(proyeccionGuardada.semestresProyectados);
    const actuales = JSON.stringify(semestresProyectados);

    return guardados !== actuales;
  };

  const guardarAlCerrarSesion = () => {
    if (proyeccionActivaId && hayCambiosSinGuardar) {
      guardarProyeccionActual();
    }
  };

  useEffect(() => {
    if (proyeccionActivaId) {
      const data = cargarProyeccionesGuardadas();
      if (data) {
        const proyeccionGuardada = data.proyecciones.find(
          (p) => p.id === proyeccionActivaId
        );
        if (proyeccionGuardada) {
          const guardados = JSON.stringify(
            proyeccionGuardada.semestresProyectados
          );
          const actuales = JSON.stringify(semestresProyectados);
          const tieneCambios = guardados !== actuales;

          setHayCambiosSinGuardar(tieneCambios);

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("proyecciones-cambios-sin-guardar", {
                detail: { hayCambios: tieneCambios },
              })
            );
          }
        } else {
          setHayCambiosSinGuardar(false);
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("proyecciones-cambios-sin-guardar", {
                detail: { hayCambios: false },
              })
            );
          }
        }
      }
    } else {
      setHayCambiosSinGuardar(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("proyecciones-cambios-sin-guardar", {
            detail: { hayCambios: false },
          })
        );
      }
    }
  }, [semestresProyectados, proyeccionActivaId]);

  const seleccionarProyeccion = (id: string) => {
    const data = cargarProyeccionesGuardadas();
    if (!data) return;

    const proyeccion = data.proyecciones.find((p) => p.id === id);
    if (proyeccion) {
      if (proyeccionActivaId && mallaData) {
        const indiceActual = data.proyecciones.findIndex(
          (p) => p.id === proyeccionActivaId
        );
        if (indiceActual !== -1) {
          data.proyecciones[indiceActual].semestresProyectados =
            semestresProyectados;
          data.proyecciones[indiceActual].fechaModificacion =
            new Date().toISOString();
        }
      }

      data.proyeccionActiva = id;
      guardarProyecciones(data);
      setProyeccionActivaId(id);

      if (mallaData) {
        const proyeccionesValidadas = proyeccion.semestresProyectados.map(
          (semestre: ProyectadoSemestre) => ({
            ...semestre,
            cursos: semestre.cursos
              .map((cursoGuardado: MallaItem) =>
                mallaData.find((m) => m.codigo === cursoGuardado.codigo)
              )
              .filter(
                (curso: MallaItem | undefined): curso is MallaItem =>
                  curso !== undefined
              ),
          })
        );
        setSemestresProyectados(proyeccionesValidadas);
      } else {
        setSemestresProyectados(proyeccion.semestresProyectados);
      }

      setHayCambiosSinGuardar(false);
      setLastDeletedState(null);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("proyecciones-cambios-sin-guardar", {
            detail: { hayCambios: false },
          })
        );
      }

      setMostrarSelectorProyecciones(false);
    }
  };

  const eliminarProyeccion = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta proyección?"))
      return;

    // 1) Intentar borrar en el backend, pero sin bloquear el borrado local
    try {
      await deleteManualProjectionById(id);
    } catch (err) {
      console.warn(
        "No se pudo eliminar la proyección en el servidor (probablemente no existía aún). Se elimina solo localmente.",
        err
      );
      // OJO: NO hacemos return aquí
    }

    // 2) Lógica ORIGINAL de borrado local (idéntica a la que pegaste)
    const data = cargarProyeccionesGuardadas();
    if (!data) return;

    data.proyecciones = data.proyecciones.filter((p) => p.id !== id);

    if (data.proyeccionActiva === id) {
      if (data.proyecciones.length > 0) {
        data.proyeccionActiva = data.proyecciones[0].id;
        setProyeccionActivaId(data.proyecciones[0].id);
        setSemestresProyectados(data.proyecciones[0].semestresProyectados);
      } else {
        data.proyeccionActiva = null;
        setProyeccionActivaId(null);
        setSemestresProyectados([]);
      }
    }

    guardarProyecciones(data);
    setProyeccionesGuardadas(data.proyecciones);
    setLastDeletedState(null);
    showNotification("Proyección eliminada", "info");
  };

  const getLevelStorageKey = () => {
    if (!selectedCareer) return null;
    return `selectedLevel_${selectedCareer.codigo}_${selectedCareer.catalogo}`;
  };

  const isInitialLoadSessionRef = useRef(true);

  useEffect(() => {
    if (!selectedCareer) {
      setProyeccionesGuardadas([]);
      setProyeccionActivaId(null);
      setSemestresProyectados([]);
      setLastDeletedState(null);
      isInitialLoadSessionRef.current = true;
      return;
    }

    if (!mallaData) {
      isInitialLoadSessionRef.current = true;
      return;
    }

    const data = cargarProyeccionesGuardadas();
    if (data) {
      setProyeccionesGuardadas(data.proyecciones);
      setProyeccionActivaId(data.proyeccionActiva);

      const sessionKey = getSessionStorageKey();
      if (sessionKey && data.proyeccionActiva) {
        try {
          const sessionData = sessionStorage.getItem(sessionKey);
          if (sessionData) {
            const sessionParsed = JSON.parse(sessionData);
            if (sessionParsed.proyeccionActivaId === data.proyeccionActiva) {
              if (
                sessionParsed.semestresProyectados &&
                Array.isArray(sessionParsed.semestresProyectados)
              ) {
                const proyeccionesValidadas =
                  sessionParsed.semestresProyectados.map(
                    (semestre: ProyectadoSemestre) => ({
                      ...semestre,
                      cursos: semestre.cursos
                        .map((cursoGuardado: MallaItem) =>
                          mallaData.find(
                            (m) => m.codigo === cursoGuardado.codigo
                          )
                        )
                        .filter(
                          (curso: MallaItem | undefined): curso is MallaItem =>
                            curso !== undefined
                        ),
                    })
                  );
                setSemestresProyectados(proyeccionesValidadas);
                isInitialLoadSessionRef.current = true;
                return;
              }
            }
          }
        } catch (error) {
          console.error("Error al cargar desde sessionStorage:", error);
        }
      }

      if (data.proyeccionActiva) {
        const proyeccionActiva = data.proyecciones.find(
          (p) => p.id === data.proyeccionActiva
        );
        if (proyeccionActiva) {
          const proyeccionesValidadas =
            proyeccionActiva.semestresProyectados.map(
              (semestre: ProyectadoSemestre) => ({
                ...semestre,
                cursos: semestre.cursos
                  .map((cursoGuardado: MallaItem) =>
                    mallaData.find((m) => m.codigo === cursoGuardado.codigo)
                  )
                  .filter(
                    (curso: MallaItem | undefined): curso is MallaItem =>
                      curso !== undefined
                  ),
              })
            );
          setSemestresProyectados(proyeccionesValidadas);
        } else {
          setSemestresProyectados([]);
        }
      } else {
        setSemestresProyectados([]);
      }
      isInitialLoadSessionRef.current = true;
    } else {
      setProyeccionesGuardadas([]);
      setProyeccionActivaId(null);
      setSemestresProyectados([]);
      isInitialLoadSessionRef.current = true;
    }
  }, [selectedCareer, mallaData]);

  const guardarEnSessionStorage = (nuevosSemestres: ProyectadoSemestre[]) => {
    if (!selectedCareer || !proyeccionActivaId || !mallaData) return;

    if (isInitialLoadSessionRef.current) return;

    const sessionKey = getSessionStorageKey();
    if (sessionKey) {
      try {
        const sessionData = {
          proyeccionActivaId,
          semestresProyectados: nuevosSemestres,
        };
        sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
      } catch (error) {
        console.error("Error al guardar en sessionStorage:", error);
      }
    }
  };

  useEffect(() => {
    if (!selectedCareer || !proyeccionActivaId || !mallaData) return;

    if (isInitialLoadSessionRef.current) {
      isInitialLoadSessionRef.current = false;
      return;
    }

    guardarEnSessionStorage(semestresProyectados);
  }, [semestresProyectados, proyeccionActivaId, selectedCareer, mallaData]);

  useEffect(() => {
    isInitialLoadSessionRef.current = true;
  }, [selectedCareer, proyeccionActivaId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        mostrarSelectorProyecciones &&
        !target.closest(`.${styles.proyeccionesSelectorContainer}`)
      ) {
        setMostrarSelectorProyecciones(false);
      }
    };

    if (mostrarSelectorProyecciones) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [mostrarSelectorProyecciones]);

  useEffect(() => {
    const handleGuardarYCerrar = () => {
      if (proyeccionActivaId) {
        const semestresVacios = semestresProyectados.filter(
          (semestre) => semestre.cursos.length === 0
        );
        if (semestresVacios.length > 0) {
          const semestresConCursos = semestresProyectados.filter(
            (semestre) => semestre.cursos.length > 0
          );

          const data = cargarProyeccionesGuardadas();
          if (data) {
            const indice = data.proyecciones.findIndex(
              (p) => p.id === proyeccionActivaId
            );
            if (indice !== -1) {
              data.proyecciones[indice].semestresProyectados =
                semestresConCursos;
              data.proyecciones[indice].fechaModificacion =
                new Date().toISOString();
              guardarProyecciones(data);

              setSemestresProyectados(semestresConCursos);

              const sessionKey = getSessionStorageKey();
              if (sessionKey) {
                sessionStorage.removeItem(sessionKey);
              }
            }
          }
        } else {
          const data = cargarProyeccionesGuardadas();
          if (data) {
            const indice = data.proyecciones.findIndex(
              (p) => p.id === proyeccionActivaId
            );
            if (indice !== -1) {
              data.proyecciones[indice].semestresProyectados =
                semestresProyectados;
              data.proyecciones[indice].fechaModificacion =
                new Date().toISOString();
              guardarProyecciones(data);

              const sessionKey = getSessionStorageKey();
              if (sessionKey) {
                sessionStorage.removeItem(sessionKey);
              }
            }
          }
        }
      }
    };

    const handleDescartarYCerrar = () => {
      const sessionKey = getSessionStorageKey();
      if (sessionKey) {
        sessionStorage.removeItem(sessionKey);
      }
    };

    window.addEventListener(
      "proyecciones-guardar-y-cerrar",
      handleGuardarYCerrar
    );
    window.addEventListener(
      "proyecciones-descartar-y-cerrar",
      handleDescartarYCerrar
    );

    return () => {
      window.removeEventListener(
        "proyecciones-guardar-y-cerrar",
        handleGuardarYCerrar
      );
      window.removeEventListener(
        "proyecciones-descartar-y-cerrar",
        handleDescartarYCerrar
      );
    };
  }, [semestresProyectados, proyeccionActivaId]);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  const showNotification = (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => {
    setNotification({ message, type });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !selectedCareer) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [malla, avance] = await Promise.all([
          getMallaData(selectedCareer.codigo, selectedCareer.catalogo),
          getAvanceData(
            user.rut,
            selectedCareer.codigo,
            selectedCareer.catalogo
          ),
        ]);

        setMallaData(malla);
        setAvanceData(avance);
      } catch (err) {
        setError("Error al cargar los datos");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedCareer]);

  useEffect(() => {
    if (!selectedCareer) {
      setSelectedLevel(null);
      return;
    }

    const levelStorageKey = getLevelStorageKey();
    if (!levelStorageKey) return;

    try {
      const stored = localStorage.getItem(levelStorageKey);
      if (stored) {
        const parsedLevel = parseInt(stored, 10);
        if (!isNaN(parsedLevel) && parsedLevel > 0) {
          setSelectedLevel(parsedLevel);
          return;
        }
      }
    } catch (error) {
      console.error(
        "Error al cargar nivel seleccionado desde localStorage:",
        error
      );
    }

    if (mallaData && avanceData) {
      const cursosAprobadosOInscritos = new Set(
        (avanceData || [])
          .filter(
            (curso) =>
              curso.status === "APROBADO" || curso.status === "INSCRITO"
          )
          .map((curso) => curso.course)
      );

      const mallaByLevel = mallaData.reduce((acc, item) => {
        if (!acc[item.nivel]) {
          acc[item.nivel] = [];
        }
        acc[item.nivel].push(item);
        return acc;
      }, {} as { [key: number]: MallaItem[] });

      const levels = Object.keys(mallaByLevel)
        .map(Number)
        .sort((a, b) => a - b);

      for (const level of levels) {
        const cursosDelNivel = mallaByLevel[level];
        const tienePendientes = cursosDelNivel.some(
          (curso) => !cursosAprobadosOInscritos.has(curso.codigo)
        );

        if (tienePendientes) {
          setSelectedLevel(level);
          break;
        }
      }
    }
  }, [mallaData, avanceData, selectedCareer]);

  useEffect(() => {
    if (!selectedCareer) return;

    const levelStorageKey = getLevelStorageKey();
    if (!levelStorageKey) return;

    try {
      if (selectedLevel !== null) {
        localStorage.setItem(levelStorageKey, selectedLevel.toString());
      } else {
        localStorage.removeItem(levelStorageKey);
      }
    } catch (error) {
      console.error(
        "Error al guardar nivel seleccionado en localStorage:",
        error
      );
    }
  }, [selectedLevel, selectedCareer]);

  const mallaByLevel = mallaData
    ? mallaData.reduce((acc, item) => {
        if (!acc[item.nivel]) {
          acc[item.nivel] = [];
        }
        acc[item.nivel].push(item);
        return acc;
      }, {} as { [key: number]: MallaItem[] })
    : {};

  const cursosAprobadosOInscritos = new Set(
    (avanceData || [])
      .filter(
        (curso) => curso.status === "APROBADO" || curso.status === "INSCRITO"
      )
      .map((curso) => curso.course)
  );

  const getSemestresPendientes = (): number[] => {
    if (!mallaData) return [];

    const levels = Object.keys(mallaByLevel)
      .map(Number)
      .sort((a, b) => a - b);
    const semestresPendientes: number[] = [];

    for (const level of levels) {
      const cursosDelNivel = mallaByLevel[level];
      const tienePendientes = cursosDelNivel.some(
        (curso) => !cursosAprobadosOInscritos.has(curso.codigo)
      );

      if (tienePendientes) {
        semestresPendientes.push(level);
      }
    }

    return semestresPendientes;
  };

  const semestresPendientes = getSemestresPendientes();

  const getCursosPendientes = (level: number): MallaItem[] => {
    if (!mallaByLevel[level]) return [];

    return mallaByLevel[level].filter(
      (curso) => !cursosAprobadosOInscritos.has(curso.codigo)
    );
  };

  const cursosPendientes = selectedLevel
    ? getCursosPendientes(selectedLevel)
    : [];

  const toRoman = (num: number): string => {
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

  const getNextSemester = (): string => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (currentMonth < 6) {
      return `${currentYear}-2`;
    } else {
      return `${currentYear + 1}-1`;
    }
  };

  const formatPeriodo = (periodo: string): string => {
    const [year, term] = periodo.split("-");
    const termRoman = term === "1" ? "I" : "II";
    return `${year}-${termRoman}`;
  };

  const handleAddSemester = () => {
    if (!proyeccionActivaId) {
      showNotification(
        "Debes seleccionar o crear una proyección primero",
        "warning"
      );
      return;
    }
    setLastDeletedState(null);
    const newPeriodo = getNextSemester();

    if (semestresProyectados.length > 0) {
      const lastSemester =
        semestresProyectados[semestresProyectados.length - 1];
      const [lastYear, lastTerm] = lastSemester.periodo.split("-");

      let nextYear = parseInt(lastYear);
      let nextTerm = lastTerm === "1" ? "2" : "1";

      if (lastTerm === "2") {
        nextYear += 1;
      }

      const newId = `${nextYear}-${nextTerm}`;
      const nuevosSemestres = [
        ...semestresProyectados,
        {
          id: newId,
          periodo: newId,
          cursos: [],
        },
      ];
      setSemestresProyectados(nuevosSemestres);
      guardarEnSessionStorage(nuevosSemestres);
    } else {
      const nuevosSemestres = [
        {
          id: newPeriodo,
          periodo: newPeriodo,
          cursos: [],
        },
      ];
      setSemestresProyectados(nuevosSemestres);
      guardarEnSessionStorage(nuevosSemestres);
    }
  };

  const handleRemoveSemester = (id: string) => {
    if (semestresProyectados.length === 0) return;

    const semestresOrdenados = [...semestresProyectados].sort((a, b) => {
      const [aYear, aTerm] = a.periodo.split("-").map(Number);
      const [bYear, bTerm] = b.periodo.split("-").map(Number);
      if (aYear !== bYear) return aYear - bYear;
      return aTerm - bTerm;
    });

    const ultimoSemestre = semestresOrdenados[semestresOrdenados.length - 1];

    if (ultimoSemestre.id !== id) {
      showNotification(
        "Solo puedes eliminar el último semestre. Elimina los semestres desde el último hacia el primero.",
        "warning"
      );
      return;
    }

    const nuevosSemestres = semestresProyectados.filter((s) => s.id !== id);
    setSemestresProyectados(nuevosSemestres);
    guardarEnSessionStorage(nuevosSemestres);
  };

  const isLastSemester = (semestreId: string): boolean => {
    if (semestresProyectados.length === 0) return false;

    const semestresOrdenados = [...semestresProyectados].sort((a, b) => {
      const [aYear, aTerm] = a.periodo.split("-").map(Number);
      const [bYear, bTerm] = b.periodo.split("-").map(Number);
      if (aYear !== bYear) return aYear - bYear;
      return aTerm - bTerm;
    });

    const ultimoSemestre = semestresOrdenados[semestresOrdenados.length - 1];
    return ultimoSemestre.id === semestreId;
  };

  const handleDragStart = (e: React.DragEvent, curso: MallaItem) => {
    if (!proyeccionActivaId) {
      e.preventDefault();
      showNotification(
        "Debes seleccionar o crear una proyección primero",
        "warning"
      );
      return;
    }
    setDraggedCourse(curso);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", curso.codigo);
  };

  const handleDragOver = (e: React.DragEvent, semestreId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSemester(semestreId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSemester(null);
  };

  const getSemestreDelAnioPorNivel = (nivel: number): number => {
    return nivel % 2 === 1 ? 1 : 2;
  };

  const tieneNumeroRomano = (nombre: string): boolean => {
    const patterns = [/\s+(I{1,3})\s/, /\s+(I{1,3})$/];

    for (const pattern of patterns) {
      if (pattern.test(nombre)) {
        return true;
      }
    }
    return false;
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

  const handleDrop = (e: React.DragEvent, semestreId: string) => {
    e.preventDefault();
    if (!draggedCourse) return;

    setLastDeletedState(null);

    const targetSemester = semestresProyectados.find(
      (s) => s.id === semestreId
    );
    if (!targetSemester) return;

    const validation = canEnrollInSemester(
      draggedCourse,
      targetSemester.periodo,
      targetSemester.cursos
    );

    if (!validation.valid) {
      showNotification(
        validation.reason ||
          "No se puede inscribir este curso en este semestre.",
        "warning"
      );

      const cursoExiste = targetSemester.cursos.some(
        (c) => c.codigo === draggedCourse.codigo
      );

      if (!cursoExiste) {
        const advertenciaKey = `${semestreId}-${draggedCourse.codigo}`;

        const nuevosSemestresConAdvertencia = semestresProyectados.map(
          (semestre) => {
            if (semestre.id === semestreId) {
              return {
                ...semestre,
                cursos: [...semestre.cursos, draggedCourse],
              };
            }
            return semestre;
          }
        );
        setSemestresProyectados(nuevosSemestresConAdvertencia);
        guardarEnSessionStorage(nuevosSemestresConAdvertencia);

        setCursosConAdvertencia((prev) => new Set(prev).add(advertenciaKey));

        setTimeout(() => {
          setSemestresProyectados((prev) => {
            const nuevosSemestresSinAdvertencia = prev.map((semestre) => {
              if (semestre.id === semestreId) {
                return {
                  ...semestre,
                  cursos: semestre.cursos.filter(
                    (c) => c.codigo !== draggedCourse.codigo
                  ),
                };
              }
              return semestre;
            });
            guardarEnSessionStorage(nuevosSemestresSinAdvertencia);
            return nuevosSemestresSinAdvertencia;
          });

          setCursosConAdvertencia((prev) => {
            const nuevo = new Set(prev);
            nuevo.delete(advertenciaKey);
            return nuevo;
          });
        }, 3000);
      }

      setDraggedCourse(null);
      setDragOverSemester(null);
      return;
    }

    const nuevosSemestres = semestresProyectados.map((semestre) => {
      if (semestre.id === semestreId) {
        const cursoExiste = semestre.cursos.some(
          (c) => c.codigo === draggedCourse.codigo
        );
        if (!cursoExiste) {
          return {
            ...semestre,
            cursos: [...semestre.cursos, draggedCourse],
          };
        }
      }
      return semestre;
    });
    setSemestresProyectados(nuevosSemestres);
    guardarEnSessionStorage(nuevosSemestres);

    setDraggedCourse(null);
    setDragOverSemester(null);
  };

  const handleRemoveCourseFromSemester = (
    semestreId: string,
    cursoCodigo: string
  ) => {
    const advertenciaKey = `${semestreId}-${cursoCodigo}`;
    setCursosConAdvertencia((prev) => {
      const nuevo = new Set(prev);
      nuevo.delete(advertenciaKey);
      return nuevo;
    });

    const estadoAnterior = JSON.parse(JSON.stringify(semestresProyectados));
    const nuevosSemestres = semestresProyectados.map((semestre) => {
      if (semestre.id === semestreId) {
        return {
          ...semestre,
          cursos: semestre.cursos.filter((c) => c.codigo !== cursoCodigo),
        };
      }
      return semestre;
    });

    setLastDeletedState(estadoAnterior);

    setSemestresProyectados(nuevosSemestres);
    guardarEnSessionStorage(nuevosSemestres);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (proyeccionActivaId && lastDeletedState) {
          setSemestresProyectados(lastDeletedState);
          guardarEnSessionStorage(lastDeletedState);
          setLastDeletedState(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lastDeletedState, proyeccionActivaId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>MIS PROYECCIONES</h1>
        <p className={styles.loadingText}>Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>MIS PROYECCIONES</h1>
        <p className={styles.errorText}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
          duration={notification.type === "warning" ? 3000 : 5000}
        />
      )}
      <h1 className={styles.title}>MIS PROYECCIONES</h1>

      <div className={styles.selectorsRow}>
        <CareerSelector
          selectedCareer={selectedCareer}
          onCareerChange={handleCareerChange}
        />

        <div className={styles.proyeccionesSelectorContainer}>
          <button
            className={`${styles.proyeccionesSelectorButton} ${
              mostrarSelectorProyecciones ? styles.open : ""
            }`}
            onClick={() =>
              setMostrarSelectorProyecciones(!mostrarSelectorProyecciones)
            }
          >
            <span className={styles.proyeccionButtonText}>
              {proyeccionActivaId
                ? proyeccionesGuardadas.find((p) => p.id === proyeccionActivaId)
                    ?.nombre || "Sin nombre"
                : "Seleccionar proyección"}
            </span>
          </button>

          {mostrarSelectorProyecciones && (
            <div className={styles.proyeccionesDropdown}>
              {proyeccionesGuardadas.length === 0 ? (
                <div className={styles.emptyProyecciones}>
                  <p>No hay proyecciones guardadas</p>
                </div>
              ) : (
                proyeccionesGuardadas.map((proyeccion) => (
                  <div
                    key={proyeccion.id}
                    className={`${styles.proyeccionItem} ${
                      proyeccion.id === proyeccionActivaId
                        ? styles.proyeccionItemActive
                        : ""
                    }`}
                    onClick={() => seleccionarProyeccion(proyeccion.id)}
                  >
                    <div className={styles.proyeccionItemContent}>
                      <span className={styles.proyeccionNombre}>
                        {proyeccion.nombre}
                      </span>
                      <span className={styles.proyeccionFecha}>
                        {new Date(
                          proyeccion.fechaModificacion
                        ).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <button
                      className={styles.deleteProyeccionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarProyeccion(proyeccion.id);
                      }}
                      title="Eliminar proyección"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                ))
              )}
              <div className={styles.proyeccionesActions}>
                <button
                  className={styles.newProyeccionButton}
                  onClick={crearNuevaProyeccion}
                >
                  + Nueva Proyección
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {semestresPendientes.length > 0 && (
        <div className={styles.levelSelectorContainer}>
          <div className={styles.selectLevelButton}>Seleccionar Nivel</div>
          <div className={styles.levelButtonsContainer}>
            {semestresPendientes.map((level) => (
              <button
                key={level}
                className={`${styles.levelButton} ${
                  selectedLevel === level ? styles.levelButtonSelected : ""
                }`}
                onClick={() => setSelectedLevel(level)}
              >
                {toRoman(level)}
              </button>
            ))}
          </div>

          {selectedLevel && cursosPendientes.length > 0 && (
            <div className={styles.coursesContainer}>
              {cursosPendientes.map((curso) => {
                const isInProjected = semestresProyectados.some((semestre) =>
                  semestre.cursos.some((c) => c.codigo === curso.codigo)
                );

                return (
                  <div
                    key={curso.codigo}
                    className={`${styles.courseCard} ${styles.draggableCourse}`}
                    draggable={!isInProjected && !!proyeccionActivaId}
                    onDragStart={(e) => handleDragStart(e, curso)}
                    style={{
                      opacity: isInProjected || !proyeccionActivaId ? 0.5 : 1,
                      cursor:
                        isInProjected || !proyeccionActivaId
                          ? "not-allowed"
                          : "grab",
                    }}
                  >
                    <div className={styles.courseCode}>{curso.codigo}</div>
                    <div className={styles.courseName}>{curso.asignatura}</div>
                    <div className={styles.courseCredits}>
                      {curso.creditos} SCT
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedLevel && cursosPendientes.length === 0 && (
            <div className={styles.noCourses}>
              <p>No hay cursos pendientes para este semestre</p>
            </div>
          )}
        </div>
      )}

      {semestresPendientes.length === 0 && (
        <div className={styles.noData}>
          <p className={styles.noDataText}>No hay semestres pendientes</p>
        </div>
      )}

      <div className={styles.projectedSemestersSection}>
        <div className={styles.semestersContainer}>
          {semestresProyectados.map((semestre) => (
            <div key={semestre.id} className={styles.semesterColumn}>
              {isLastSemester(semestre.id) && (
                <button
                  className={styles.removeSemesterButton}
                  onClick={() => handleRemoveSemester(semestre.id)}
                  title="Eliminar semestre"
                >
                  ×
                </button>
              )}
              <div className={styles.semesterHeader}>
                {formatPeriodo(semestre.periodo)}
              </div>
              <div
                className={`${styles.semesterCoursesContainer} ${
                  dragOverSemester === semestre.id ? styles.dragOver : ""
                } ${!proyeccionActivaId ? styles.disabledDropZone : ""}`}
                onDragOver={
                  proyeccionActivaId
                    ? (e) => handleDragOver(e, semestre.id)
                    : undefined
                }
                onDragLeave={proyeccionActivaId ? handleDragLeave : undefined}
                onDrop={
                  proyeccionActivaId
                    ? (e) => handleDrop(e, semestre.id)
                    : undefined
                }
              >
                {semestre.cursos.length === 0 ? (
                  <div className={styles.emptySemester}>
                    <p>Arrastre los cursos aquí</p>
                  </div>
                ) : (
                  semestre.cursos.map((curso) => {
                    const advertenciaKey = `${semestre.id}-${curso.codigo}`;
                    const tieneAdvertencia =
                      cursosConAdvertencia.has(advertenciaKey);

                    return (
                      <div
                        key={curso.codigo}
                        className={styles.projectedCourseCard}
                      >
                        {tieneAdvertencia ? (
                          <div className={styles.warningIcon}>!</div>
                        ) : (
                          <button
                            className={styles.removeCourseButton}
                            onClick={() =>
                              handleRemoveCourseFromSemester(
                                semestre.id,
                                curso.codigo
                              )
                            }
                            title="Eliminar curso"
                          >
                            ×
                          </button>
                        )}
                        <div className={styles.courseCode}>{curso.codigo}</div>
                        <div className={styles.courseName}>
                          {curso.asignatura}
                        </div>
                        <div className={styles.courseCredits}>
                          {curso.creditos} SCT
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}

          {proyeccionActivaId && (
            <div className={styles.addSemesterColumn}>
              <button
                className={styles.addSemesterButton}
                onClick={handleAddSemester}
                title="Añadir semestre"
              >
                <div className={styles.addSemesterIcon}>+</div>
                <div className={styles.addSemesterText}>AÑADIR SEMESTRE</div>
              </button>
            </div>
          )}
        </div>
      </div>

      {proyeccionActivaId && (
        <div className={styles.saveButtonContainer}>
          <button
            className={styles.saveProyeccionButton}
            onClick={guardarProyeccionActual}
            disabled={!hayCambiosSinGuardar}
          >
            ✓ Guardar
          </button>
          <button
            className={styles.discardButton}
            onClick={descartarCambios}
            disabled={!hayCambiosSinGuardar}
          >
            ✕ Descartar
          </button>
        </div>
      )}
    </div>
  );
}
