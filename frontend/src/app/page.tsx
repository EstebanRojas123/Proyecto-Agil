"use client";
import { useAuth } from "@/hooks/useAuth";
import styles from "./components/LoginForm.module.css";
import { useState, useEffect, useRef } from "react";
import HomePanel from "./HomePanel";
import Notification from "./components/Notification";
import { EmailIcon, LockIcon, HourglassIcon, LoginIcon } from "./components/Icons";
import { NotificationState } from "@/types/notification.types";

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
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!hasInitializedRef.current && user) {
      setShouldShowHomePanel(true);
      hasInitializedRef.current = true;
    }
  }, [user]);

  const showNotification = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    setNotification({ message, type });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    if (prevUserRef.current && !user) {
      setIsLoading(false);
      setNotification({
        message: "Salió exitosamente. ¡Hasta pronto!",
        type: "info",
        duration: 2500,
      });
    }
    prevUserRef.current = user;
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    hideNotification();

    try {
      await login(email, password);
      showNotification(
        "¡Inicio de sesión exitoso! Bienvenido/a.",
        "success"
      );
      setEmail("");
      setPassword("");
      
      await new Promise((resolve) => setTimeout(resolve, 1200));
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

  useEffect(() => {
    if (!user) {
      setShouldShowHomePanel(false);
      hasInitializedRef.current = false;
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
                <span className={styles.inputIcon}>
                  <EmailIcon />
                </span>
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
                <span className={styles.inputIcon}>
                  <LockIcon />
                </span>
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
                {isLoading ? (
                  <>
                    <HourglassIcon />
                    INGRESANDO...
                  </>
                ) : (
                  <>
                    <LoginIcon />
                    INGRESAR
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
