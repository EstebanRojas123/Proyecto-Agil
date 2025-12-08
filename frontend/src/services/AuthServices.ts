export async function loginService(email: string, password: string) {
  const startTime = Date.now();
  console.log('[AuthService] Iniciando login para:', email);
  console.log('[AuthService] URL del backend:', 'http://localhost:3000/auth/login');

  try {
    const answer = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const responseTime = Date.now() - startTime;
    console.log('[AuthService] Respuesta recibida:', {
      status: answer.status,
      statusText: answer.statusText,
      ok: answer.ok,
      tiempo: `${responseTime}ms`
    });

    const data = await answer.json().catch((parseError) => {
      console.error('[AuthService] Error al parsear JSON:', parseError);
      return {};
    });

    console.log('[AuthService] Datos de respuesta:', {
      tieneAccessToken: !!data.access_token,
      tieneUser: !!data.user,
      error: data.error,
      message: data.message
    });

    if (!answer.ok) {
      const errorMessage =
        data.message ||
        data.error ||
        (answer.status === 401
          ? "Credenciales incorrectas. Por favor, verifica tu correo y contraseña."
          : answer.status === 500
          ? "Error del servidor. Por favor, intenta nuevamente más tarde."
          : `Error al iniciar sesión (${answer.status}). Por favor, intenta nuevamente.`);

      console.error('[AuthService] Error en login:', {
        status: answer.status,
        mensaje: errorMessage,
        datos: data
      });

      throw new Error(errorMessage);
    }

    console.log('[AuthService] Login exitoso');
    return data;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('[AuthService] Excepción capturada:', {
      error,
      tipo: error instanceof Error ? error.constructor.name : typeof error,
      mensaje: error instanceof Error ? error.message : String(error),
      tiempo: `${responseTime}ms`,
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error('[AuthService] Error de conexión - El backend no está disponible');
      throw new Error(
        "No se pudo conectar con el servidor. Por favor, verifica que el backend esté ejecutándose en http://localhost:3000 e intenta nuevamente."
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    console.error('[AuthService] Error desconocido:', error);
    throw new Error(
      "Ocurrió un error inesperado al intentar iniciar sesión. Por favor, intenta nuevamente."
    );
  }
}
