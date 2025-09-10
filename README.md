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

### Visualizar base de datos

Para visualizar la base de datos pueden entrar a [PgAdmin](http://localhost:8080/) y agregar el servidor.

**Campos para añadir el servidor:**

- **Host:** `db`
- **Port:** `5432`
- **Maintenance database:** `proyecto-agil`
- **Username:** `nestuser`
- **Password:** `12345`

Nota: Para probar la base de datos, en la carpeta Test hay un archivo http el cual pueden ejecutar para probar
los endopoints y la base. (agregar extensión 'rest client' en vscode)
