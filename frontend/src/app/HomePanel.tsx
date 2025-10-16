"use client";
import { useAuth } from "@/hooks/useAuth";
import styles from "./components/HomePanel.module.css";
import HistorialCurricular from "./components/HistorialCurricular";

export default function HomePanel() {
  const { user, logout } = useAuth();

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
                <a href="#" className={styles.navLink}>
                  Malla Curricular
                </a>
                <a href="#" className={styles.navLink}>
                  Historial Curricular
                </a>
                <a href="#" className={styles.navLink}>
                  Mis Proyecciones
                </a>
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
        <HistorialCurricular />
      </main>
    </div>
  );
}

