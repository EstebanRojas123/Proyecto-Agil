# Proyecto Ágil - Backend Nestjs - Frontend Nextjs

## 🐳 Configuración con Docker (Recomendado)

Esta configuración permite trabajar en el proyecto sin instalar Node.js, NestJS, Next.js u otras dependencias localmente.

### Prerrequisitos

- [Docker](https://www.docker.com/get-started) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado

### Inicio rápido con Docker

1. **Clonar el repositorio:**
```bash
git clone <tu-repositorio>
cd Proyecto-Agil
```

2. **Levantar todos los servicios:**
```bash
docker-compose up -d
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

## 🧪 Testing

Para probar la API, usa los archivos en la carpeta `Test/` con la extensión "REST Client" de VSCode.

## 📁 Estructura del Proyecto

```
Proyecto-Agil/
├── backend/          # API NestJS
├── frontend/         # App Next.js
├── Test/            # Archivos de testing HTTP
├── docker-compose.yml
└── README.md
```
