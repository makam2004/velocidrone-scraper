FROM node:20-slim

# Establece el directorio de trabajo
WORKDIR /app

# Copia el código fuente
COPY . .

# Instala dependencias
RUN npm install

# Expone el puerto
EXPOSE 3000

# Comando para arrancar la aplicación
CMD ["npm", "start"]
