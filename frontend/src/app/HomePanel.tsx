"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import HistorialCurricular from "./components/HistorialCurricular";
import CareerSelector from "./components/CareerSelector";
import { getMallaData, findMostRecentCareer, MallaItem } from "@/services/AvanceService";
import styles from "./components/HomePanel.module.css";
import mallaStyles from "./components/MallaCurricular.module.css";

// Componente MallaCurricular
function MallaCurricular() {
  const { user } = useAuth();
  const [mallaData, setMallaData] = useState<MallaItem[] | null>(null);
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
    const fetchMallaData = async () => {
      if (!user || !selectedCareer) return;

      try {
        setLoading(true);
        setError(null);

        // Obtener datos de malla para la carrera seleccionada
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

  const handleCareerChange = (career: { codigo: string; nombre: string; catalogo: string } | null) => {
    setSelectedCareer(career);
  };

  // Agrupación por niveles (semestres)
  const mallaByLevel = mallaData ? mallaData.reduce((acc, item) => {
    if (!acc[item.nivel]) {
      acc[item.nivel] = [];
    }
    acc[item.nivel].push(item);
    return acc;
  }, {} as { [key: number]: MallaItem[] }) : {};

  const levels = Object.keys(mallaByLevel).map(Number).sort((a, b) => a - b);

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
    <div className={mallaStyles.container}>
      <h1 className={mallaStyles.title}>
        MALLA CURRICULAR
      </h1>
      
      <CareerSelector 
        selectedCareer={selectedCareer}
        onCareerChange={handleCareerChange}
      />

      {levels.length > 0 ? (
        <div className={mallaStyles.levelsContainer}>
          {levels.map((level) => (
            <div key={level} className={mallaStyles.levelColumn}>
              <div className={mallaStyles.levelHeader}>
                Semestre {level}
              </div>
              
              <div className={mallaStyles.coursesContainer}>
                {mallaByLevel[level].map((item) => (
                  <div key={item.codigo} className={mallaStyles.courseCard}>
                    <div className={mallaStyles.courseInfo}>
                      <div className={mallaStyles.courseCode}>
                        {item.codigo}
                      </div>
                      <div className={mallaStyles.courseName}>
                        {item.asignatura}
                      </div>
                      <div className={mallaStyles.courseCredits}>
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
        <div className={mallaStyles.noData}>
          <p className={mallaStyles.noDataText}>No se encontraron datos de malla curricular</p>
        </div>
      )}
    </div>
  );
}

function MisProyecciones() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
        MIS PROYECCIONES
      </h1>
      <p style={{ color: '#6b7280' }}>Funcionalidad en desarrollo...</p>
    </div>
  );
}

type MenuSection = 'malla' | 'historial' | 'proyecciones';

export default function HomePanel() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<MenuSection>('malla');

  const formatRut = (rut: string) => {
    // Remover cualquier guión existente y espacios
    const cleanRut = rut.replace(/[-\s]/g, '');
    
    // Separar el número del dígito verificador
    const rutNumber = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);
    
    // Formatear con puntos y guión
    const formattedNumber = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${formattedNumber}-${dv}`;
  };

  if (!user) {
    return (
      <div className={styles.notLoggedIn}>
        <h2 className={styles.notLoggedInTitle}>
          No estás logueado
        </h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Aside lateral izquierdo */}
      <aside className={styles.aside}>
        <div className={styles.asideTop}>
          <div className={styles.logoContainer}>
            <img
                src="/logo_ucn.png"
              alt="Logo del sistema"
              className={styles.logo}
            />
          </div>

          <div className={styles.welcomeMessage}>
            ¡Bienvenido, {formatRut(user.rut)}!
          </div>

          <div className={styles.menuSection}>
            <div className={styles.menuContent}>
              <h2 className={styles.menuTitle}>Menú Estudiante</h2>
              <nav className={styles.nav}>
                <button 
                  onClick={() => setActiveSection('malla')}
                  className={`${styles.navLink} ${activeSection === 'malla' ? styles.navLinkActive : ''}`}
                >
                  Malla Curricular
                </button>
                <button 
                  onClick={() => setActiveSection('historial')}
                  className={`${styles.navLink} ${activeSection === 'historial' ? styles.navLinkActive : ''}`}
                >
                  Historial Curricular
                </button>
                <button 
                  onClick={() => setActiveSection('proyecciones')}
                  className={`${styles.navLink} ${activeSection === 'proyecciones' ? styles.navLinkActive : ''}`}
                >
                  Mis Proyecciones
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className={styles.asideBottom}>
          <button
            onClick={logout}
            className={styles.logoutButton}
          >
            Salir →[ ]
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className={styles.main}>
        {activeSection === 'malla' && <MallaCurricular />}
        {activeSection === 'historial' && <HistorialCurricular />}
        {activeSection === 'proyecciones' && <MisProyecciones />}
      </main>
    </div>
  );
}

