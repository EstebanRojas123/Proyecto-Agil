"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCareerSelection } from "@/context/CareerSelectionContext";
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
import {
  ProyectadoSemestre,
} from "./types/proyecciones.types";
import {
  getStorageKey,
  getSessionStorageKey,
  getLevelStorageKey,
  generarIdProyeccion,
  cargarProyeccionesGuardadas,
  guardarProyecciones,
  getNextSemester,
  toRoman,
  formatPeriodo,
} from "./utils/proyecciones.utils";
import { useProyecciones } from "./hooks/useProyecciones";
import { useValidaciones } from "./hooks/useValidaciones";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import ProyeccionesSelector from "./ProyeccionesSelector";
import SemesterColumn from "./SemesterColumn";
import AddSemesterButton from "./AddSemesterButton";

export default function MisProyecciones() {
  const { user } = useAuth();
  const { selectedCareer, handleCareerChange } = useCareerSelection();
  const [mallaData, setMallaData] = useState<MallaItem[] | null>(null);
  const [avanceData, setAvanceData] = useState<Curso[] | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [semestresProyectados, setSemestresProyectados] = useState<
    ProyectadoSemestre[]
  >([]);
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);

  const [lastDeletedState, setLastDeletedState] = useState<
    ProyectadoSemestre[] | null
  >(null);

  const [lastDeletedCourse, setLastDeletedCourse] = useState<{
    curso: MallaItem;
    semestreId: string;
    indiceOriginal: number;
  } | null>(null);

  const [pendingRestore, setPendingRestore] = useState<{
    curso: MallaItem;
    semestreId: string;
    indiceOriginal: number;
  } | null>(null);

  const justRestoredRef = useRef(false);

  const [cursosConAdvertencia, setCursosConAdvertencia] = useState<Set<string>>(
    new Set()
  );

  const {
    proyeccionesGuardadas,
    setProyeccionesGuardadas,
    proyeccionActivaId,
    setProyeccionActivaId,
    mostrarSelectorProyecciones,
    setMostrarSelectorProyecciones,
    cargarProyeccionesDesdeBackend,
    crearNuevaProyeccion: crearNuevaProyeccionHook,
  } = useProyecciones({
    user,
    selectedCareer,
    mallaData,
  });

  const crearNuevaProyeccion = () => {
    crearNuevaProyeccionHook();
    setSemestresProyectados([]);
    setHayCambiosSinGuardar(false);
    setLastDeletedState(null);
    setLastDeletedCourse(null);
    setPendingRestore(null);
    showNotification("Nueva proyección creada", "success");
  };

  const buildManualProjectionPayload = (): ManualProjectionPayload | null => {
    if (!user || !user.rut || !proyeccionActivaId || !selectedCareer) {
      console.warn(
        "Falta user.rut, proyeccionActivaId o selectedCareer para guardar en backend"
      );
      return null;
    }

    return {
      Carrera: selectedCareer.codigo,
      estudiante: user.rut, 
      proyeccionActivaId,
      semestresProyectados: semestresProyectados.map((sem) => ({
        id: sem.id,
        periodo: sem.periodo,
        cursos: sem.cursos.map((curso) => ({
          codigo: curso.codigo,
          asignatura: curso.asignatura,
          creditos: curso.creditos,
          nivel: curso.nivel,
          prereq: curso.prereq ?? "",
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

    const validation = validateAllProjection();
    if (!validation.valid && validation.violations.length > 0) {
      if (lastDeletedCourse) {
        const cursosAfectados = validation.violations.map(
          (v) => `${v.curso.codigo} (${v.curso.asignatura})`
        );
        const listaCursos =
          cursosAfectados.length === 1
            ? cursosAfectados[0]
            : cursosAfectados.length === 2
            ? `${cursosAfectados[0]} ni ${cursosAfectados[1]}`
            : `${cursosAfectados.slice(0, -1).join(", ")}, ni ${cursosAfectados[cursosAfectados.length - 1]}`;

        setPendingRestore({
          curso: lastDeletedCourse.curso,
          semestreId: lastDeletedCourse.semestreId,
          indiceOriginal: lastDeletedCourse.indiceOriginal,
        });

        const nuevasAdvertencias = new Set<string>();
        validation.violations.forEach(
          (violation: {
            curso: MallaItem;
            semestre: string;
            reason: string;
          }) => {
            const semestreConViolacion = semestresProyectados.find(
              (s) => s.periodo === violation.semestre
            );
            if (semestreConViolacion) {
              const advertenciaKey = `${semestreConViolacion.id}-${violation.curso.codigo}`;
              nuevasAdvertencias.add(advertenciaKey);
            }
          }
        );
        setCursosConAdvertencia(nuevasAdvertencias);

        showNotification(
          `No se puede guardar: ${listaCursos} si elimina el prerrequisito ${lastDeletedCourse.curso.codigo} (${lastDeletedCourse.curso.asignatura}).`,
          "error"
        );
      } else {
        const nuevasAdvertencias = new Set<string>();
        validation.violations.forEach(
          (violation: {
            curso: MallaItem;
            semestre: string;
            reason: string;
          }) => {
            const semestreConViolacion = semestresProyectados.find(
              (s) => s.periodo === violation.semestre
            );
            if (semestreConViolacion) {
              const advertenciaKey = `${semestreConViolacion.id}-${violation.curso.codigo}`;
              nuevasAdvertencias.add(advertenciaKey);
            }
          }
        );
        setCursosConAdvertencia(nuevasAdvertencias);

        const primeraViolacion = validation.violations[0];
        showNotification(
          `No se puede guardar: ${primeraViolacion.curso.codigo} (${primeraViolacion.curso.asignatura}) en ${formatPeriodo(primeraViolacion.semestre)}: ${primeraViolacion.reason}${validation.violations.length > 1 ? ` (y ${validation.violations.length - 1} más)` : ""}`,
          "error"
        );
      }
      return;
    }

    const storageKey = getStorageKey(selectedCareer);
    const data = storageKey
      ? cargarProyeccionesGuardadas(storageKey, generarIdProyeccion) || {
          proyecciones: [],
          proyeccionActiva: null,
        }
      : {
          proyecciones: [],
          proyeccionActiva: null,
        };
    const indice = data.proyecciones.findIndex(
      (p) => p.id === proyeccionActivaId
    );

    if (indice !== -1) {
      data.proyecciones[indice].semestresProyectados = semestresProyectados;
      data.proyecciones[indice].fechaModificacion = new Date().toISOString();
      if (storageKey) {
        guardarProyecciones(storageKey, data);
      }
      setProyeccionesGuardadas(data.proyecciones);
      setHayCambiosSinGuardar(false);

      const sessionKey = getSessionStorageKey(selectedCareer);
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

    const storageKey = getStorageKey(selectedCareer);
    const data = storageKey
      ? cargarProyeccionesGuardadas(storageKey, generarIdProyeccion)
      : null;
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
      setLastDeletedCourse(null);
      setPendingRestore(null);

      const sessionKey = getSessionStorageKey(selectedCareer);
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


  useEffect(() => {
    if (proyeccionActivaId) {
      const storageKey = getStorageKey(selectedCareer);
      const data = storageKey
        ? cargarProyeccionesGuardadas(storageKey, generarIdProyeccion)
        : null;
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
    const storageKey = getStorageKey(selectedCareer);
    const data = storageKey
      ? cargarProyeccionesGuardadas(storageKey, generarIdProyeccion)
      : null;
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
      if (storageKey) {
        guardarProyecciones(storageKey, data);
      }
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
      setLastDeletedCourse(null);
      setPendingRestore(null);

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

    try {
      await deleteManualProjectionById(id);
    } catch (err) {
      console.warn(
        "No se pudo eliminar la proyección en el servidor (probablemente no existía aún). Se elimina solo localmente.",
        err
      );
    }

    const storageKey = getStorageKey(selectedCareer);
    const data = storageKey
      ? cargarProyeccionesGuardadas(storageKey, generarIdProyeccion)
      : null;
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

    if (storageKey) {
      guardarProyecciones(storageKey, data);
    }
    setProyeccionesGuardadas(data.proyecciones);
    setLastDeletedState(null);
    setLastDeletedCourse(null);
    setPendingRestore(null);
    showNotification("Proyección eliminada", "info");
  };

  const isInitialLoadSessionRef = useRef(true);

  useEffect(() => {
    if (!selectedCareer) {
      setProyeccionesGuardadas([]);
      setProyeccionActivaId(null);
      setSemestresProyectados([]);
      setLastDeletedState(null);
      setLastDeletedCourse(null);
      setPendingRestore(null);
      isInitialLoadSessionRef.current = true;
      return;
    }

    if (!mallaData) {
      isInitialLoadSessionRef.current = true;
      return;
    }

    if (user?.rut) {
      cargarProyeccionesDesdeBackend();
    } else {
      const storageKey = getStorageKey(selectedCareer);
      const data = storageKey
        ? cargarProyeccionesGuardadas(storageKey, generarIdProyeccion)
        : null;
      if (data) {
        setProyeccionesGuardadas(data.proyecciones);
        setProyeccionActivaId(data.proyeccionActiva);

        const sessionKey = getSessionStorageKey(selectedCareer);
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
    }
  }, [selectedCareer, mallaData, user?.rut]);

  const guardarEnSessionStorage = (nuevosSemestres: ProyectadoSemestre[]) => {
    if (!selectedCareer || !proyeccionActivaId || !mallaData) return;

    if (isInitialLoadSessionRef.current) return;

    const sessionKey = getSessionStorageKey(selectedCareer);
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

  const proyeccionActivaIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!proyeccionActivaId || !mallaData || !proyeccionesGuardadas.length) {
      if (!proyeccionActivaId) {
        setSemestresProyectados([]);
      }
      return;
    }

    if (proyeccionActivaIdRef.current === proyeccionActivaId) {
      return;
    }

    const proyeccion = proyeccionesGuardadas.find(
      (p) => p.id === proyeccionActivaId
    );

    if (proyeccion) {
      proyeccionActivaIdRef.current = proyeccionActivaId;
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
      setHayCambiosSinGuardar(false);
      setLastDeletedState(null);
      setLastDeletedCourse(null);
      setPendingRestore(null);
      isInitialLoadSessionRef.current = true;

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("proyecciones-cambios-sin-guardar", {
            detail: { hayCambios: false },
          })
        );
      }
    } else {
      setSemestresProyectados([]);
    }
  }, [proyeccionActivaId, proyeccionesGuardadas, mallaData]);

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
      if (user?.rut && selectedCareer) {
        cargarProyeccionesDesdeBackend(true);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [mostrarSelectorProyecciones, user?.rut, selectedCareer]);

  useEffect(() => {
    const handleGuardarYCerrar = async () => {
      if (proyeccionActivaId) {
        const semestresVacios = semestresProyectados.filter(
          (semestre) => semestre.cursos.length === 0
        );
        
        let semestresAGuardar = semestresProyectados;
        if (semestresVacios.length > 0) {
          semestresAGuardar = semestresProyectados.filter(
            (semestre) => semestre.cursos.length > 0
          );
        }

        const storageKey = getStorageKey(selectedCareer);
        const data = storageKey
          ? cargarProyeccionesGuardadas(storageKey, generarIdProyeccion) || {
              proyecciones: [],
              proyeccionActiva: null,
            }
          : {
              proyecciones: [],
              proyeccionActiva: null,
            };
        
        const indice = data.proyecciones.findIndex(
          (p) => p.id === proyeccionActivaId
        );

        if (indice !== -1) {
          data.proyecciones[indice].semestresProyectados = semestresAGuardar;
          data.proyecciones[indice].fechaModificacion = new Date().toISOString();
          if (storageKey) {
            guardarProyecciones(storageKey, data);
          }

          setSemestresProyectados(semestresAGuardar);
          setHayCambiosSinGuardar(false);

          const sessionKey = getSessionStorageKey(selectedCareer);
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

          const payload = buildManualProjectionPayload();
          if (payload) {
            try {
              await saveManualProjection(payload);
            } catch (err) {
              console.error("Error al guardar proyección en backend al cerrar sesión:", err);
            }
          }
        }
      }
    };

    const handleDescartarYCerrar = () => {
      if (!proyeccionActivaId) return;

      const storageKey = getStorageKey(selectedCareer);
      const data = storageKey
        ? cargarProyeccionesGuardadas(storageKey, generarIdProyeccion)
        : null;
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
        setLastDeletedCourse(null);

        const sessionKey = getSessionStorageKey(selectedCareer);
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
    
    if (pendingRestore && lastDeletedState) {
      const estadoARestaurar = JSON.parse(JSON.stringify(lastDeletedState));
      setPendingRestore(null);
      setLastDeletedCourse(null);
      
      setSemestresProyectados(estadoARestaurar);
      guardarEnSessionStorage(estadoARestaurar);
      setLastDeletedState(null);
      
      setTimeout(() => {
        const validation = validateAllProjection(estadoARestaurar);
        
        const nuevasAdvertencias = new Set<string>();
        if (!validation.valid && validation.violations.length > 0) {
          validation.violations.forEach((violation) => {
            const semestreConViolacion = estadoARestaurar.find(
              (s: ProyectadoSemestre) => s.periodo === violation.semestre
            );
            if (semestreConViolacion) {
              const advertenciaKey = `${semestreConViolacion.id}-${violation.curso.codigo}`;
              nuevasAdvertencias.add(advertenciaKey);
            }
          });
        }
        
        setCursosConAdvertencia(nuevasAdvertencias);
      }, 200);
    } else {
      setCursosConAdvertencia(new Set<string>());
    }
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

    const levelStorageKey = getLevelStorageKey(selectedCareer);
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

    const levelStorageKey = getLevelStorageKey(selectedCareer);
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

  const {
    canEnrollInSemester,
    cursosAprobadosOInscritos,
    validateAllProjection,
  } = useValidaciones({
    mallaData,
    avanceData,
    semestresProyectados,
  });

  const {
    draggedCourse,
    dragOverSemester,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop({
    semestresProyectados,
    setSemestresProyectados,
    proyeccionActivaId,
    canEnrollInSemester,
    setCursosConAdvertencia,
    setLastDeletedState,
    guardarEnSessionStorage,
    showNotification,
  });

  const mallaByLevel = mallaData
    ? mallaData.reduce((acc, item) => {
        if (!acc[item.nivel]) {
          acc[item.nivel] = [];
        }
        acc[item.nivel].push(item);
        return acc;
      }, {} as { [key: number]: MallaItem[] })
    : {};

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

  const handleAddSemester = () => {
    if (!proyeccionActivaId) {
      showNotification(
        "Debes seleccionar o crear una proyección primero",
        "warning"
      );
      return;
    }
    setLastDeletedState(null);
    setLastDeletedCourse(null);
    setPendingRestore(null);
    const newPeriodo = getNextSemester();

    if (semestresProyectados.length > 0) {
      const lastSemester =
        semestresProyectados[semestresProyectados.length - 1];
      const [lastYear, lastTerm] = lastSemester.periodo.split("-");

      let nextYear = parseInt(lastYear);
      const nextTerm = lastTerm === "1" ? "2" : "1";

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
    const semestreOrigen = semestresProyectados.find((s) => s.id === semestreId);
    const indiceOriginal = semestreOrigen?.cursos.findIndex(
      (c) => c.codigo === cursoCodigo
    ) ?? -1;
    const cursoEliminado = indiceOriginal >= 0 ? semestreOrigen?.cursos[indiceOriginal] : undefined;

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
    if (cursoEliminado && indiceOriginal >= 0) {
      setLastDeletedCourse({
        curso: cursoEliminado,
        semestreId: semestreId,
        indiceOriginal: indiceOriginal,
      });
    }
    setSemestresProyectados(nuevosSemestres);
    guardarEnSessionStorage(nuevosSemestres);

    if (cursoEliminado && indiceOriginal >= 0) {
      setTimeout(() => {
        setSemestresProyectados((currentSemestres) => {
          const validation = validateAllProjection(currentSemestres);
          
          if (!validation.valid && validation.violations.length > 0) {
            const cursosAfectados = validation.violations.map(
              (v) => `${v.curso.codigo} (${v.curso.asignatura})`
            );
            const listaCursos =
              cursosAfectados.length === 1
                ? cursosAfectados[0]
                : cursosAfectados.length === 2
                ? `${cursosAfectados[0]} ni ${cursosAfectados[1]}`
                : `${cursosAfectados.slice(0, -1).join(", ")}, ni ${cursosAfectados[cursosAfectados.length - 1]}`;

            showNotification(
              `No se puede eliminar ${cursoEliminado.codigo} (${cursoEliminado.asignatura}): ${listaCursos} depende de este curso.`,
              "warning"
            );

            const nuevasAdvertencias = new Set<string>();
            validation.violations.forEach((violation) => {
              const semestreConViolacion = currentSemestres.find(
                (s) => s.periodo === violation.semestre
              );
              if (semestreConViolacion) {
                const advertenciaKey = `${semestreConViolacion.id}-${violation.curso.codigo}`;
                nuevasAdvertencias.add(advertenciaKey);
              }
            });
            setCursosConAdvertencia(nuevasAdvertencias);

            const semestresConCursoRestaurado = currentSemestres.map((semestre) => {
              if (semestre.id === semestreId) {
                const cursoYaExiste = semestre.cursos.some(
                  (c) => c.codigo === cursoEliminado.codigo
                );
                if (!cursoYaExiste) {
                  const nuevosCursos = [...semestre.cursos];
                  nuevosCursos.splice(indiceOriginal, 0, cursoEliminado);
                  return {
                    ...semestre,
                    cursos: nuevosCursos,
                  };
                }
              }
              return semestre;
            });

            guardarEnSessionStorage(semestresConCursoRestaurado);
            setPendingRestore(null);
            setLastDeletedCourse(null);
            
            return semestresConCursoRestaurado;
          } else {
            setPendingRestore(null);
            setLastDeletedCourse(null);
            setCursosConAdvertencia(new Set<string>());
          }
          
          return currentSemestres;
        });
      }, 100);
    }
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (proyeccionActivaId && lastDeletedState) {
          setSemestresProyectados(lastDeletedState);
          guardarEnSessionStorage(lastDeletedState);
          setLastDeletedState(null);
          setLastDeletedCourse(null);
          setPendingRestore(null);
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

        <ProyeccionesSelector
          proyeccionesGuardadas={proyeccionesGuardadas}
          proyeccionActivaId={proyeccionActivaId}
          mostrarSelectorProyecciones={mostrarSelectorProyecciones}
          onToggleSelector={() =>
            setMostrarSelectorProyecciones(!mostrarSelectorProyecciones)
          }
          onSeleccionarProyeccion={seleccionarProyeccion}
          onEliminarProyeccion={eliminarProyeccion}
          onCreateNuevaProyeccion={crearNuevaProyeccion}
        />
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
                const isDragging = draggedCourse?.codigo === curso.codigo;

                return (
                  <div
                    key={curso.codigo}
                    className={`${styles.courseCard} ${styles.draggableCourse}`}
                    draggable={!isInProjected && !!proyeccionActivaId}
                    onDragStart={(e) => handleDragStart(e, curso)}
                    onDragEnd={handleDragEnd}
                    style={{
                      opacity: isInProjected || !proyeccionActivaId || isDragging ? 0.5 : 1,
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
            <SemesterColumn
              key={semestre.id}
              semestre={semestre}
              isLastSemester={isLastSemester(semestre.id)}
              proyeccionActivaId={proyeccionActivaId}
              dragOverSemester={dragOverSemester}
              cursosConAdvertencia={cursosConAdvertencia}
              onRemoveSemester={handleRemoveSemester}
              onRemoveCourse={handleRemoveCourseFromSemester}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          ))}

          <AddSemesterButton
            proyeccionActivaId={proyeccionActivaId}
            onAddSemester={handleAddSemester}
            tieneCapstoneProject={semestresProyectados.some((semestre) =>
              semestre.cursos.some(
                (curso) =>
                  curso.codigo === "ECIN-01000" ||
                  curso.asignatura?.toLowerCase().includes("capstone project")
              )
            )}
          />
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
