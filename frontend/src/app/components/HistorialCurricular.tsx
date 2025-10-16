"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAvanceData, findMostRecentCareer, AvanceResponse, Curso } from "@/services/AvanceService";
import styles from "./HistorialCurricular.module.css";

export default function HistorialCurricular() {
  const { user } = useAuth();
  const [avanceData, setAvanceData] = useState<AvanceResponse | null>(null);
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
    const fetchAvanceData = async () => {
      if (!user || !selectedCareer) return;

      try {
        setLoading(true);
        setError(null);

        // Obtener datos de avance para la carrera seleccionada
        const data = await getAvanceData(user.rut, selectedCareer.codigo);
        setAvanceData(data);
      } catch (err) {
        setError("Error al cargar el historial curricular");
        console.error("Error fetching avance data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvanceData();
  }, [user, selectedCareer]);

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
      setSelectedCareer(career);
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'APROBADO':
        return '✅';
      case 'REPROBADO':
        return '❌';
      case 'INSCRITO':
        return '🕐';
      default:
        return '❓';
    }
  };

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'APROBADO':
        return styles.aprobado;
      case 'REPROBADO':
        return styles.reprobado;
      case 'INSCRITO':
        return styles.enProgreso;
      default:
        return styles.desconocido;
    }
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

  const cursosGrouped = groupCursosBySemester(avanceData || []);
  
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
      <h1 className={styles.title}>HISTORIAL CURRICULAR</h1>
      
      <div className={styles.carreraSelector}>
        <div className={styles.selectWrapper}>
          <div className={styles.carreraLabel}>Carrera</div>
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
          <div className={styles.selectedCareerName}>
            {selectedCareer ? getCareerFullName(selectedCareer.nombre) : 'Seleccionar carrera'}
          </div>
        </div>
      </div>

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
                      <div className={styles.cursoNombre}>{curso.course}</div>
                      <div className={styles.cursoCreditos}>NRC: {curso.nrc}</div>
                    </div>
                    <div className={`${styles.cursoEstado} ${getEstadoClass(curso.status)}`}>
                      {getEstadoIcon(curso.status)}
                    </div>
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
