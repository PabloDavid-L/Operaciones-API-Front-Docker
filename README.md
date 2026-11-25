# Operaciones Café — API + Frontend

[![CI Monorepo](https://github.com/PabloDavid-L/Operaciones-API-Front-Docker/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/PabloDavid-L/Operaciones-API-Front-Docker/actions/workflows/ci.yml)
[![CD Render](https://github.com/PabloDavid-L/Operaciones-API-Front-Docker/actions/workflows/cd.yml/badge.svg?branch=main)](https://github.com/PabloDavid-L/Operaciones-API-Front-Docker/actions/workflows/cd.yml)

Aplicación de cafés y tipos de café con CRUD completo, filtros, paginación y
métricas. Es un monorepo con tres servicios que corren juntos con Docker
Compose:

- **Backend:** NestJS 11 + TypeORM + PostgreSQL → `Cafe-API/`
- **Frontend:** Angular 20, servido con nginx → `cafe-frontend/`
- **Base de datos:** PostgreSQL 16 → servicio `postgres` del compose
- **CI/CD:** GitHub Actions → Docker Hub → Render

Todo el stack local se levanta con **un solo comando**.

## Servicios

| Servicio | Tecnología | Puerto local | Imagen |
|---|---|---|---|
| Frontend | Angular 20 + nginx | `8080` | `pablodavid98/cafe-frontend` (propia) |
| API | NestJS 11 + TypeORM | `3000` | `pablodavid98/cafe-api` (propia) |
| Base de datos | PostgreSQL 16 | `5432` | `postgres:16` (oficial) |
| Prometheus (opcional) | prom/prometheus | `9090` | `prom/prometheus:latest` |
| Grafana (opcional) | grafana/grafana | `3002` | `grafana/grafana:latest` |

## Versión desplegada en Render

| Servicio | Dirección |
|---|---|
| Frontend | https://cafe-frontend-odd.onrender.com |
| API (tipos) | https://cafe-api-odd.onrender.com/tipos |
| Métricas | https://cafe-api-odd.onrender.com/metrics |

La base es un PostgreSQL administrado de Render (`cafe-db-odd`) y los dos
servicios web corren las imágenes publicadas en Docker Hub. Las instancias
gratuitas se duermen tras 15 minutos sin tráfico: el primer pedido puede tardar
cerca de un minuto.

## Requisitos

- **Docker** con **Docker Compose** (en Windows y Mac, Docker Desktop; abrirlo
  antes de empezar).
- **Git**.
- Puertos libres: `8080`, `3000` y `5432` (más `9090` y `3002` si se usa
  monitoreo).
- Solo para desarrollo sin Docker: **Node 20.19+** (o 22/24 LTS) y
  **Chrome/Chromium** para los tests del frontend.

Se comprueba con:

```bash
docker --version
docker compose version
node -v
```

## Cómo correrlo

### Opción A — Docker (la forma recomendada)

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

| Qué | Dónde |
|---|---|
| App | http://localhost:8080 |
| API · tipos | http://localhost:3000/tipos |
| API · cafés | http://localhost:3000/cafes |
| Métricas | http://localhost:3000/metrics |

La primera vez tarda varios minutos (descarga imágenes y compila). Para seguir
el arranque:

```bash
docker compose logs -f api
docker compose logs -f frontend
```

```bash
docker compose down        # para los contenedores y conserva los datos
docker compose down -v     # para y BORRA el volumen de PostgreSQL
docker compose stop        # pausa
docker compose start       # retoma
```

> El compose construye las imágenes desde el código local. Las imágenes de
> Docker Hub (`pablodavid98/cafe-*`) son las que usa Render.

### Opción B — desarrollo sin Docker

Son dos aplicaciones separadas, cada una con su `package.json`.

**1. La base de datos:**

```bash
docker compose up -d postgres
```

**2. El backend** (en una terminal):

```bash
cd Cafe-API
npm ci
npm run start:dev          # http://localhost:3000
```

**3. El frontend** (en otra terminal):

```bash
cd cafe-frontend
npm ci
npm start                  # http://localhost:4200
```

> El backend no lee el archivo `.env` (`ConfigModule` usa
> `ignoreEnvFile: true`): toma variables del entorno o sus defaults
> (`localhost:5432`, `postgres/postgres`, base `cafedb`). El frontend usa
> `environment.ts`, que apunta a `http://localhost:3000`; en el contenedor esa
> URL se reemplaza con `env.js`.

### Opción C — Render

Ya está desplegado con el Blueprint `render.yaml`. Para publicar una versión
nueva:

1. Push o merge a `main`.
2. El CI corre los tests, publica las imágenes en Docker Hub y termina en
   `success`.
3. El workflow `CD — Deploy to Render` llama a los Deploy Hooks.
4. Render descarga `:latest` y reinicia los servicios.

También se puede disparar el CD a mano desde **Actions → CD — Deploy to
Render → Run workflow**.

### Opción D — Kubernetes local

La carpeta `k8s/` tiene los manifiestos y `kustomization.yaml` los ensambla.
Requiere minikube y kubectl; ver [`k8s/README.md`](k8s/README.md).

```bash
minikube start --profile=cafe --driver=docker --cpus=2 --memory=4096 --disk-size=20g
minikube addons enable ingress --profile=cafe
minikube image load operaciones-copia-api:latest --profile=cafe
minikube image load operaciones-copia-frontend:latest --profile=cafe
kubectl apply -k .
```

## Tests, cobertura y lint

Hay **14 tests**:

| Proyecto | Tipo | Cantidad | Archivo |
|---|---|---|---|
| Backend | Unitarios (mocks) | 4 | `Cafe-API/src/tipos/tipos.controller.spec.ts` + `cafes.controller.spec.ts` |
| Backend | E2E (PostgreSQL real) | 2 | `Cafe-API/test/create.e2e-spec.ts` |
| Frontend | Unitarios (HTTP mock) | 2 | `cafe-frontend/src/app/services/api.spec.ts` |
| Frontend | Smoke (`should create`) | 6 | `cafe-frontend/src/app/components/*/*.spec.ts` + `app.spec.ts` |

```bash
# Backend
cd Cafe-API
npm ci
npm run lint:ci       # verifica lint (lo que corre el CI)
npm run test          # 4 unitarios
npm run test:cov      # unitarios + cobertura con umbral
npm run test:e2e      # 2 E2E (requiere Postgres en localhost:5432)
npm run build

# Frontend
cd cafe-frontend
npm ci
npm run lint:ci
CHROME_BIN=/usr/bin/google-chrome \
  npm run test:cov -- --watch=false --browsers=ChromeHeadless
npm run build
```

Antes de los E2E, levantar la base:

```bash
docker compose up -d postgres
```

**Cobertura medida (16/11/2026):**

| Proyecto | Statements | Branches | Functions | Líneas |
|---|---|---|---|---|
| Backend | **39.0 %** (94/241) | 36.9 % | 14.6 % | **39.4 %** (82/208) |
| Frontend | **32.5 %** (39/120) | 0 % | 13.7 % | **32.2 %** (38/118) |

Los umbrales están por debajo del valor actual para **no retroceder**:

| Proyecto | Dónde | Umbral |
|---|---|---|
| Backend | `coverageThreshold` en `Cafe-API/package.json` | 35/35/30/10 |
| Frontend | `check.global` en `cafe-frontend/karma.conf.js` | 30/30/10 |

Reportes HTML:

```bash
xdg-open Cafe-API/coverage/lcov-report/index.html
xdg-open cafe-frontend/coverage/cafe-frontend/index.html
```

**Lint:** hay dos scripts por proyecto. `npm run lint` corrige (`--fix`) y se usa
local; `npm run lint:ci` verifica sin modificar y con `--max-warnings=0`, y es el
que corre el CI.

## Integración continua y despliegue (GitHub Actions)

| Workflow | Se dispara cuando | Corre |
|---|---|---|
| `CI Monorepo` (`ci.yml`) | push o PR a `main`; manual | Backend: lint, unitarios + cobertura, E2E con PostgreSQL, build. Frontend: lint, tests + cobertura, build. Docker: build & push solo en push a `main` |
| `CD — Deploy to Render` (`cd.yml`) | cuando `CI Monorepo` termina en `success` por un push a `main`; manual | `curl` a los Deploy Hooks de Render |

- **Imágenes publicadas:** `pablodavid98/cafe-api:{sha,latest}` y
  `pablodavid98/cafe-frontend:{sha,latest}`. No se publica nada si los tests
  fallan.
- **Cobertura:** cada job escribe la tabla en el **Step Summary** del run. Los
  `lcov.info` quedan en el runner y no se commitean.
- **Deploy:** los servicios de Render tienen `autoDeploy: false`, así que el
  único disparador es el Deploy Hook. El CD espera a que el CI termine para
  llamarlo con las imágenes ya publicadas.
- **Rama:** solo `main` publica y despliega. La rama `tests` no dispara el
  workflow.

**Secrets del repo** (Settings → Secrets and variables → Actions):

| Secret | Uso |
|---|---|
| `DOCKERHUB_USERNAME` | Usuario de Docker Hub |
| `DOCKERHUB_TOKEN` | Token de Docker Hub |
| `RENDER_DEPLOY_HOOK_API` | Deploy Hook del servicio de la API |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Deploy Hook del servicio del frontend |

## Estructura

```
Operaciones-copia/
├── docker-compose.yml             # postgres + api + frontend
├── docker-compose.monitoring.yml  # Prometheus + Grafana (opcional)
├── kustomization.yaml             # ensambla k8s/
├── render.yaml                    # Blueprint de Render
├── .env.example
├── README.md
├── proyecto.md                    # documentación técnica detallada
│
├── Cafe-API/                      # API NestJS
│   ├── Dockerfile                 # build + start:prod
│   ├── src/
│   │   ├── main.ts                # CORS, ValidationPipe, /metrics
│   │   ├── app.module.ts          # TypeORM + DB_SSL / DB_SYNCHRONIZE
│   │   ├── metrics.ts             # registry de Prometheus
│   │   ├── metrics.controller.ts  # GET /metrics
│   │   ├── tipos/                 # controller, service, DTOs, entity
│   │   └── cafes/                 # controller, service, DTOs, entity
│   └── test/create.e2e-spec.ts
│
├── cafe-frontend/                 # SPA Angular
│   ├── Dockerfile                 # build Angular + nginx
│   ├── nginx.conf                 # SPA fallback + no-store para env.js
│   ├── karma.conf.js              # cobertura + umbral
│   ├── docker-entrypoint.d/
│   │   └── 40-generate-env.sh     # genera env.js desde API_URL
│   ├── public/env.js
│   └── src/app/
│       ├── services/api.ts
│       └── components/            # cafe-*, tipo-*
│
├── k8s/                           # manifiestos de Kubernetes
├── prometheus/prometheus.yml
├── grafana/                       # datasource + dashboard
└── .github/workflows/
    ├── ci.yml
    └── cd.yml
```

## Endpoints

### Salud y métricas

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/` | Health check (lo usa Render) |
| `GET` | `/metrics` | Métricas en formato Prometheus |

### Tipos

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/tipos` | Lista todos |
| `GET` | `/tipos/1` | Uno por ID |
| `POST` | `/tipos` | Crea uno |
| `PATCH` | `/tipos/1` | Actualiza uno |
| `DELETE` | `/tipos/1` | Elimina uno |

### Cafés

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/cafes` | Lista con filtros y paginación |
| `GET` | `/cafes/1` | Uno por ID (incluye su `tipo`) |
| `POST` | `/cafes` | Crea uno (`tipoId` obligatorio) |
| `PATCH` | `/cafes/1` | Actualiza uno |
| `DELETE` | `/cafes/1` | Elimina uno |

**Filtros de `GET /cafes`** (opcionales):

```
?tipoId=1              filtra por tipo
?description=corto     coincidencia en la descripción
?sortBy=name           campo de orden (default: id)
?orderBy=DESC          ASC o DESC (default: ASC)
?page=1&limit=10       paginación (limit máximo 50)
```

### Ejemplos

```bash
# Crear un tipo
curl -X POST http://localhost:3000/tipos \
  -H 'Content-Type: application/json' \
  -d '{"name":"Clásico","description":"Cafés de siempre"}'

# Crear un café
curl -X POST http://localhost:3000/cafes \
  -H 'Content-Type: application/json' \
  -d '{"name":"Espresso","description":"Corto e intenso","tipoId":1}'

# Listar cafés filtrando por tipo y ordenando
curl 'http://localhost:3000/cafes?tipoId=1&sortBy=name&orderBy=ASC&page=1&limit=10'
```

La API valida con `ValidationPipe` global (`whitelist`,
`forbidNonWhitelisted`, `transform`). Un body inválido responde `400`.

## Variables de entorno

Hay un único `.env.example` en la raíz. Ningún `.env` real se commitea.

| Variable | ¿Secreto? | Local | Producción |
|---|---|---|---|
| `DB_USER` | No | `postgres` | según proveedor |
| `DB_PASSWORD` | **Sí** | `postgres` | secret |
| `DB_NAME` | No | `cafedb` | según proveedor |
| `DB_HOST` | No | `postgres` | host del proveedor |
| `DB_PORT` | No | `5432` | según proveedor |
| `DB_SSL` | No | `false` | `true` |
| `DB_SYNCHRONIZE` | No | `true` | `true` (hasta tener migraciones) |
| `API_URL` | No | `http://localhost:3000` | URL pública del API |
| `GRAFANA_USER` | No | `admin` | — |
| `GRAFANA_PASSWORD` | **Sí** | `admin` | — |

En Kubernetes los valores van a `ConfigMap` y `Secret`, no a `.env`.

## Docker

### Las imágenes

| Servicio | Imagen local | Cómo se construye |
|---|---|---|
| `postgres` | `postgres:16` | oficial, no se construye |
| `api` | `operaciones-copia-api:latest` | `Cafe-API/Dockerfile` |
| `frontend` | `operaciones-copia-frontend:latest` | `cafe-frontend/Dockerfile` |

Las dos imágenes propias también se publican en Docker Hub desde el CI
(`pablodavid98/cafe-api` y `pablodavid98/cafe-frontend`).

### Build

- **Backend:** una etapa sobre `node:20-alpine`; instala, compila y arranca con
  `npm run start:prod`. `NODE_ENV=production` queda horneado.
- **Frontend:** dos etapas. Compila Angular con Node y la imagen final es
  `nginx:alpine` sirviendo los archivos estáticos.

### La URL del API en runtime

Angular corre en el navegador y no puede leer variables del contenedor. El
puente es `env.js`:

1. `public/env.js` inicializa `window.__env` (vacío con `ng serve`).
2. `index.html` carga `env.js` antes de los bundles.
3. `main.ts` sobrescribe `environment.apiUrl` si existe `window.__env.apiUrl`
   (el default de desarrollo es `http://localhost:3000`).
4. `40-generate-env.sh` genera `/usr/share/nginx/html/env.js` al arrancar el
   contenedor con el valor de `API_URL`.

Por eso **cambiar la URL no requiere reconstruir la imagen**: alcanza con
reiniciar el contenedor con otro `API_URL`. nginx sirve `env.js` con
`Cache-Control: no-store`.

### `DB_SSL` y `DB_SYNCHRONIZE`

| Entorno | `DB_SSL` | `DB_SYNCHRONIZE` |
|---|---|---|
| `npm run start:dev` | `false` | `true` |
| Docker local | `false` | `true` |
| Kubernetes local | `false` | `true` |
| Render | `true` | `true` (hasta tener migraciones) |

> `Cafe-API/docker-compose.yml` es un compose legado (solo API + Postgres). El
> flujo completo se hace con el compose de la raíz.

## Monitoreo (opcional, solo local)

```bash
docker compose up -d api
docker compose -f docker-compose.monitoring.yml up -d
```

| Servicio | URL |
|---|---|
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3002 (`admin` / `admin`) |

Prometheus scrapea la API en `host.docker.internal:3000`. Grafana aprovisiona
automáticamente el datasource y el dashboard **"Café API · Estado y tráfico"**
(5 paneles). El contador `http_requests_total` se reinicia cuando se reinicia la
API.

## Render

El Blueprint `render.yaml` define:

| Recurso | Tipo | Imagen / plan |
|---|---|---|
| `cafe-api-odd` | Web Service (Docker) | `docker.io/pablodavid98/cafe-api:latest` |
| `cafe-frontend-odd` | Web Service (Docker) | `docker.io/pablodavid98/cafe-frontend:latest` |
| `cafe-db-odd` | PostgreSQL 16 | plan free |

- Las imágenes son públicas: Render no necesita credenciales de registry.
- `autoDeploy: false` en ambos servicios: el deploy lo dispara el CD con los
  Deploy Hooks.
- `DB_SSL=true` y `DB_SYNCHRONIZE=true` (todavía no hay migraciones).
- El frontend recibe `API_URL` desde el servicio de la API.

**Límites del plan free:** la base expira a los 30 días, los web services se
duermen a los 15 minutos, 512 MB de RAM / 0.1 CPU y 750 horas por mes.

**Rollback:** cada push publica `:<sha>` además de `:latest`. En Render se puede
volver a un deploy anterior (en free, a los dos últimos).

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `port is already allocated` | Otro programa usa 8080, 3000 o 5432. Cerrarlo o cambiar el puerto en el compose. |
| `Cannot connect to the Docker daemon` | Docker no está corriendo. Abrir Docker Desktop o iniciar el servicio en Linux. |
| En Linux, `permission denied` al usar Docker | Anteponer `sudo` o agregar el usuario al grupo `docker`. |
| El front carga pero no trae datos | La URL del API es incorrecta. Revisar `API_URL` (`http://localhost:3000`), recrear el contenedor y recargar con `Ctrl + Shift + R`. |
| El front no muestra datos al recién levantar | El backend todavía está iniciando. Ver `docker compose logs -f api`. |
| `env.js` con una URL vieja | El navegador cacheó el archivo. Recargar forzado; nginx ya manda `no-store`. |
| Los E2E fallan con `ECONNREFUSED` | PostgreSQL no está levantado. Correr `docker compose up -d postgres`. |
| Karma: `No binary for ChromeHeadless` | Falta Chrome/Chromium o `CHROME_BIN` apunta mal. Verificar `which google-chrome chromium`. |
| La base arranca con datos viejos o falla | Volumen de una versión anterior. `docker compose down -v` y levantar de nuevo. |
| El primer request a Render tarda ~1 min | Es el spin-down del plan free. Precalentar con un `curl` antes de la demo. |
| `POST /tipos` o `/cafes` responde 400 | Validación: `name` de al menos 3 caracteres y, en cafés, `tipoId` positivo. |

## Scripts

**Cafe-API/**

| Comando | Qué hace |
|---|---|
| `npm run start:dev` | arranca con recarga automática |
| `npm run build` | compila TypeScript a `dist/` |
| `npm run start:prod` | corre lo compilado |
| `npm run lint` | ESLint con autofix |
| `npm run lint:ci` | ESLint sin autofix, `--max-warnings=0` |
| `npm run test` | unitarios (Jest) |
| `npm run test:cov` | unitarios + cobertura |
| `npm run test:e2e` | E2E contra PostgreSQL |

**cafe-frontend/**

| Comando | Qué hace |
|---|---|
| `npm start` | servidor de desarrollo en el 4200 |
| `npm run build` | compila para producción |
| `npm run lint` | ESLint con autofix |
| `npm run lint:ci` | ESLint sin autofix, `--max-warnings=0` |
| `npm test` | tests con Karma + Jasmine (watch) |
| `npm run test:cov` | tests + cobertura |

## Cosas para saber

- **Validación:** los DTOs usan `class-validator` y un `ValidationPipe` global.
  Un body inválido responde `400` con `{ "message": "..." }`.
- **Consultas parametrizadas:** TypeORM manda los valores aparte, no pegados en
  el SQL.
- **Tablas:** las entidades son la fuente de verdad. Con
  `DB_SYNCHRONIZE=true` TypeORM crea y actualiza las tablas solo. En producción
  eso se reemplazará por migraciones.
- **CORS:** el frontend y la API corren en puertos distintos, por eso la API
  tiene `enableCors()`.
- **El `.env` no viaja en la imagen:** los `.dockerignore` lo excluyen y las
  variables llegan por `environment:` del compose.
- **Cobertura sin servicios externos:** el reporte vive en el run de GitHub
  Actions y en los `lcov.info`. No se usa Codecov ni Coveralls.
- **Rama `main`:** es la única que publica imágenes y despliega. Un push a otra
  rama no dispara el CI.

## Documentación

- [`proyecto.md`](proyecto.md): documentación técnica detallada (decisiones,
  verificación, Render, Kubernetes, monitoreo).
- [`k8s/README.md`](k8s/README.md): Kubernetes local con minikube.
- [`.env.example`](.env.example): variables documentadas.
