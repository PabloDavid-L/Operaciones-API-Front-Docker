FROM node:20-alpine

WORKDIR /opt/app

COPY package*.json ./

RUN npm install

COPY . .

# Compilamos dentro de la imagen para no compilar en cada arranque.
RUN npm run build

# A partir de acá la imagen corre como producción. El SSL y el sync de la
# base se controlan con DB_SSL y DB_SYNCHRONIZE para que la misma imagen
# sirva tanto en local como en el despliegue real.
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
