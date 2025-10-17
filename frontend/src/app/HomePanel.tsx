"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import HistorialCurricular from "./components/HistorialCurricular";
import { getMallaData, findMostRecentCareer, MallaItem } from "@/services/AvanceService";
import styles from "./components/HomePanel.module.css";

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

  const getCareerFullName = (careerCode: string) => {
    const careerMap: { [key: string]: string } = {
      'DCCB': 'Ingeniería Civil en Computación e Informática',
      'ECIN': 'Ingeniería Civil Industrial',
      'DCCP': 'Ingeniería Civil en Computación',
      'DCCE': 'Ingeniería Civil en Computación e Informática (Diurno)',
      'DCCN': 'Ingeniería Civil en Computación e Informática (Vespertino)',
    };
    return careerMap[careerCode] || careerCode;
  };

  const handleCareerChange = (careerCode: string) => {
    const career = user?.carreras.find(c => c.codigo === careerCode);
    if (career) {
      setSelectedCareer(career);
    }
  };

  // Agrupar por nivel
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
    <div style={{ 
      flex: 1, 
      backgroundColor: '#f3f4f6', 
      padding: '2rem', 
      overflowY: 'auto',
      overflowX: 'hidden',
      width: '100%',
      maxWidth: 'calc(100vw - 16rem)',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h1 style={{ 
        fontSize: '1.7rem', 
        fontWeight: 'bold', 
        color: '#1f2937', 
        marginBottom: '1rem',
        textAlign: 'left'
      }}>
        MALLA CURRICULAR
      </h1>
      
      <div style={{ marginBottom: '0.7rem', display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            position: 'absolute',
            top: '0.3rem',
            left: '1rem',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'rgb(255, 255, 255)',
            zIndex: 1,
            pointerEvents: 'none'
          }}>
            Carrera
          </div>
          <select 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'transparent',
              color: 'transparent',
              border: 'none',
              cursor: 'pointer',
              appearance: 'none',
              zIndex: 2
            }}
            value={selectedCareer?.codigo || ''}
            onChange={(e) => handleCareerChange(e.target.value)}
          >
            {user?.carreras.map((carrera) => (
              <option key={carrera.codigo} value={carrera.codigo}>
                {getCareerFullName(carrera.nombre)} ({carrera.catalogo})
              </option>
            ))}
          </select>
          <div style={{
            backgroundColor: '#457AC6',
            color: 'white',
            padding: '1.8rem 3rem 0.5rem 1rem',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '0.9rem',
            minWidth: '450px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            backgroundSize: '1.2rem',
            pointerEvents: 'none'
          }}>
            {selectedCareer ? getCareerFullName(selectedCareer.nombre) : 'Seleccionar carrera'}
          </div>
        </div>
      </div>

      {levels.length > 0 ? (
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '0.5rem 0 1.5rem 0',
          width: '100%',
          scrollBehavior: 'smooth',
          flex: 1,
          minHeight: 0
        }}>
          {levels.map((level) => (
            <div key={level} style={{
              minWidth: '150px',
              maxWidth: '160px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              height: 'fit-content'
            }}>
              <div style={{
                backgroundColor: '#457AC6',
                color: 'white',
                padding: '0.5rem 0.75rem',
                borderRadius: '1.75rem',
                textAlign: 'center',
                fontWeight: 'bold',
                marginBottom: '0.75rem',
                fontSize: '0.9rem'
              }}>
                Semestre {level}
              </div>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.3rem' 
              }}>
                {mallaByLevel[level].map((item) => (
                  <div key={item.codigo} style={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    width: '100%',
                    boxSizing: 'border-box',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.65rem',
                        color: '#9ca3af',
                        fontWeight: 500,
                        marginBottom: '0.25rem',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px'
                      }}>
                        {item.codigo}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        marginBottom: '0.25rem',
                        lineHeight: '1.2',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {item.asignatura}
                      </div>
                      <div style={{
                        fontSize: '0.65rem',
                        color: '#6b7280',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        fontWeight: 500
                      }}>
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
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#6b7280' }}>No se encontraron datos de malla curricular</p>
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

