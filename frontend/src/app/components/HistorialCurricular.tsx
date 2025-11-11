"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAvanceData, getAutomaticProjection, findMostRecentCareer, AvanceResponse, Curso, ProyeccionSemestre } from "@/services/AvanceService";
import CareerSelector from "./CareerSelector";
import styles from "./HistorialCurricular.module.css";

export default function HistorialCurricular() {
  const { user } = useAuth();
  const [avanceData, setAvanceData] = useState<AvanceResponse | null>(null);
  const [proyeccionData, setProyeccionData] = useState<ProyeccionSemestre[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<{ codigo: string; nombre: string; catalogo: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    // Inicializar con la carrera más reciente
    const mostRecentCareer = findMostRecentCareer(user.carreras);
    if (mostRecentCareer) {
      setSelectedCareer(mostRecentCareer);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !selectedCareer) return;

      try {
        setLoading(true);
        setError(null);

        // Obtener tanto el historial como la proyección automática
        const [avance, proyeccion] = await Promise.all([
          getAvanceData(user.rut, selectedCareer.codigo, selectedCareer.catalogo),
          getAutomaticProjection(user.rut, selectedCareer.codigo, selectedCareer.catalogo)
        ]);
        
        setAvanceData(avance);
        setProyeccionData(proyeccion.semestres);
      } catch (err) {
        setError("Error al cargar el historial curricular");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedCareer]);

  const handleCareerChange = (career: { codigo: string; nombre: string; catalogo: string } | null) => {
    setSelectedCareer(career);
  };

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'APROBADO':
        return styles.aprobado;
      case 'REPROBADO':
        return styles.reprobado;
      case 'INSCRITO':
        return styles.enProgreso;
      case 'PROYECTADO':
        return styles.proyectado;
      default:
        return styles.desconocido;
    }
  };

  // Convertir periodo de formato "YYYY-1" a "YYYY-I"
  const formatPeriodo = (periodo: string): string => {
    const [year, term] = periodo.split('-');
    const termMap: { [key: string]: string } = {
      '1': 'I',
      '2': 'II',
      '15': 'W',
      '25': 'V'
    };
    return `${year}-${termMap[term] || term}`;
  };

  const groupCursosBySemester = (cursos: Curso[]) => {
    const grouped: { [key: string]: Curso[] } = {};
    
    if (!cursos || !Array.isArray(cursos)) {
      return grouped;
    }
    
    cursos.forEach(curso => {
      // Convertir period (202410) a formato semestre (2024-I)
      const year = curso.period.substring(0, 4);
      const semester = curso.period.substring(4, 6);
      let semesterFormatted;
      
      switch (semester) {
        case '10':
          semesterFormatted = 'I';
          break;
        case '20':
          semesterFormatted = 'II';
          break;
        case '15':
          semesterFormatted = 'W';
          break;
        case '25':
          semesterFormatted = 'V';
          break;
        default:
          semesterFormatted = semester;
      }
      
      const semesterKey = `${year}-${semesterFormatted}`;
      
      if (!grouped[semesterKey]) {
        grouped[semesterKey] = [];
      }
      grouped[semesterKey].push(curso);
    });

    return grouped;
  };

  // Combinar historial y proyección
  const combineHistorialAndProjection = () => {
    const historialGrouped = groupCursosBySemester(avanceData || []);
    const combined: { [key: string]: (Curso | { course: string; nombre: string; status: string; period: string; nrc: string })[] } = { ...historialGrouped };

    // Agregar semestres proyectados
    if (proyeccionData) {
      proyeccionData.forEach(semestre => {
        const periodoKey = formatPeriodo(semestre.periodo);
        if (!combined[periodoKey]) {
          combined[periodoKey] = [];
        }
        
        // Convertir ramos proyectados al formato Curso
        semestre.ramos.forEach(ramo => {
          // Convertir "2024-1" a "202410", "2024-2" a "202420", etc.
          const [year, term] = semestre.periodo.split('-');
          const termCode = term === '1' ? '10' : term === '2' ? '20' : term === '15' ? '15' : term === '25' ? '25' : term;
          const periodCode = `${year}${termCode}`;
          
          combined[periodoKey].push({
            course: ramo.codigo,
            nombre: ramo.nombre,
            status: ramo.estado as 'APROBADO' | 'REPROBADO' | 'INSCRITO' | 'PROYECTADO',
            period: periodCode,
            nrc: '' // Los cursos proyectados no tienen NRC
          });
        });
      });
    }

    return combined;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h1>HISTORIAL CURRICULAR</h1>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1>HISTORIAL CURRICULAR</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!avanceData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1>HISTORIAL CURRICULAR</h1>
          <p>No se encontraron datos</p>
        </div>
      </div>
    );
  }

  const cursosGrouped = combineHistorialAndProjection();
  
  // Función para ordenar semestres cronológicamente
  const sortSemesters = (semesters: string[]) => {
    return semesters.sort((a, b) => {
      const [yearA, semesterA] = a.split('-');
      const [yearB, semesterB] = b.split('-');
      
      // Primero comparar años
      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB);
      }
      
      // Si es el mismo año, ordenar por semestre
      const semesterOrder = { 'I': 1, 'W': 2, 'II': 3, 'V': 4 };
      const orderA = semesterOrder[semesterA as keyof typeof semesterOrder] || 5;
      const orderB = semesterOrder[semesterB as keyof typeof semesterOrder] || 5;
      
      return orderA - orderB;
    });
  };
  
  const semestres = sortSemesters(Object.keys(cursosGrouped));

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>TRAYECTORIA CURRICULAR</h1>
      
      <CareerSelector 
        selectedCareer={selectedCareer}
        onCareerChange={handleCareerChange}
      />

      {semestres.length > 0 ? (
        <div className={styles.semestresContainer}>
          {semestres.map(semestre => (
            <div key={semestre} className={styles.semestreColumn}>
              <div className={styles.semestreHeader}>
                {semestre}
              </div>
              
              <div className={styles.cursosContainer}>
                {cursosGrouped[semestre].map((curso, index) => (
                  <div key={index} className={styles.cursoCard}>
                        <div className={styles.cursoInfo}>
                          <div className={styles.cursoCodigo}>{curso.course}</div>
                          <div className={styles.cursoNombre}>{curso.nombre}</div>
                          <div className={styles.cursoCreditos}>
                            {curso.nrc ? `NRC: ${curso.nrc}` : 'Proyectado'}
                          </div>
                        </div>
                    <div className={`${styles.cursoEstado} ${getEstadoClass(curso.status)}`}> </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noData}>
          <p>No se encontraron cursos para mostrar</p>
        </div>
      )}
    </div>
  );
}
