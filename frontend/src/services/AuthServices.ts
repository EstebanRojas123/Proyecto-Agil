export async function loginService(email: string, password: string) {
  try {
    const answer = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await answer.json().catch(() => ({}));

    if (!answer.ok) {
      // Intentar obtener el mensaje de error del backend
      const errorMessage =
        data.message ||
        data.error ||
        (answer.status === 401
          ? "Credenciales incorrectas. Por favor, verifica tu correo y contraseña."
          : answer.status === 500
          ? "Error del servidor. Por favor, intenta nuevamente más tarde."
          : `Error al iniciar sesión (${answer.status}). Por favor, intenta nuevamente.`);

      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    // Si es un error de red o conexión
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e intenta nuevamente."
      );
    }

    // Si ya es un Error con mensaje, re-lanzarlo
    if (error instanceof Error) {
      throw error;
    }

    // Error desconocido
    throw new Error(
      "Ocurrió un error inesperado al intentar iniciar sesión. Por favor, intenta nuevamente."
    );
  }
}
