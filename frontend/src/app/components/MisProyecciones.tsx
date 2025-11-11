"use client";
import { useCareerSelection } from "@/hooks/useCareerSelection";
import CareerSelector from "./CareerSelector";
import styles from "./MisProyecciones.module.css";

export default function MisProyecciones() {
  const { selectedCareer, handleCareerChange } = useCareerSelection();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        MIS PROYECCIONES
      </h1>
      
      <CareerSelector 
        selectedCareer={selectedCareer}
        onCareerChange={handleCareerChange}
      />

      <div className={styles.content}>
        <p className={styles.developmentMessage}>Funcionalidad en desarrollo...</p>
      </div>
    </div>
  );
}

