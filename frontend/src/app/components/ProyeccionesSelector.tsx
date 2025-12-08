import { ProyeccionGuardada } from "./types/proyecciones.types";
import styles from "./MisProyecciones.module.css";

interface ProyeccionesSelectorProps {
  proyeccionesGuardadas: ProyeccionGuardada[];
  proyeccionActivaId: string | null;
  mostrarSelectorProyecciones: boolean;
  onToggleSelector: () => void;
  onSeleccionarProyeccion: (id: string) => void;
  onEliminarProyeccion: (id: string) => void;
  onCreateNuevaProyeccion: () => void;
}

export default function ProyeccionesSelector({
  proyeccionesGuardadas,
  proyeccionActivaId,
  mostrarSelectorProyecciones,
  onToggleSelector,
  onSeleccionarProyeccion,
  onEliminarProyeccion,
  onCreateNuevaProyeccion,
}: ProyeccionesSelectorProps) {
  const getNombreProyeccion = (): string => {
    if (!proyeccionActivaId) return "Seleccionar proyección";
    const proyeccion = proyeccionesGuardadas.find(
      (p) => p.id === proyeccionActivaId
    );
    if (!proyeccion) return "Sin nombre";
    let nombre = proyeccion.nombre || "Sin nombre";
    if (nombre === proyeccion.id || !nombre.startsWith("Proyección ")) {
      const index = proyeccionesGuardadas.findIndex(
        (p) => p.id === proyeccionActivaId
      );
      nombre = `Proyección ${index >= 0 ? index + 1 : 1}`;
    }
    return nombre;
  };

  return (
    <div className={styles.proyeccionesSelectorContainer}>
      <button
        className={`${styles.proyeccionesSelectorButton} ${
          mostrarSelectorProyecciones ? styles.open : ""
        }`}
        onClick={onToggleSelector}
      >
        <span className={styles.proyeccionButtonText}>
          {getNombreProyeccion()}
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
                onClick={() => onSeleccionarProyeccion(proyeccion.id)}
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
                    onEliminarProyeccion(proyeccion.id);
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
              onClick={onCreateNuevaProyeccion}
            >
              + Nueva Proyección
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

