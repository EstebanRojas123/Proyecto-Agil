"use client";
import { useAuth } from "@/hooks/useAuth";
import styles from "./CareerSelector.module.css";

interface CareerSelectorProps {
  selectedCareer: { codigo: string; nombre: string; catalogo: string } | null;
  onCareerChange: (career: { codigo: string; nombre: string; catalogo: string } | null) => void;
}

export default function CareerSelector({ selectedCareer, onCareerChange }: CareerSelectorProps) {
  const { user } = useAuth();

  const getCareerFullName = (careerCode: string) => {
    const careerNames: { [key: string]: string } = {
      'ITI': 'Ingeniería en Tecnologías de la Información',
      'ICI': 'Ingeniería Civil Industrial',
      'ICCI': 'Ingeniería Civil en Computación e Informática',
      '8266': 'Ingeniería en Tecnologías de la Información',
      '8616': 'Ingeniería Civil Industrial',
    };
    
    return careerNames[careerCode] || careerCode;
  };

  const handleCareerChange = (careerCode: string) => {
    const career = user?.carreras.find(c => c.codigo === careerCode);
    if (career) {
      onCareerChange(career);
    }
  };

  const displayText = selectedCareer 
    ? getCareerFullName(selectedCareer.nombre)
    : '';

  return (
    <div className={styles.carreraSelector}>
      <div className={styles.selectWrapper}>
        <div className={styles.carreraLabel}>Carrera</div>
        <div className={styles.selectContainer}>
          <select 
            className={styles.select}
            value={selectedCareer?.codigo || ''}
            onChange={(e) => handleCareerChange(e.target.value)}
          >
            {user?.carreras.map((carrera) => (
              <option key={carrera.codigo} value={carrera.codigo}>
                {getCareerFullName(carrera.nombre)} ({carrera.catalogo})
              </option>
            ))}
          </select>
          <div className={styles.selectDisplay}>
            {displayText || 'Seleccione una carrera'}
          </div>
        </div>
      </div>
    </div>
  );
}

