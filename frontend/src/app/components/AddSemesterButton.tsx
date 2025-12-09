"use client";

import styles from "./MisProyecciones.module.css";

interface AddSemesterButtonProps {
  proyeccionActivaId: string | null;
  onAddSemester: () => void;
  tieneCapstoneProject: boolean;
}

export default function AddSemesterButton({
  proyeccionActivaId,
  onAddSemester,
  tieneCapstoneProject,
}: AddSemesterButtonProps) {
  if (!proyeccionActivaId || tieneCapstoneProject) return null;

  return (
    <div className={styles.addSemesterColumn}>
      <button
        className={styles.addSemesterButton}
        onClick={onAddSemester}
        title="Añadir semestre"
      >
        <div className={styles.addSemesterIcon}>+</div>
        <div className={styles.addSemesterText}>AÑADIR $EMESTRE</div>
      </button>
    </div>
  );
}

