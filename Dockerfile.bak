FROM node:20-slim

# Instala dependencias del sistema necesarias para Chromium
RUN apt-get update && apt-get install -y \
  chromium \
  --no-install-recommends && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Define directorio de trabajo
WORKDIR /app

# Copia el código
COPY . .

# Instala dependencias de Node.js
RUN npm install

# Expone el puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
