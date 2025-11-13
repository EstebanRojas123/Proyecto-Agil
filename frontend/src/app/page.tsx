"use client";
import { useAuth } from "@/hooks/useAuth";
import styles from "./components/LoginForm.module.css";
import { useState, useEffect, useRef } from "react";
import HomePanel from "./HomePanel";
import Notification from "./components/Notification";

interface NotificationState {
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

export default function Home() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [shouldShowHomePanel, setShouldShowHomePanel] = useState(false);
  const prevUserRef = useRef(user);

  const showNotification = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    setNotification({ message, type });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  // Detectar cuando el usuario se desloguea para mostrar mensaje y resetear estado
  useEffect(() => {
    // Si había un usuario antes y ahora no hay, significa que se deslogueó
    if (prevUserRef.current && !user) {
      setIsLoading(false); // Resetear el estado de carga
      setNotification({
        message: "Salió exitosamente. ¡Hasta pronto!",
        type: "info",
        duration: 2500,
      });
    }
    prevUserRef.current = user;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    hideNotification();

    try {
      await login(email, password);
      // Mostrar mensaje de éxito
      showNotification(
        "¡Inicio de sesión exitoso! Bienvenido/a.",
        "success"
      );
      // Limpiar campos después de un login exitoso
      setEmail("");
      setPassword("");
      // Esperar 2 segundos antes de redirigir para que se vea el mensaje
      await new Promise((resolve) => setTimeout(resolve, 1200));
      // Después del delay, permitir que se muestre HomePanel
      setShouldShowHomePanel(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error al iniciar sesión. Por favor, intenta nuevamente.";
      showNotification(errorMessage, "error");
      setIsLoading(false);
    }
  };

  // Resetear shouldShowHomePanel cuando el usuario se desloguea
  useEffect(() => {
    if (!user) {
      setShouldShowHomePanel(false);
    }
  }, [user]);

  if (user && shouldShowHomePanel) return <HomePanel />;

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
          duration={notification.duration || (notification.type === "error" ? 7000 : 5000)}
        />
      )}
      <div className={styles.backgroundContainer}>
        <div className={styles.loginContainer}>
          <img
            src="/logo_ucn.png"
            alt="Logo UCN"
            className={styles.logoUCN}
          />

          <div style={{ marginTop: "60px" }}>
            <h2 className={styles.loginTitle}>
              {" "}
              Bienvenido/a. Por favor ingrese al sitio{" "}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <span className={styles.inputIcon}>📧</span>
                <input
                  type="text"
                  name="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="  Ingresa tu correo institucional"
                  className={styles.inputPlaceholderCustom}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className={styles.inputGroup}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  type="password"
                  name="password"
                  value={password}
                  placeholder="  Ingresa tu contraseña"
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.inputPlaceholderCustom}
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className={styles.loginButton}
                disabled={isLoading}
              >
                {isLoading ? "⏳ INGRESANDO..." : "🔐 INGRESAR"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
