# 🔍 Guía de Debugging - Diagnóstico de Errores

Esta guía te ayudará a identificar qué está fallando en la aplicación cuando ocurre un error.

## ⚠️ IMPORTANTE: API Externa de Autenticación

**La API externa (`https://puclaro.ucn.cl/eross/avance/login.php`) SOLO acepta peticiones GET con parámetros en query string.**

❌ **NO usar POST** con body JSON - la API externa no lo acepta
✅ **SÍ usar GET** con `?email=...&password=...`

**Formato correcto:**
```
GET https://puclaro.ucn.cl/eross/avance/login.php?email=usuario@example.com&password=contraseña
```

**Nota histórica:** En el commit `2187a24` se cambió de GET a POST pensando en mejorar la seguridad, pero esto rompió la funcionalidad porque la API externa solo acepta GET.

## 📋 Cómo Revisar los Logs

### 1. **Frontend (Navegador)**

Abre las **Herramientas de Desarrollador** del navegador:

- **Chrome/Edge**: `F12` o `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Firefox**: `F12` o `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)

Ve a la pestaña **Console** y busca mensajes que empiecen con `[AuthService]`:

```
[AuthService] Iniciando login para: usuario@example.com
[AuthService] URL del backend: http://localhost:3000/auth/login
[AuthService] Respuesta recibida: { status: 200, ok: true, tiempo: "150ms" }
```

**Errores comunes que verás:**

- ❌ `Error de conexión - El backend no está disponible`
  - **Solución**: Verifica que el backend esté ejecutándose en `http://localhost:3000`
  
- ❌ `status: 500` o `status: 401`
  - **Solución**: Revisa los logs del backend (ver abajo)

- ❌ `TypeError: Failed to fetch`
  - **Solución**: El backend no está corriendo o hay un problema de CORS

### 2. **Backend (Terminal)**

Revisa la terminal donde está ejecutándose el backend. Busca mensajes que empiecen con `[AuthService]` o `[AuthController]`:

```
[AuthService] AuthService inicializado con AUTH_URL: https://puclaro.ucn.cl/eross/avance
[AuthController] Solicitud de login recibida para: usuario@example.com
[AuthService] [LOGIN] Iniciando autenticación para: usuario@example.com
[AuthService] [LOGIN] Respuesta recibida del servicio externo (250ms): { status: 200, ... }
```

**Errores comunes que verás:**

- ❌ `ECONNREFUSED` o `ENOTFOUND`
  - **Problema**: No se puede conectar al servicio externo de autenticación
  - **Solución**: 
    1. Verifica que `AUTH_URL` en `.env` sea correcta
    2. Verifica tu conexión a internet
    3. Verifica que el servicio externo esté disponible

- ❌ `ETIMEDOUT`
  - **Problema**: El servicio externo no responde a tiempo
  - **Solución**: El servicio puede estar sobrecargado, intenta nuevamente

- ❌ `Credenciales inválidas`
  - **Problema**: El email o contraseña son incorrectos
  - **Solución**: Verifica las credenciales

## 🔧 Checklist de Diagnóstico

Cuando veas un error, sigue estos pasos:

### Paso 1: Verifica que el Backend esté Corriendo
```bash
# En la terminal del backend, deberías ver:
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [NestApplication] Nest application successfully started
```

### Paso 2: Verifica la URL del Backend
- Frontend intenta conectarse a: `http://localhost:3000/auth/login`
- Si el backend está en otro puerto, actualiza `frontend/src/services/AuthServices.ts`

### Paso 3: Verifica la Variable de Entorno AUTH_URL
- Revisa `backend/.env`:
  ```
  AUTH_URL=https://puclaro.ucn.cl/eross/avance
  ```
- El backend mostrará esta URL al iniciar:
  ```
  [AuthService] AuthService inicializado con AUTH_URL: https://...
  ```

### Paso 4: Revisa los Logs en Orden

1. **Frontend Console**: ¿Llegó la petición al backend?
   - Si NO: El backend no está corriendo o hay un problema de red
   - Si SÍ: Continúa al paso 2

2. **Backend Terminal**: ¿Recibió la petición?
   - Si NO: Hay un problema de CORS o el endpoint no existe
   - Si SÍ: Continúa al paso 3

3. **Backend Terminal**: ¿Pudo conectar con el servicio externo?
   - Si NO: Revisa `AUTH_URL` y tu conexión a internet
   - Si SÍ: Continúa al paso 4

4. **Backend Terminal**: ¿Qué respuesta dio el servicio externo?
   - Revisa los logs para ver `status`, `tieneRut`, `tieneCarreras`, etc.

## 📊 Ejemplo de Flujo Exitoso

**Frontend Console:**
```
[AuthService] Iniciando login para: usuario@example.com
[AuthService] URL del backend: http://localhost:3000/auth/login
[AuthService] Respuesta recibida: { status: 200, ok: true, tiempo: "250ms" }
[AuthService] Datos de respuesta: { tieneAccessToken: true, tieneUser: true }
[AuthService] Login exitoso
```

**Backend Terminal:**
```
[AuthService] AuthService inicializado con AUTH_URL: https://puclaro.ucn.cl/eross/avance
[AuthController] Solicitud de login recibida para: usuario@example.com
[AuthService] [LOGIN] Iniciando autenticación para: usuario@example.com
[AuthService] [LOGIN] Respuesta recibida del servicio externo (200ms): { status: 200, tieneRut: true, tieneCarreras: true }
[AuthService] [LOGIN] Autenticación exitosa para: usuario@example.com
[AuthController] Login exitoso para: usuario@example.com
```

## 🚨 Errores Comunes y Soluciones

| Error | Causa Probable | Solución |
|-------|---------------|----------|
| `No se pudo conectar con el servidor` | Backend no está corriendo | Ejecuta `npm run start:dev` en la carpeta `backend` |
| `ECONNREFUSED` | URL incorrecta o servicio no disponible | Verifica `AUTH_URL` en `.env` |
| `Credenciales incorrectas` | Email/contraseña inválidos O API externa cambió | Verifica las credenciales Y revisa logs del backend |
| `CORS error` | Configuración de CORS incorrecta | Verifica `CORS_ORIGIN` en `.env` |
| `ETIMEDOUT` | Servicio externo lento | Intenta nuevamente o verifica la conexión |

## 🔍 Cómo Diagnosticar Problemas con la API Externa

Si las credenciales funcionaban antes y ahora no, sigue estos pasos:

### Paso 1: Revisa los Logs del Backend

En la terminal donde corre el backend, busca estos mensajes después de intentar iniciar sesión:

```
[LOGIN] Iniciando autenticación para: tu@email.com
[LOGIN] URL de autenticación: https://puclaro.ucn.cl/eross/avance/login.php
[LOGIN] Respuesta recibida del servicio externo (XXXms):
```

### Paso 2: Analiza la Respuesta de la API Externa

**Si ves `[LOGIN] Respuesta recibida del servicio externo`:**

1. **Revisa el campo `dataCompleta`**: Muestra exactamente qué devolvió la API externa
2. **Revisa el campo `status`**: 
   - `200` = La API respondió correctamente
   - `401` = La API rechazó las credenciales
   - `500` = Error en el servidor de la API externa
   - Otros = Problema con la API externa

3. **Revisa `estructuraRespuesta`**: Muestra qué campos tiene la respuesta
   - Si falta `rut` o `carreras`, la API externa cambió su formato

**Ejemplo de log cuando la API externa responde:**
```
[LOGIN] Respuesta recibida del servicio externo (250ms): {
  url: 'https://puclaro.ucn.cl/eross/avance/login.php',
  status: 200,
  statusText: 'OK',
  dataCompleta: '{"error": "Credenciales inválidas", ...}',
  tieneRut: false,
  tieneCarreras: false
}
```

### Paso 3: Revisa Errores de Conexión

**Si ves `[LOGIN] ❌ ERROR DE CONEXIÓN con API externa`:**

1. **Revisa `codigo`**:
   - `ECONNREFUSED` = La API externa no está disponible o la URL es incorrecta
   - `ENOTFOUND` = No se puede resolver el dominio
   - `ETIMEDOUT` = La API externa no responde a tiempo
   - `ECONNRESET` = La conexión fue cerrada por el servidor

2. **Revisa `urlIntentada`**: Verifica que sea la URL correcta

3. **Revisa `respuesta`**: Si existe, muestra qué error devolvió la API externa

### Paso 4: Compara con un Login Exitoso

**Logs de un login exitoso deberían mostrar:**
```
[LOGIN] Respuesta recibida del servicio externo (200ms): {
  status: 200,
  dataCompleta: '{"rut": "12345678-9", "carreras": [...]}',
  tieneRut: true,
  tieneCarreras: true
}
[LOGIN] Autenticación exitosa para: tu@email.com
```

**Si los logs muestran algo diferente**, entonces:
- ✅ **El backend está funcionando correctamente**
- ❌ **El problema está en la API externa** (cambió el formato, está caída, o rechaza las credenciales)

### Paso 5: Verifica la API Externa Directamente

Puedes probar la API externa directamente con `curl` o Postman:

```bash
curl -X POST https://puclaro.ucn.cl/eross/avance/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu_password"}'
```

Si la API externa responde con un formato diferente o un error, ese es el problema.

## 💡 Tips Adicionales

1. **Mantén ambas consolas abiertas**: Frontend (navegador) y Backend (terminal)
2. **Filtra los logs**: En la consola del navegador, usa el filtro `[AuthService]`
3. **Revisa el Network Tab**: En las herramientas de desarrollador, ve a "Network" para ver las peticiones HTTP
4. **Verifica las variables de entorno**: Asegúrate de que `.env` tenga todos los valores correctos

