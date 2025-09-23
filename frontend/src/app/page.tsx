"use client";
import { useAuth } from "@/hooks/useAuth";
import styles from "./components/LoginForm.module.css";
import { useState } from "react";
import HomePanel from "./HomePanel";

export default function Home() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  console.log("Home page renderizado");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit ejecutado", email, password);
    try {
      await login(email, password);
      alert("Login exitoso!");
    } catch (err) {
      alert("Error al iniciar sesión");
    }
  };

  if (user) return <HomePanel />;

  return (
    <div className={styles.backgroundContainer}>
      <div className={styles.loginContainer}>
        <img
          src="/ucn-escudo-full-color.webp"
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="  Ingresa tu correo institucional"
                className={styles.inputPlaceholderCustom}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                type="password"
                name="password"
                placeholder="  Ingresa tu contraseña"
                onChange={(e) => setPassword(e.target.value)}
                className={styles.inputPlaceholderCustom}
                required
              />
            </div>

            <button type="submit" className={styles.loginButton}>
              🔐 INGRESAR
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
