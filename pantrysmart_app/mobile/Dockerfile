# Dockerfile para React Native con Expo
FROM node:20-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache git

# Instalar Expo CLI globalmente
RUN npm install -g @expo/cli

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json
COPY package.json ./

# Limpiar caché de npm e instalar dependencias
RUN npm cache clean --force && \
    npm install --no-package-lock

# Copiar el resto del código
COPY . .

# Exponer puerto para Expo
EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Comando por defecto
CMD ["npm", "start"]