#!/bin/sh
set -e

# URL pública del API. Si no se define, usa localhost para desarrollo local.
API_URL="${API_URL-http://localhost:3000}"
# Quitamos la barra final para evitar dobles barras en las rutas.
API_URL="${API_URL%/}"

printf 'window.__env = { apiUrl: "%s" };\n' "$API_URL" \
  > /usr/share/nginx/html/env.js
