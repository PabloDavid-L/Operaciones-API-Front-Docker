FROM node:20-alpine AS build

WORKDIR /opt/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


FROM nginx:alpine AS prod

# URL del API por defecto; el deploy la sobreescribe con API_URL.
ENV API_URL=http://localhost:3000

COPY --from=build /opt/app/dist/cafe-frontend/browser /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Genera /usr/share/nginx/html/env.js al arrancar el contenedor.
COPY docker-entrypoint.d/40-generate-env.sh /docker-entrypoint.d/40-generate-env.sh
RUN chmod +x /docker-entrypoint.d/40-generate-env.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]