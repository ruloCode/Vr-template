# Dockerfile para desarrollo del proyecto VR Ecopetrol
FROM node:18-alpine

# Instalar pnpm usando el método oficial recomendado
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración del workspace
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./

# Instalar dependencias raíz
RUN pnpm install

# Copiar código fuente
COPY apps/ ./apps/

# Instalar dependencias de las apps específicamente
RUN pnpm install --filter=server --filter=client

# Exponer puertos
EXPOSE 8080 8081 3000

# Script de desarrollo por defecto
CMD ["pnpm", "dev"]
