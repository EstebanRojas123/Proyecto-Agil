# Proyecto Ágil - Backend Nestjs - Frontend Nextjs

## Configuración con Docker (Recomendado para facilitar instalación de dependencias)

Esta configuración permite trabajar en el proyecto sin instalar Node.js, NestJS, Next.js u otras dependencias localmente.

### Prerrequisitos

- Tener [Docker](https://www.docker.com/get-started) instalado

### Inicio rápido con Docker

1. **Clonar el repositorio:**
```bash
git clone <tu-repositorio>
cd Proyecto-Agil
```

2. **Levantar todos los servicios:**
```bash
docker compose up -d

```

3. **Verificar que todo esté funcionando:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- PgAdmin: http://localhost:8080

### Servicios incluidos

- **Frontend (Next.js)**: Puerto 3001
- **Backend (NestJS)**: Puerto 3000
- **Base de datos PostgreSQL**: Puerto 5432
- **PgAdmin**: Puerto 8080

### Comandos útiles de Docker

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar un servicio
docker-compose restart backend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Elimina datos de BD)
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache
```

### Configuración de Base de Datos

Para acceder a PgAdmin:
- URL: http://localhost:8080
- Email: admin@admin.com
- Password: admin

**Configuración del servidor PostgreSQL:**
- **Host:** `db`
- **Port:** `5432`
- **Maintenance database:** `proyecto-agil`
- **Username:** `nestuser`
- **Password:** `12345`

### Desarrollo con Docker

Los volúmenes están configurados para hot-reload:
- Los cambios en el código se reflejan automáticamente
- No necesitas reconstruir las imágenes constantemente
- Los `node_modules` se mantienen en el contenedor para mejor rendimiento

### Variables de entorno

Copia los archivos de ejemplo y personaliza según necesites:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## 🔧 Configuración Manual (Alternativa)

Si prefieres instalar las dependencias localmente:

### Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Levantar solo la base de datos

```bash
docker-compose up -d db pgadmin
```

### Ejecutar aplicaciones localmente

```bash
# Backend
cd backend
npm run start:dev

# Frontend (en otra terminal)
cd frontend
npm run dev
```

## Testing

Para probar la API, usa los archivos en la carpeta `Test/` con la extensión "REST Client" de VSCode.

## Estructura del Proyecto

```
Proyecto-Agil/
├── backend/          # API NestJS
├── frontend/         # App Next.js
├── Test/            # Archivos de testing HTTP
├── docker-compose.yml
└── README.md
```

## Guía de Usuario

Esta sección proporciona una guía paso a paso para utilizar el sistema de proyección curricular.

### Inicio de Sesión

1. Accede a la aplicación en http://localhost:3001
2. Ingresa tu correo electrónico y contraseña en el formulario de inicio de sesión
3. Haz clic en el botón "Iniciar Sesión"
4. Si las credenciales son correctas, serás redirigido al panel principal

### Navegación Principal

Una vez iniciada la sesión, verás un menú lateral con tres secciones principales:

- **Malla Curricular**: Visualiza todos los cursos de tu carrera organizados por nivel
- **Trayectoria Curricular**: Revisa tu historial académico y proyección automática
- **Mis Proyecciones**: Crea y gestiona proyecciones manuales de tu plan de estudios

Puedes cambiar entre secciones haciendo clic en los botones del menú lateral. La sección activa se resalta visualmente.

### Malla Curricular

Esta sección muestra todos los cursos de tu carrera organizados por niveles (I, II, III, etc.).

**Funcionalidades:**
- Selecciona una carrera desde el selector en la parte superior si tienes múltiples carreras
- Los cursos se muestran en columnas por nivel
- Cada curso muestra su código, nombre y créditos SCT
- La información se carga automáticamente según la carrera seleccionada

### Trayectoria Curricular

Esta sección combina tu historial académico con una proyección automática de cursos pendientes, mostrando el camino optimizado para mostrar el más pronto egreso a la carrera consultada.

**Información mostrada:**
- **Historial**: Cursos que has cursado, organizados por semestre
- **Estado de cursos**: 
  - APROBADO (verde): Curso aprobado
  - REPROBADO (rojo): Curso reprobado
  - INSCRITO (amarillo naranjoso): Curso actualmente inscrito
  - PROYECTADO (azul): Curso proyectado automáticamente
- **Proyección automática**: El sistema genera una proyección sugerida basada en prerrequisitos y disponibilidad

**Funcionalidades:**
- Selecciona una carrera desde el selector si tienes múltiples carreras
- Los datos se actualizan automáticamente al cambiar de carrera
- La proyección automática se calcula considerando tus cursos aprobados y los prerrequisitos

### Mis Proyecciones

Esta es la sección más interactiva del sistema, donde puedes crear y gestionar proyecciones manuales de tu plan de estudios.

#### Crear una Nueva Proyección

1. Haz clic en el botón "Nueva Proyección" en la parte superior
2. Se creará una proyección vacía lista para que agregues cursos

#### Agregar Cursos a una Proyección

**Método 1: Arrastrar y Soltar (Drag and Drop)**
1. En la parte superior derecha de la pantalla, verás una lista de cursos pendientes organizados por botones con nivel, aparecen desde el nivel con el curso más atrasado que disponga el alumno.
2. Debes crear semestres presionando el botón y asegurarte de agregar cursos y no dejarlos vacíos si se quiere guardar más adelante. 
3. Haz clic y mantén presionado un curso de la lista
4. Arrastra el curso hasta la columna del semestre donde deseas inscribirlo
5. Suelta el curso para agregarlo al semestre

**Método 2: Selección de Nivel**
1. Selecciona un nivel específico desde el selector de nivel para filtrar los cursos
2. Arrastra los cursos del nivel seleccionado a los semestres correspondientes

#### Gestionar Semestres

**Agregar un Semestre:**
- Haz clic en el botón "AÑADIR SEMESTRE" al final de las columnas de semestres
- Se creará una nueva columna para el siguiente semestre disponible
- Nota: El botón desaparece automáticamente cuando agregas el Capstone Project, no tiene sentido agregar más porque ya no hay más ramos.

**Eliminar un Semestre:**
- Haz clic en el botón "X" en la parte superior de la columna del semestre
- Se eliminarán todos los cursos de ese semestre

#### Eliminar Cursos de un Semestre

- Haz clic en el botón "X" en la esquina superior derecha de cada curso
- El curso se eliminará del semestre y volverá a la lista de cursos pendientes siempre y cuando no viole reglas en semestres posteriores.

**Validación Automática:**
- Si eliminas un curso que es prerrequisito de otros cursos en semestres posteriores, el sistema mostrará una advertencia
- Los cursos afectados se marcarán con un símbolo "!" de advertencia
- El curso eliminado se restaurará automáticamente para mantener la validez de la proyección

#### Guardar y Descartar Cambios

**Guardar Cambios:**
- Después de realizar modificaciones, el botón "Guardar" se activará
- Haz clic en "Guardar" para guardar la proyección en el servidor
- Recibirás una notificación confirmando que los cambios se guardaron correctamente

**Descartar Cambios:**
- Si deseas deshacer los cambios no guardados, haz clic en "Descartar"
- Se restaurará la última versión guardada de la proyección
- Recibirás una confirmación antes de descartar los cambios

#### Gestionar Múltiples Proyecciones

**Seleccionar una Proyección:**
- Haz clic en el selector de proyecciones en la parte superior
- Verás una lista de todas tus proyecciones guardadas
- Selecciona la proyección que deseas visualizar o editar

**Eliminar una Proyección:**
- Abre el selector de proyecciones
- Haz clic en el botón de eliminar junto a la proyección que deseas borrar
- Confirma la eliminación

#### Indicadores Visuales

**Cursos con Advertencia:**
- Un símbolo "!" aparece en cursos que tienen problemas de validación
- Esto puede ocurrir cuando:
  - Faltan prerrequisitos
  - Se excede el límite de créditos por semestre
  - Hay conflictos de disponibilidad

**Cursos en Proyección:**
- Los cursos que ya están en un semestre proyectado aparecen con opacidad reducida en la lista de pendientes
- Esto ayuda a identificar qué cursos ya has incluido en tu proyección

**Cambios Sin Guardar:**
- Cuando hay cambios sin guardar, el botón "Guardar" se activa
- Si intentas cerrar sesión con cambios sin guardar, se te pedirá confirmación

#### Validaciones del Sistema

El sistema valida automáticamente:

- **Dispersión**: No puedes inscribir un curso que corresponde a n+2 cursos respecto al nivel actual del estudiante (revisar su curso más atrasado)
- **Prerrequisitos**: No puedes inscribir un curso sin haber aprobado sus prerrequisitos
- **Límite de Créditos**: Cada semestre tiene un límite máximo de 30 créditos, la práctica o pre-práctica profesional no están contemplados en la cuenta de créditos para restricción por cómo funciona la inscripción interna en la universidad.
- **Disponibilidad**: Algunos cursos solo están disponibles en ciertos semestres (hay cursos impartidos sólo en 1er o 2do semestre)
- **Capstone Project**: Una vez agregado el Capstone Project, no se pueden agregar más semestres

Si intentas realizar una acción que viole estas reglas, recibirás una notificación explicando el problema.

#### Cerrar Sesión

1. Haz clic en el botón "Cerrar Sesión" en la parte inferior del menú lateral
2. Si tienes cambios sin guardar, se te pedirá confirmación
3. Puedes elegir guardar los cambios antes de cerrar sesión o descartarlos

### Consejos de Uso

- **Planifica con anticipación**: Crea múltiples proyecciones para comparar diferentes planes de estudio
- **Revisa los prerrequisitos**: Antes de agregar un curso, verifica que hayas cumplido con sus prerrequisitos
- **Guarda frecuentemente**: Guarda tus cambios regularmente para no perder tu trabajo
- **Usa la proyección automática**: Revisa la sección "Trayectoria Curricular" para obtener sugerencias del sistema
- **Organiza por niveles**: Agrupa cursos del mismo nivel para mantener una progresión lógica

### Solución de Problemas

**No puedo iniciar sesión:**
- Verifica que tus credenciales sean correctas
- Asegúrate de que el backend esté ejecutándose

**Los cursos no se cargan:**
- Verifica que hayas seleccionado una carrera
- Intenta recargar la página
- Verifica la conexión con el servidor

**No puedo guardar mi proyección:**
- Verifica que no haya errores de validación (cursos marcados con "!")
- Asegúrate de tener conexión a internet
- Revisa que el backend esté funcionando correctamente

**Los cambios no se guardan:**
- Verifica que hayas hecho clic en el botón "Guardar"
- Revisa las notificaciones para ver si hay algún error
- Intenta guardar nuevamente
