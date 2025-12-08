import styles from "./MisProyecciones.module.css";

interface AddSemesterButtonProps {
  proyeccionActivaId: string | null;
  onAddSemester: () => void;
}

export default function AddSemesterButton({
  proyeccionActivaId,
  onAddSemester,
}: AddSemesterButtonProps) {
  if (!proyeccionActivaId) return null;

  return (
    <div className={styles.addSemesterColumn}>
      <button
        className={styles.addSemesterButton}
        onClick={onAddSemester}
        title="Añadir semestre"
      >
        <div className={styles.addSemesterIcon}>+</div>
        <div className={styles.addSemesterText}>AÑADIR SEMESTRE</div>
      </button>
    </div>
  );
}

