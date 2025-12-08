import { ProyectadoSemestre } from "./types/proyecciones.types";
import styles from "./MisProyecciones.module.css";
import { formatPeriodo } from "./utils/proyecciones.utils";

interface SemesterColumnProps {
  semestre: ProyectadoSemestre;
  isLastSemester: boolean;
  proyeccionActivaId: string | null;
  dragOverSemester: string | null;
  cursosConAdvertencia: Set<string>;
  onRemoveSemester: (id: string) => void;
  onRemoveCourse: (semestreId: string, cursoCodigo: string) => void;
  onDragOver: (e: React.DragEvent, semestreId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, semestreId: string) => void;
}

export default function SemesterColumn({
  semestre,
  isLastSemester,
  proyeccionActivaId,
  dragOverSemester,
  cursosConAdvertencia,
  onRemoveSemester,
  onRemoveCourse,
  onDragOver,
  onDragLeave,
  onDrop,
}: SemesterColumnProps) {
  return (
    <div key={semestre.id} className={styles.semesterColumn}>
      {isLastSemester && (
        <button
          className={styles.removeSemesterButton}
          onClick={() => onRemoveSemester(semestre.id)}
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
          proyeccionActivaId ? (e) => onDragOver(e, semestre.id) : undefined
        }
        onDragLeave={proyeccionActivaId ? onDragLeave : undefined}
        onDrop={proyeccionActivaId ? (e) => onDrop(e, semestre.id) : undefined}
      >
        {semestre.cursos.length === 0 ? (
          <div className={styles.emptySemester}>
            <p>Arrastre los cursos aquí</p>
          </div>
        ) : (
          semestre.cursos.map((curso) => {
            const advertenciaKey = `${semestre.id}-${curso.codigo}`;
            const tieneAdvertencia = cursosConAdvertencia.has(advertenciaKey);

            return (
              <div key={curso.codigo} className={styles.projectedCourseCard}>
                {tieneAdvertencia ? (
                  <div className={styles.warningIcon}>!</div>
                ) : (
                  <button
                    className={styles.removeCourseButton}
                    onClick={() => onRemoveCourse(semestre.id, curso.codigo)}
                    title="Eliminar curso"
                  >
                    ×
                  </button>
                )}
                <div className={styles.courseCode}>{curso.codigo}</div>
                <div className={styles.courseName}>{curso.asignatura}</div>
                <div className={styles.courseCredits}>
                  {curso.creditos} SCT
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

