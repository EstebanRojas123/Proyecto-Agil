# Dockerfile para el backend NestJS
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Compilar la aplicación
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "run", "start:prod"]