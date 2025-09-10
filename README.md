# Proyecto Ágil - Backend Nestjs - Frontend Nextjs

### Instalar dependencias (en el front y back)

```bash
   npm install
```

### Levantar contenedor Docker

en la raiz del proyecto:

```bash
   docker-compose up -d
```

### Ejecutar backend

```bash
   npm run start
```

### Ejecutar frontend

```bash
   npm run dev
```

Para probar la base de datos, en la carpeta Test hay un archivo http el cual pueden ejecutar para probar
los endopoints y la base.

NOTA: Agregar extensión "rest client" en el visual

###Visualizar base de datos
Para visualizar la base de datos pueden entrar a http://localhost:8080/ y agregar el servidor

Campos para añadir servidor:
-host: db
-port: 5432
-maintenance database: proyecto-agil
-username: nestuser
-pass: 12345
