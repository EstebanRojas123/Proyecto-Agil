"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCareerSelection } from "@/context/CareerSelectionContext";
import CareerSelector from "./CareerSelector";
import { getMallaData, MallaItem } from "@/services/AvanceService";
import styles from "./MallaCurricular.module.css";

export default function MallaCurricular() {
  const { user } = useAuth();
  const { selectedCareer, handleCareerChange } = useCareerSelection();
  const [mallaData, setMallaData] = useState<MallaItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMallaData = async () => {
      if (!user || !selectedCareer) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getMallaData(selectedCareer.codigo, selectedCareer.catalogo);
        setMallaData(data);
      } catch (err) {
        setError("Error al cargar la malla curricular");
        console.error("Error fetching malla data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMallaData();
  }, [user, selectedCareer]);

  const mallaByLevel = mallaData ? mallaData.reduce((acc, item) => {
    if (!acc[item.nivel]) {
      acc[item.nivel] = [];
    }
    acc[item.nivel].push(item);
    return acc;
  }, {} as { [key: number]: MallaItem[] }) : {};

  const levels = Object.keys(mallaByLevel).map(Number).sort((a, b) => a - b);

  const toRoman = (num: number): string => {
    const romanNumerals: { [key: number]: string } = {
      1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
      6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X',
      11: 'XI', 12: 'XII', 13: 'XIII', 14: 'XIV', 15: 'XV'
    };
    return romanNumerals[num] || num.toString();
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
          MALLA CURRICULAR
        </h1>
        <p style={{ color: '#6b7280' }}>Cargando malla curricular...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
          MALLA CURRICULAR
        </h1>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        MALLA CURRICULAR
      </h1>
      
      <CareerSelector 
        selectedCareer={selectedCareer}
        onCareerChange={handleCareerChange}
      />

      {levels.length > 0 ? (
        <div className={styles.levelsContainer}>
          {levels.map((level) => (
            <div key={level} className={styles.levelColumn}>
              <div className={styles.levelHeader}>
                {toRoman(level)}
              </div>
              
              <div className={styles.coursesContainer}>
                {mallaByLevel[level].map((item) => (
                  <div key={item.codigo} className={styles.courseCard}>
                    <div className={styles.courseInfo}>
                      <div className={styles.courseCode}>
                        {item.codigo}
                      </div>
                      <div className={styles.courseName}>
                        {item.asignatura}
                      </div>
                      <div className={styles.courseCredits}>
                        {item.creditos} SCT
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noData}>
          <p className={styles.noDataText}>No se encontraron datos de malla curricular</p>
        </div>
      )}
    </div>
  );
}

