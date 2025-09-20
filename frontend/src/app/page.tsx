import styles from './components/LoginForm.module.css';

export default function Home() {
  return (
    <div className={styles.backgroundContainer}>
      <div className={styles.loginContainer}>
        <img
          src="/ucn-escudo-full-color.webp"
          alt="Logo UCN"
          className={styles.logoUCN}
        />

        <div style={{ marginTop: "60px" }}>
          <h2 className={styles.loginTitle}> Bienvenido/a. Por favor ingrese al sitio </h2>

          <form action="/inicio/MyHome">
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>📧</span>
              <input
                type="text"
                name="username"
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