"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import HistorialCurricular from "./components/HistorialCurricular";
import MallaCurricular from "./components/MallaCurricular";
import styles from "./components/HomePanel.module.css";

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

  const extractNameFromEmail = (email: string | undefined): string => {
    if (!email) return 'Usuario';
    
    // Obtener la parte antes del @
    const beforeAt = email.split('@')[0];
    
    // Si hay un punto, separar en nombre y apellido
    if (beforeAt.includes('.')) {
      const parts = beforeAt.split('.');
      const nombre = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      const apellido = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase() : '';
      return apellido ? `${nombre} ${apellido}` : nombre;
    }
    
    // Si no hay punto, capitalizar la primera letra
    return beforeAt.charAt(0).toUpperCase() + beforeAt.slice(1).toLowerCase();
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
            ¡Bienvenido, {extractNameFromEmail(user.email)}!
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
                  Trayectoria Curricular
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

