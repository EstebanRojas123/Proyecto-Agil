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
  
  // Estado para semestres proyectados
  interface ProyectadoSemestre {
    id: string;
    periodo: string; // Formato: "YYYY-T" (ej: "2026-1")
    cursos: MallaItem[];
  }
  
  const [semestresProyectados, setSemestresProyectados] = useState<ProyectadoSemestre[]>([]);
  
  // Funciones para drag and drop
  const [draggedCourse, setDraggedCourse] = useState<MallaItem | null>(null);
  const [dragOverSemester, setDragOverSemester] = useState<string | null>(null);

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

  // Función para generar el siguiente semestre
  const getNextSemester = (): string => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    // Si estamos en la primera mitad del año (enero-junio), el próximo es el segundo semestre del año actual
    // Si estamos en la segunda mitad (julio-diciembre), el próximo es el primer semestre del año siguiente
    if (currentMonth < 6) {
      // Estamos en primer semestre, el próximo es el segundo del mismo año
      return `${currentYear}-2`;
    } else {
      // Estamos en segundo semestre, el próximo es el primero del año siguiente
      return `${currentYear + 1}-1`;
    }
  };

  // Función para formatear el período para mostrar
  const formatPeriodo = (periodo: string): string => {
    const [year, term] = periodo.split('-');
    const termRoman = term === '1' ? 'I' : 'II';
    return `${year}-${termRoman}`;
  };

  // Función para agregar un nuevo semestre
  const handleAddSemester = () => {
    const newPeriodo = getNextSemester();
    
    // Si ya hay semestres, calcular el siguiente basado en el último
    if (semestresProyectados.length > 0) {
      const lastSemester = semestresProyectados[semestresProyectados.length - 1];
      const [lastYear, lastTerm] = lastSemester.periodo.split('-');
      
      let nextYear = parseInt(lastYear);
      let nextTerm = lastTerm === '1' ? '2' : '1';
      
      if (lastTerm === '2') {
        nextYear += 1;
      }
      
      const newId = `${nextYear}-${nextTerm}`;
      setSemestresProyectados([...semestresProyectados, {
        id: newId,
        periodo: newId,
        cursos: []
      }]);
    } else {
      // Primer semestre
      setSemestresProyectados([{
        id: newPeriodo,
        periodo: newPeriodo,
        cursos: []
      }]);
    }
  };

  // Función para eliminar un semestre
  const handleRemoveSemester = (id: string) => {
    setSemestresProyectados(semestresProyectados.filter(s => s.id !== id));
  };

  // Funciones para drag and drop
  const handleDragStart = (e: React.DragEvent, curso: MallaItem) => {
    setDraggedCourse(curso);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", curso.codigo);
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

    setSemestresProyectados(semestresProyectados.map(semestre => {
      if (semestre.id === semestreId) {
        // Verificar si el curso ya existe en este semestre
        const cursoExiste = semestre.cursos.some(c => c.codigo === draggedCourse.codigo);
        if (!cursoExiste) {
          return {
            ...semestre,
            cursos: [...semestre.cursos, draggedCourse]
          };
        }
      }
      return semestre;
    }));

    setDraggedCourse(null);
    setDragOverSemester(null);
  };

  const handleRemoveCourseFromSemester = (semestreId: string, cursoCodigo: string) => {
    setSemestresProyectados(semestresProyectados.map(semestre => {
      if (semestre.id === semestreId) {
        return {
          ...semestre,
          cursos: semestre.cursos.filter(c => c.codigo !== cursoCodigo)
        };
      }
      return semestre;
    }));
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
              {cursosPendientes.map((curso) => {
                // Verificar si el curso ya está en algún semestre proyectado
                const isInProjected = semestresProyectados.some(semestre =>
                  semestre.cursos.some(c => c.codigo === curso.codigo)
                );
                
                return (
                  <div
                    key={curso.codigo}
                    className={`${styles.courseCard} ${styles.draggableCourse}`}
                    draggable={!isInProjected}
                    onDragStart={(e) => handleDragStart(e, curso)}
                    style={{
                      opacity: isInProjected ? 0.5 : 1,
                      cursor: isInProjected ? 'not-allowed' : 'grab'
                    }}
                  >
                    <div className={styles.courseCode}>{curso.codigo}</div>
                    <div className={styles.courseName}>{curso.asignatura}</div>
                    <div className={styles.courseCredits}>{curso.creditos} SCT</div>
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

      {/* Sección de semestres proyectados */}
      <div className={styles.projectedSemestersSection}>
        <div className={styles.semestersContainer}>
          {semestresProyectados.map((semestre) => (
            <div key={semestre.id} className={styles.semesterColumn}>
              <button
                className={styles.removeSemesterButton}
                onClick={() => handleRemoveSemester(semestre.id)}
                title="Eliminar semestre"
              >
                ×
              </button>
              <div className={styles.semesterHeader}>
                {formatPeriodo(semestre.periodo)}
              </div>
              <div
                className={`${styles.semesterCoursesContainer} ${dragOverSemester === semestre.id ? styles.dragOver : ''}`}
                onDragOver={(e) => handleDragOver(e, semestre.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, semestre.id)}
              >
                {semestre.cursos.length === 0 ? (
                  <div className={styles.emptySemester}>
                    <p>Arrastra cursos aquí</p>
                  </div>
                ) : (
                  semestre.cursos.map((curso) => (
                    <div key={curso.codigo} className={styles.projectedCourseCard}>
                      <button
                        className={styles.removeCourseButton}
                        onClick={() => handleRemoveCourseFromSemester(semestre.id, curso.codigo)}
                        title="Eliminar curso"
                      >
                        ×
                      </button>
                      <div className={styles.courseCode}>{curso.codigo}</div>
                      <div className={styles.courseName}>{curso.asignatura}</div>
                      <div className={styles.courseCredits}>{curso.creditos} SCT</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
          
          {/* Botón para agregar semestre */}
          <div className={styles.addSemesterColumn}>
            <button
              className={styles.addSemesterButton}
              onClick={handleAddSemester}
              title="Añadir semestre"
            >
              <div className={styles.addSemesterIcon}>+</div>
              <div className={styles.addSemesterText}>AÑADIR SEMESTRE</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

