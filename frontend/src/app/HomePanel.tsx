"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import HistorialCurricular from "./components/HistorialCurricular";
import MallaCurricular from "./components/MallaCurricular";
import MisProyecciones from "./components/MisProyecciones";
import Notification from "./components/Notification";
import styles from "./components/HomePanel.module.css";
import { NotificationState } from "@/types/notification.types";

type MenuSection = 'malla' | 'historial' | 'proyecciones';

const STORAGE_KEY_ACTIVE_SECTION = "activeSection";

export default function HomePanel() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<MenuSection>('malla');
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);
  const [mostrarConfirmacionLogout, setMostrarConfirmacionLogout] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_SECTION);
      if (stored && (stored === 'malla' || stored === 'historial' || stored === 'proyecciones')) {
        setActiveSection(stored as MenuSection);
      }
    }
  }, []);

  useEffect(() => {
    const handleCambiosSinGuardar = (event: CustomEvent) => {
      setHayCambiosSinGuardar(event.detail.hayCambios);
    };

    window.addEventListener('proyecciones-cambios-sin-guardar', handleCambiosSinGuardar as EventListener);
    
    return () => {
      window.removeEventListener('proyecciones-cambios-sin-guardar', handleCambiosSinGuardar as EventListener);
    };
  }, []);

  const handleSectionChange = (section: MenuSection) => {
    setActiveSection(section);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ACTIVE_SECTION, section);
    }
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const handleLogout = () => {
    if (hayCambiosSinGuardar && activeSection === 'proyecciones') {
      setMostrarConfirmacionLogout(true);
    } else {
      logout();
    }
  };

  const confirmarLogoutGuardar = () => {
    window.dispatchEvent(new CustomEvent('proyecciones-guardar-y-cerrar'));
    setMostrarConfirmacionLogout(false);
    setTimeout(() => {
      logout();
    }, 300);
  };

  const confirmarLogoutDescartar = () => {
    window.dispatchEvent(new CustomEvent('proyecciones-descartar-y-cerrar'));
    setMostrarConfirmacionLogout(false);
    logout();
  };

  const cancelarLogout = () => {
    setMostrarConfirmacionLogout(false);
  };

  const extractNameFromEmail = (email: string | undefined): string => {
    if (!email) return 'Usuario';
        const beforeAt = email.split('@')[0];
    
    if (beforeAt.includes('.')) {
      const parts = beforeAt.split('.');
      const nombre = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      const apellido = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase() : '';
      return apellido ? `${nombre} ${apellido}` : nombre;
    }
    
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
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
          duration={notification.type === "error" ? 7000 : 5000}
        />
      )}
      <div className={styles.container}>
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
                  onClick={() => handleSectionChange('malla')}
                  className={`${styles.navLink} ${activeSection === 'malla' ? styles.navLinkActive : ''}`}
                >
                  Malla Curricular
                </button>
                
                <button 
                  onClick={() => handleSectionChange('historial')}
                  className={`${styles.navLink} ${activeSection === 'historial' ? styles.navLinkActive : ''}`}
                >
                  Trayectoria Curricular
                </button>

                <button 
                  onClick={() => handleSectionChange('proyecciones')}
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
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            Salir →[ ]
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {activeSection === 'malla' && <MallaCurricular />}
        {activeSection === 'historial' && <HistorialCurricular />}
        {activeSection === 'proyecciones' && <MisProyecciones />}
      </main>

      {mostrarConfirmacionLogout && (
        <div className={styles.confirmDialogOverlay}>
          <div className={styles.confirmDialog}>
            <div className={styles.confirmDialogHeader}>
              <svg className={styles.confirmDialogIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4"></path>
                <path d="M12 17h.01"></path>
                <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
              </svg>
              <h3 className={styles.confirmDialogTitle}>¿Guardar cambios?</h3>
            </div>
            <div className={styles.confirmDialogContent}>
              <button
                className={styles.cancelButton}
                onClick={cancelarLogout}
                title="Cancelar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <p className={styles.confirmDialogMessage}>
                Tienes cambios sin guardar en tu proyecciones.
              </p>
            </div>
            <div className={styles.confirmDialogButtons}>
              <button
                className={styles.confirmButton}
                onClick={confirmarLogoutGuardar}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Guardar y salir
              </button>
              <button
                className={styles.discardButton}
                onClick={confirmarLogoutDescartar}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
                Descartar y salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

