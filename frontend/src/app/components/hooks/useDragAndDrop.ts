import { useState } from "react";
import { MallaItem } from "@/services/AvanceService";
import { ProyectadoSemestre } from "../types/proyecciones.types";

interface UseDragAndDropProps {
  semestresProyectados: ProyectadoSemestre[];
  setSemestresProyectados: React.Dispatch<
    React.SetStateAction<ProyectadoSemestre[]>
  >;
  proyeccionActivaId: string | null;
  canEnrollInSemester: (
    curso: MallaItem,
    periodo: string,
    cursosDelSemestre: MallaItem[]
  ) => { valid: boolean; reason?: string };
  cursosConAdvertencia: Set<string>;
  setCursosConAdvertencia: React.Dispatch<React.SetStateAction<Set<string>>>;
  setLastDeletedState: React.Dispatch<
    React.SetStateAction<ProyectadoSemestre[] | null>
  >;
  guardarEnSessionStorage: (semestres: ProyectadoSemestre[]) => void;
  showNotification: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export const useDragAndDrop = ({
  semestresProyectados,
  setSemestresProyectados,
  proyeccionActivaId,
  canEnrollInSemester,
  cursosConAdvertencia,
  setCursosConAdvertencia,
  setLastDeletedState,
  guardarEnSessionStorage,
  showNotification,
}: UseDragAndDropProps) => {
  const [draggedCourse, setDraggedCourse] = useState<MallaItem | null>(null);
  const [dragOverSemester, setDragOverSemester] = useState<string | null>(
    null
  );

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

    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    dragImage.style.opacity = "0.8";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", curso.codigo);

    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "1";
    setDraggedCourse(null);
    setDragOverSemester(null);
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

  return {
    draggedCourse,
    dragOverSemester,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};

