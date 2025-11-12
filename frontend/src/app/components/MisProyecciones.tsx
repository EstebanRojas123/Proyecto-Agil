"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCareerSelection } from "@/hooks/useCareerSelection";
import CareerSelector from "./CareerSelector";
import { getMallaData, getAvanceData, MallaItem, Curso } from "@/services/AvanceService";
import styles from "./MisProyecciones.module.css";

export default function MisProyecciones() {
  const { user } = useAuth();
  const { selectedCareer, handleCareerChange } = useCareerSelection();
  const [mallaData, setMallaData] = useState<MallaItem[] | null>(null);
  const [avanceData, setAvanceData] = useState<Curso[] | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          getAvanceData(user.rut, selectedCareer.codigo, selectedCareer.catalogo)
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
    setSelectedLevel(null); // Reset selección al cambiar carrera
  }, [user, selectedCareer]);

  // Auto-seleccionar el primer nivel pendiente cuando se cargan los datos
  useEffect(() => {
    if (mallaData && avanceData && !selectedLevel) {
      const cursosAprobadosOInscritos = new Set(
        (avanceData || [])
          .filter(curso => curso.status === 'APROBADO' || curso.status === 'INSCRITO')
          .map(curso => curso.course)
      );

      const mallaByLevel = mallaData.reduce((acc, item) => {
        if (!acc[item.nivel]) {
          acc[item.nivel] = [];
        }
        acc[item.nivel].push(item);
        return acc;
      }, {} as { [key: number]: MallaItem[] });

      const levels = Object.keys(mallaByLevel).map(Number).sort((a, b) => a - b);
      
      for (const level of levels) {
        const cursosDelNivel = mallaByLevel[level];
        const tienePendientes = cursosDelNivel.some(
          curso => !cursosAprobadosOInscritos.has(curso.codigo)
        );
        
        if (tienePendientes) {
          setSelectedLevel(level);
          break;
        }
      }
    }
  }, [mallaData, avanceData, selectedLevel]);

  // Agrupar malla por nivel
  const mallaByLevel = mallaData ? mallaData.reduce((acc, item) => {
    if (!acc[item.nivel]) {
      acc[item.nivel] = [];
    }
    acc[item.nivel].push(item);
    return acc;
  }, {} as { [key: number]: MallaItem[] }) : {};

  // Obtener cursos aprobados e inscritos (se asume que los inscritos se aprobarán)
  const cursosAprobadosOInscritos = new Set(
    (avanceData || [])
      .filter(curso => curso.status === 'APROBADO' || curso.status === 'INSCRITO')
      .map(curso => curso.course)
  );

  // Determinar semestres pendientes (donde no todos los cursos están aprobados o inscritos)
  const getSemestresPendientes = (): number[] => {
    if (!mallaData) return [];

    const levels = Object.keys(mallaByLevel).map(Number).sort((a, b) => a - b);
    const semestresPendientes: number[] = [];

    for (const level of levels) {
      const cursosDelNivel = mallaByLevel[level];
      // Verificar si hay al menos un curso no aprobado ni inscrito en este nivel
      const tienePendientes = cursosDelNivel.some(
        curso => !cursosAprobadosOInscritos.has(curso.codigo)
      );
      
      if (tienePendientes) {
        semestresPendientes.push(level);
      }
    }

    return semestresPendientes;
  };

  const semestresPendientes = getSemestresPendientes();

  // Obtener cursos pendientes del nivel seleccionado (excluyendo aprobados e inscritos)
  const getCursosPendientes = (level: number): MallaItem[] => {
    if (!mallaByLevel[level]) return [];
    
    return mallaByLevel[level].filter(
      curso => !cursosAprobadosOInscritos.has(curso.codigo)
    );
  };

  const cursosPendientes = selectedLevel ? getCursosPendientes(selectedLevel) : [];

  // Convertir número a romano
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
      <h1 className={styles.title}>MIS PROYECCIONES</h1>
      
      <CareerSelector 
        selectedCareer={selectedCareer}
        onCareerChange={handleCareerChange}
      />

      {semestresPendientes.length > 0 && (
        <div className={styles.levelSelectorContainer}>
          <div className={styles.selectLevelButton}>Seleccionar Nivel</div>
          <div className={styles.levelButtonsContainer}>
            {semestresPendientes.map((level) => (
              <button
                key={level}
                className={`${styles.levelButton} ${selectedLevel === level ? styles.levelButtonSelected : ''}`}
                onClick={() => setSelectedLevel(level)}
              >
                {toRoman(level)}
              </button>
            ))}
          </div>
          
          {selectedLevel && cursosPendientes.length > 0 && (
            <div className={styles.coursesContainer}>
              {cursosPendientes.map((curso) => (
                <div key={curso.codigo} className={styles.courseCard}>
                  <div className={styles.courseCode}>{curso.codigo}</div>
                  <div className={styles.courseName}>{curso.asignatura}</div>
                  <div className={styles.courseCredits}>{curso.creditos} SCT</div>
                </div>
              ))}
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
    </div>
  );
}

