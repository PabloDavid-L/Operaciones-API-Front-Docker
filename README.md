# Operaciones Café — Documentación

> Monorepo **NestJS + Angular + PostgreSQL** con Docker, CI/CD a Docker Hub,
> despliegue en **Render** con imágenes publicadas, monitoreo local
> (Prometheus + Grafana) y Kubernetes local con **minikube**.
>
> Rama de trabajo actual: **`tests`**. El workflow de CI solo publica imágenes
> y despliega en push a **`main`**.

---

## Índice

**Parte I — Aplicación, Docker y CI**

1. [Estado actual](#1-estado-actual)
2. [Arquitectura del repositorio](#2-arquitectura-del-repositorio)
3. [Flujo de la aplicación](#3-flujo-de-la-aplicación)
4. [Tests, cobertura y lint](#4-tests-cobertura-y-lint)
5. [CI/CD — GitHub Actions](#5-cicd--github-actions)
6. [Docker](#6-docker)
7. [Variables de entorno](#7-variables-de-entorno)

**Parte II — Monitoreo y Kubernetes (solo local)**

8. [Monitoreo — Prometheus + Grafana](#8-monitoreo--prometheus--grafana)
9. [Kubernetes local — minikube](#9-kubernetes-local--minikube)

**Parte III — Despliegue en Render**

10. [Render — despliegue con Docker Hub y Deploy Hooks](#10-render--despliegue-con-docker-hub-y-deploy-hooks)

**Anexos**

11. [Comandos rápidos](#11-comandos-rápidos)
12. [Resumen](#12-resumen)
13. [Pendientes](#13-pendientes)

---

# PARTE I — Aplicación, Docker y CI

## 1. Estado actual

| Componente | Tecnología | Local | Kubernetes (minikube) |
|---|---|---|---|
| Frontend | Angular 20 + nginx | http://localhost:8080 | http://cafe.local |
| Backend | NestJS 11 + TypeORM | http://localhost:3000 | http://api.cafe.local |
| PostgreSQL | 16 | localhost:5432 | Service `postgres:5432` |
| Prometheus | prom/prometheus | http://localhost:9090 | Service `prometheus:9090` |
| Grafana | grafana/grafana | http://localhost:3002 | http://grafana.cafe.local |
| Métricas | prom-client | http://localhost:3000/metrics | http://api.cafe.local/metrics |

**Producción (Render, plan free):**

| Servicio | URL | Estado |
|---|---|---|
| Frontend | https://cafe-frontend-odd.onrender.com | Online |
| API | https://cafe-api-odd.onrender.com | Online |
| Postgres | `cafe-db-odd` (gestionado, interno) | Available |

- **Producción:** Render consume las imágenes publicadas en Docker Hub, sin
  construir en el servidor. El deploy lo dispara GitHub Actions con Deploy Hooks.
- **Kubernetes y monitoreo:** pensados **solo para local**. No forman parte del
  despliegue productivo.
- **Imágenes locales:** `operaciones-copia-api:latest` y
  `operaciones-copia-frontend:latest`.
- **Imágenes de Docker Hub (CI):** `pablodavid98/cafe-api`,
  `pablodavid98/cafe-frontend` y `pablodavid98/cafe-postgres`, con tags
  `:<sha>` y `:latest`. Son públicas.

---

## 2. Arquitectura del repositorio

```
Operaciones-copia/
├── .env.example                  # Variables documentadas (se commitea)
├── .gitignore                    # Ignora .env y permite .env.example
├── docker-compose.yml            # Stack local: postgres + api + frontend
├── docker-compose.monitoring.yml # Prometheus + Grafana (solo local)
├── kustomization.yaml            # Ensambla los manifiestos de k8s/
├── README.md
├── proyecto.md                   # Análisis técnico detallado
│
├── k8s/                          # Kubernetes local (minikube)
│   ├── namespace.yaml
│   ├── secret.yaml               # Secret dev (NO usar en producción)
│   ├── api-config.yaml
│   ├── frontend-config.yaml
│   ├── postgres.yaml
│   ├── backend.yaml
│   ├── frontend.yaml
│   ├── prometheus.yaml
│   ├── prometheus/prometheus.yml
│   ├── grafana.yaml
│   ├── ingress.yaml
│   └── README.md
│
├── prometheus/
│   └── prometheus.yml            # Config para Docker Compose
│
├── grafana/
│   ├── dashboards/cafe-api.json  # Dashboard "Café API · Estado y tráfico"
│   └── provisioning/
│       ├── datasources/prometheus.yml
│       └── dashboards/dashboards.yml
│
├── .github/workflows/ci.yml
│
├── Cafe-API/                     # Backend NestJS
│   ├── Dockerfile                # Una etapa: build + start:prod
│   ├── .dockerignore
│   ├── src/
│   │   ├── main.ts               # CORS, ValidationPipe, /metrics
│   │   ├── app.module.ts         # TypeORM + DB_SSL / DB_SYNCHRONIZE
│   │   ├── metrics.ts            # Registry y contadores de Prometheus
│   │   ├── metrics.controller.ts # GET /metrics
│   │   ├── tipos/
│   │   └── cafes/
│   └── test/create.e2e-spec.ts
│
└── cafe-frontend/                # Frontend Angular
    ├── Dockerfile                # Build Angular + nginx
    ├── nginx.conf                # SPA + no-store para env.js
    ├── docker-entrypoint.d/
    │   └── 40-generate-env.sh    # Genera env.js desde API_URL
    ├── public/env.js             # Default para ng serve
    └── src/
        ├── index.html            # Carga env.js antes de Angular
        ├── main.ts               # Override de environment.apiUrl
        ├── environments/
        └── app/
```

> **Nota:** `Cafe-API/docker-compose.yml` existe como legado (solo API + Postgres).
> El flujo completo se hace con el compose de la raíz.

---

## 3. Flujo de la aplicación

### 3.1 Backend — API REST

| Endpoint | Método | Descripción |
|---|---|---|
| `/` | GET | Health check |
| `/metrics` | GET | Métricas Prometheus |
| `/tipos` | GET | Lista tipos |
| `/tipos/:id` | GET | Tipo por ID |
| `/tipos` | POST | Crea tipo |
| `/tipos/:id` | PATCH | Actualiza tipo |
| `/tipos/:id` | DELETE | Elimina tipo |
| `/cafes` | GET | Lista cafés (filtros + paginación) |
| `/cafes/:id` | GET | Café por ID (incluye `tipo`) |
| `/cafes` | POST | Crea café (`tipoId` obligatorio) |
| `/cafes/:id` | PATCH | Actualiza café |
| `/cafes/:id` | DELETE | Elimina café |

**Filtros de `GET /cafes`:** `tipoId`, `description`, `sortBy` (default `id`),
`orderBy` (`ASC`/`DESC`), `page` (mín. 1), `limit` (1–50, default 10).

**Validación global:** `ValidationPipe` con `whitelist`, `forbidNonWhitelisted`
y `transform`; CORS habilitado.

### 3.2 Frontend — rutas

| Ruta | Componente |
|---|---|
| `/` | Redirect a `/cafes` |
| `/cafes`, `/cafes/nuevo`, `/cafes/editar/:id` | Lista y formulario de cafés |
| `/tipos`, `/tipos/nuevo`, `/tipos/editar/:id` | Lista y formulario de tipos |

`ApiService` centraliza las llamadas usando `environment.apiUrl`, que puede
sobrescribirse en runtime con `env.js` (ver sección 6.4).

### 3.3 Base de datos

```
tipo
├── id            PK, autoincremental
├── name          varchar NOT NULL
└── description   varchar NOT NULL

cafe
├── id            PK, autoincremental
├── name          varchar NOT NULL
├── description   varchar NOT NULL
└── tipo_id       FK → tipo.id (ManyToOne, onDelete: CASCADE)
```

### 3.4 Variables del backend

| Variable | Default | Uso |
|---|---|---|
| `DB_HOST` | `localhost` | Host de Postgres |
| `DB_PORT` | `5432` | Puerto |
| `DB_USER` | `postgres` | Usuario |
| `DB_PASSWORD` | `postgres` | Password |
| `DB_NAME` | `cafedb` | Base |
| `DB_SSL` | `false` | SSL explícito (prod: `true`) |
| `DB_SYNCHRONIZE` | `!isProduction` | Crear/ajustar tablas |
| `NODE_ENV` | — | Solo informativo para los defaults |
| `PORT` | `3000` | Puerto HTTP |

---

## 4. Tests, cobertura y lint

### 4.1 Tests

**Total: 14 tests reales.**

| Proyecto | Tipo | Cantidad | Archivo |
|---|---|---|---|
| Backend | Unitarios (mocks) | 4 | `Cafe-API/src/tipos/tipos.controller.spec.ts` + `cafes.controller.spec.ts` |
| Backend | E2E (Postgres real) | 2 | `Cafe-API/test/create.e2e-spec.ts` |
| Frontend | Unitarios (HTTP mock) | 2 | `cafe-frontend/src/app/services/api.spec.ts` |
| Frontend | Smoke (`should create`) | 6 | `cafe-frontend/src/app/components/*/*.spec.ts` + `app.spec.ts` |

```bash
# Backend
cd Cafe-API
npm run test          # 4 unitarios
npm run test:cov      # 4 unitarios + cobertura (con umbral)
npm run test:e2e      # 2 E2E (requiere Postgres en localhost:5432)
npm run build

# Frontend
cd cafe-frontend
npm test -- --watch=false --browsers=ChromeHeadless   # 8 tests
npm run test:cov -- --watch=false --browsers=ChromeHeadless   # + cobertura
npm run build
```

Los 6 specs de componentes son los que genera Angular CLI: instancian el
componente, ejecutan el constructor, el `ngOnInit` y renderizan el template.
No testean las acciones (`guardar`, `eliminar`), solo que el componente se cree
y funcione con sus dependencias inyectadas.

Estado verificado: **4/4 unitarios**, **2/2 E2E**, **8/8 frontend**, builds OK.

### 4.2 Cobertura

Medida el **16/11/2026** con los comandos de arriba:

| Proyecto | Statements | Branches | Functions | Líneas | Archivos medidos |
|---|---|---|---|---|---|
| Backend | **39.0 %** (94/241) | 36.9 % | 14.6 % | **39.4 %** (82/208) | 19 (todo `src`) |
| Frontend | **32.5 %** (39/120) | 0 % | 13.7 % | **32.2 %** (38/118) | 9 (toda la app) |

**Cómo se calcula cada uno:**

- **Backend:** Jest con `collectCoverageFrom: ["**/*.(t|j)s"]`, así que el
  denominador es **todo** `src/`: controllers, services, DTOs, entities y
  `main.ts`, aunque ningún test los importe. El número es conservador y real.
- **Frontend:** Karma solo instrumenta los archivos que el spec **importa**. Al
  sumar los specs de componentes, el denominador pasó de 18 statements (solo
  `api.ts`) a **120** (toda la app). Antes el 33 % era engañoso: medía un
  archivo de 94 líneas, no la aplicación.

**Por qué Branches queda en 0 % en el frontend:** los templates de Angular no
generan ramas JavaScript y los tests no recorren los `if` de los métodos. Por
eso no se declara umbral de branches ahí.

**Umbrales** (si la cobertura baja, el test falla):

| Proyecto | Dónde | Umbral |
|---|---|---|
| Backend | `coverageThreshold` en `Cafe-API/package.json` | 35 % statements / 35 % líneas / 30 % branches / 10 % functions |
| Frontend | `check.global` en `cafe-frontend/karma.conf.js` | 30 % statements / 30 % líneas / 10 % functions |

Están por debajo del valor actual a propósito: la idea es **no retroceder**, no
exigir excelencia de golpe. Al agregar tests, se suben.

**Dónde se ve el resultado:**

- **Consola:** tabla resumen al correr `test:cov`.
- **GitHub Actions:** tabla en la página del run (Step Summary), en cada job.
- **Archivos:** `Cafe-API/coverage/lcov.info` y
  `cafe-frontend/coverage/cafe-frontend/lcov.info` (ignorados por git).
- No hay servicio externo (Codecov/Coveralls): el reporte vive en el run y en
  los `lcov.info`, que quedan listos si se quiere integrar uno después.

### 4.3 Lint

Ambos proyectos usan **ESLint flat config** (ESLint 9/10):

| Proyecto | Config | Reglas |
|---|---|---|
| Backend | `Cafe-API/eslint.config.mjs` | `recommendedTypeChecked` (con tipos) + Prettier |
| Frontend | `cafe-frontend/eslint.config.mjs` | `typescript-eslint` + `@angular-eslint` (selectores) |

Hay **dos scripts** por proyecto:

| Script | Qué hace | Dónde se usa |
|---|---|---|
| `npm run lint` | ESLint con `--fix` | local, antes de commitear |
| `npm run lint:ci` | ESLint **sin** `--fix` + `--max-warnings=0` | CI |

**Por qué la diferencia:** con `--fix` el CI arreglaba el código en memoria y
salía en verde, así que un archivo mal formateado nunca se detectaba (los
cambios del runner se descartan). `lint:ci` **verifica**: si algo no cumple,
el job falla. Localmente seguís teniendo el auto-fix.

```bash
cd Cafe-API && npm run lint        # corrige
cd Cafe-API && npm run lint:ci     # verifica (lo que corre el CI)
```

---

## 5. CI/CD — GitHub Actions

**Archivos:** `.github/workflows/ci.yml` (integración) y
`.github/workflows/cd.yml` (despliegue).

| Acción | Backend | Frontend | Docker (push) | Deploy Render |
|---|---|---|---|---|
| Push a `main` | ✅ | ✅ | ✅ | ✅ |
| PR a `main` | ✅ | ✅ | ❌ | ❌ |
| Push a `tests` | ❌ | ❌ | ❌ | ❌ |
| `workflow_dispatch` | ✅ | ✅ | ❌ | ✅ |

- **Backend:** `npm ci` → `lint:ci` → `test:cov` (4 unitarios + cobertura con
  umbral) → 2 E2E con service container `postgres:16` → build.
- **Frontend:** `npm ci` → `lint:ci` → `test:cov` con Chromium headless
  (8 tests + cobertura con umbral) → build.
- **Cobertura:** cada job escribe la tabla de cobertura en el **Step Summary**
  del run. Los `lcov.info` quedan en el runner (no se commitean).
- **Docker:** solo en push a `main` y si ambos jobs pasan. Publica:
  - `docker.io/pablodavid98/cafe-api:{sha,latest}`
  - `docker.io/pablodavid98/cafe-frontend:{sha,latest}`
  - `docker.io/pablodavid98/cafe-postgres:16`
- **Deploy (`cd.yml`):** no corre en paralelo al CI. Se dispara con
  `workflow_run` cuando el workflow `CI Monorepo` termina, y solo si terminó en
  `success` y fue por un push a `main`; así los hooks se llaman con las imágenes
  ya publicadas. Hace `curl` a los Deploy Hooks de Render
  (`RENDER_DEPLOY_HOOK_API` y `RENDER_DEPLOY_HOOK_FRONTEND`).
  `workflow_dispatch` permite redeployar el `:latest` actual a mano.

**Secrets requeridos:** `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`,
`RENDER_DEPLOY_HOOK_API`, `RENDER_DEPLOY_HOOK_FRONTEND`.

> Para que existan imágenes nuevas hay que mergear/pushear a `main`. La rama
> `tests` no dispara el workflow. GitHub solo ejecuta el CD si `cd.yml` existe
> en la rama por defecto (`main`).

---

## 6. Docker

### 6.1 `docker-compose.yml` (raíz)

Los valores se toman de `.env` o de sus defaults, así funciona con o sin archivo:

```yaml
postgres:
  environment:
    POSTGRES_USER: ${DB_USER:-postgres}
    POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    POSTGRES_DB: ${DB_NAME:-cafedb}

api:
  environment:
    DB_HOST: ${DB_HOST:-postgres}
    DB_PORT: ${DB_PORT:-5432}
    DB_USER: ${DB_USER:-postgres}
    DB_PASSWORD: ${DB_PASSWORD:-postgres}
    DB_NAME: ${DB_NAME:-cafedb}
    DB_SSL: ${DB_SSL:-false}
    DB_SYNCHRONIZE: ${DB_SYNCHRONIZE:-true}

frontend:
  environment:
    API_URL: ${API_URL:-http://localhost:3000}
```

### 6.2 `Cafe-API/Dockerfile` (una sola etapa)

```dockerfile
FROM node:20-alpine
WORKDIR /opt/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

- Compila **en el build**, no en cada arranque.
- `NODE_ENV=production` está horneado en la imagen.
- Por eso `DB_SSL` y `DB_SYNCHRONIZE` son explícitos: la misma imagen sirve en
  local (sin SSL) y en producción.

### 6.3 `cafe-frontend/Dockerfile` (build + nginx)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /opt/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
ENV API_URL=http://localhost:3000
COPY --from=build /opt/app/dist/cafe-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/40-generate-env.sh /docker-entrypoint.d/40-generate-env.sh
RUN chmod +x /docker-entrypoint.d/40-generate-env.sh
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

`nginx.conf` incluye SPA fallback y `Cache-Control: no-store` para `/env.js`.

### 6.4 `API_URL` en runtime (deploy hook)

Angular corre en el navegador, así que no puede leer variables del contenedor.
El puente es `env.js`:

1. `public/env.js` define `window.__env` (default para `ng serve`).
2. `index.html` carga `env.js` antes de los bundles.
3. `main.ts` sobrescribe `environment.apiUrl` si existe `window.__env.apiUrl`.
4. `40-generate-env.sh` genera `/usr/share/nginx/html/env.js` al arrancar el
   contenedor con el valor de `API_URL`.

Consecuencia: **cambiar la URL no requiere reconstruir la imagen**.

```bash
# Misma imagen, otra URL
docker run --rm -p 8081:80 -e API_URL=http://192.168.1.50:3000 operaciones-copia-frontend:latest
curl http://localhost:8081/env.js
# window.__env = { apiUrl: "http://192.168.1.50:3000" };
```

### 6.5 `DB_SSL` y `DB_SYNCHRONIZE`

| Entorno | `DB_SSL` | `DB_SYNCHRONIZE` |
|---|---|---|
| `npm run start:dev` (sin env) | `false` | `true` |
| Docker local | `false` | `true` |
| Kubernetes local | `false` | `true` |
| Producción | `true` | `false` (o `true` solo el primer deploy) |

### 6.6 Comandos Docker

```bash
docker compose up -d                 # postgres + api + frontend
docker compose up -d --build         # reconstruir imágenes locales
docker compose logs -f api
docker compose down                  # no borra datos
docker compose down -v               # borra el volumen de Postgres
```

### 6.7 Compose legado

`Cafe-API/docker-compose.yml` solo define API + Postgres. No se usa para el flujo
completo y puede quedar desactualizado.

---

## 7. Variables de entorno

Hay un único `.env.example` en la raíz. No se commitea ningún `.env` real.

```bash
cp .env.example .env
```

| Variable | ¿Secreto? | Local | Producción |
|---|---|---|---|
| `DB_USER` | No | `postgres` | según proveedor |
| `DB_PASSWORD` | **Sí** | `postgres` | secret |
| `DB_NAME` | No | `cafedb` | según proveedor |
| `DB_HOST` | No | `postgres` | host del proveedor |
| `DB_PORT` | No | `5432` | según proveedor |
| `DB_SSL` | No | `false` | `true` |
| `DB_SYNCHRONIZE` | No | `true` | `false` |
| `API_URL` | No (es pública) | `http://localhost:3000` | URL pública del API |
| `GRAFANA_USER` | No | `admin` | — |
| `GRAFANA_PASSWORD` | **Sí** | `admin` | — |
| `DOCKERHUB_USERNAME` | No | — | usuario de Docker Hub |
| `TAG` | No | — | SHA de la imagen |

- `.gitignore` ignora `.env` y `.env.*`, pero permite `.env.example`.
- El backend usa `ConfigModule.forRoot({ ignoreEnvFile: true })`: en desarrollo
  **no** lee `.env`; usa variables del entorno o sus defaults.
- En Kubernetes los valores van a `ConfigMap` / `Secret`, no a `.env`.

---

# PARTE II — Monitoreo y Kubernetes (solo local)

> Esta parte **no** se despliega en producción. Es para desarrollo y observación
> local.

## 8. Monitoreo — Prometheus + Grafana

### 8.1 Componentes

| Servicio | Imagen | Puerto local |
|---|---|---|
| Prometheus | `prom/prometheus:latest` | 9090 |
| Grafana | `grafana/grafana:latest` | 3002 |

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

- Proyecto Compose: `cafe-monitoring` (separado del stack principal).
- Grafana aprovisiona datasource y dashboard automáticamente desde `grafana/`.
- Volúmenes: `prometheus_data` y `grafana_data`.

### 8.2 Prometheus

`prometheus/prometheus.yml` scrapea `host.docker.internal:3000` (API en el host o
contenedor con el 3000 publicado) y a sí mismo en `localhost:9090`.
El compose agrega `extra_hosts: host.docker.internal:host-gateway`.

### 8.3 Dashboard provisionado

**"Café API · Estado y tráfico"** — 5 paneles:

1. ¿API en línea? (`up{job="cafe-api"}`)
2. Peticiones totales desde el arranque (excluye `/metrics` y `/health`)
3. Peticiones en la última hora (`increase(...[1h])`)
4. Reparto por endpoint · última hora (donut Cafés vs Tipos)
5. Peticiones por endpoint · por segundo (timeseries)

Métricas disponibles: `http_requests_total{method,route,code}`,
`http_request_duration_seconds` y métricas por defecto de Node.

### 8.4 Comandos

```bash
docker compose -f docker-compose.monitoring.yml up -d
docker compose -f docker-compose.monitoring.yml logs -f
docker compose -f docker-compose.monitoring.yml down
```

### 8.5 Consideraciones

- El contador `http_requests_total` **se reinicia** cuando se reinicia la API.
- Tras reiniciar Grafana, `admin/admin` puede dejar de validar (Grafana 13 no
  re-aplica el env en cada arranque):
  ```bash
  docker exec grafana grafana cli admin reset-admin-password admin
  ```
- Cambiar el dashboard: editar `grafana/dashboards/cafe-api.json`, subir el
  `version` y reiniciar Grafana.

---

## 9. Kubernetes local — minikube

### 9.1 Requisitos

- Docker
- `minikube` y `kubectl` (instalados en `~/.local/bin` en esta máquina)
- Agregar `~/.local/bin` al `PATH` si no está

```bash
minikube start --profile=cafe --driver=docker --cpus=2 --memory=4096 --disk-size=20g
minikube addons enable ingress --profile=cafe
```

### 9.2 Manifiestos

| Archivo | Contenido |
|---|---|
| `k8s/namespace.yaml` | Namespace `cafe` |
| `k8s/secret.yaml` | `DB_PASSWORD` y `GRAFANA_PASSWORD` (**dev**) |
| `k8s/api-config.yaml` | `DB_*`, `DB_SSL`, `DB_SYNCHRONIZE` |
| `k8s/frontend-config.yaml` | `API_URL=http://api.cafe.local` |
| `k8s/postgres.yaml` | StatefulSet + Service + PVC 1Gi |
| `k8s/backend.yaml` | Deployment + Service + initContainer que espera Postgres |
| `k8s/frontend.yaml` | Deployment + Service |
| `k8s/prometheus.yaml` | Deployment + Service (9090) |
| `k8s/prometheus/prometheus.yml` | Scrapea `api:3000` |
| `k8s/grafana.yaml` | Deployment + Service (3000) |
| `k8s/ingress.yaml` | `cafe.local`, `api.cafe.local`, `grafana.cafe.local` |

`kustomization.yaml` (raíz) ensambla todo y genera los ConfigMaps de Prometheus
y Grafana **desde los archivos existentes**, sin duplicarlos:

```bash
kubectl apply -k .
```

### 9.3 Puesta en marcha

```bash
# Imágenes locales (no están en un registry)
minikube image load operaciones-copia-api:latest --profile=cafe
minikube image load operaciones-copia-frontend:latest --profile=cafe

# Manifiestos
kubectl apply -k .

# Hosts (una sola vez)
echo "$(minikube ip --profile=cafe) cafe.local api.cafe.local grafana.cafe.local" | sudo tee -a /etc/hosts

# Esperar
kubectl -n cafe wait --for=condition=ready pod --all --timeout=300s
```

| Servicio | URL |
|---|---|
| Frontend | http://cafe.local |
| API | http://api.cafe.local/tipos |
| Métricas | http://api.cafe.local/metrics |
| Grafana | http://grafana.cafe.local (admin/admin) |
| Prometheus | `kubectl -n cafe port-forward svc/prometheus 9090:9090` |

### 9.4 Verificación realizada

Todo comprobado en el cluster `cafe` (minikube v1.39.0 / kubectl v1.37.2):

- 5 pods `Running` y `Ready` (api, frontend, postgres, prometheus, grafana),
  **0 reinicios**.
- `cafe.local/` → 200; `/cafes` y `/tipos` → 200 (SPA fallback).
- `env.js` → `window.__env = { apiUrl: "http://api.cafe.local" };`
- CRUD completo: POST/GET/PATCH/DELETE de tipos y cafés, filtros y paginación.
- Validación: `POST /tipos` inválido → 400.
- Persistencia: se reinició el pod de Postgres y los datos del PVC siguieron ahí.
- Prometheus: targets `cafe-api` y `prometheus` en **up**.
- Grafana: login OK, dashboard con 5 paneles y datos reales.

### 9.5 Operación

```bash
kubectl -n cafe get pods,svc,ingress,pvc
kubectl -n cafe logs deploy/api
kubectl -n cafe port-forward svc/grafana 3002:3000

# Rebuild de imágenes locales
docker compose build api frontend
minikube image load operaciones-copia-api:latest --profile=cafe
minikube image load operaciones-copia-frontend:latest --profile=cafe
kubectl -n cafe rollout restart deploy/api deploy/frontend

# Destruir
kubectl delete -k .
minikube delete --profile=cafe
```

### 9.6 Consideraciones

- **Imágenes:** `imagePullPolicy: IfNotPresent`. Si no se cargan con
  `minikube image load`, los pods quedan en `ImagePullBackOff`.
- **Grafana necesita memoria:** con 256 Mi el pod fue `OOMKilled`; el manifiesto
  usa `1Gi` de límite.
- **Postgres:** PVC `data-postgres-0`; `subPath: pgdata` evita problemas con
  `lost+found`.
- **Prometheus:** datos en `emptyDir` (se pierden al recrear el pod).
- **Sin `depends_on`:** el backend usa un `initContainer` con `pg_isready`.
- **Secrets:** `k8s/secret.yaml` tiene valores de desarrollo; no usarlo tal cual
  en un cluster real.
- **Ingress:** clase `nginx` provista por el addon de minikube.

---

# PARTE III — Despliegue en Render

> Producción usa las imágenes publicadas en Docker Hub. Render **no construye**
> las imágenes: solo las descarga y las ejecuta.

## 10. Render — despliegue con Docker Hub y Deploy Hooks

### 10.1 Arquitectura

| Servicio | Tipo | Imagen / recurso | URL |
|---|---|---|---|
| `cafe-api-odd` | Web Service (Docker) | `docker.io/pablodavid98/cafe-api:latest` | https://cafe-api-odd.onrender.com |
| `cafe-frontend-odd` | Web Service (Docker) | `docker.io/pablodavid98/cafe-frontend:latest` | https://cafe-frontend-odd.onrender.com |
| `cafe-db-odd` | Render Postgres 16 (free) | — | host interno |

- Las imágenes son **públicas** (`pablodavid98`), así que Render no necesita
  credenciales de registry.
- El frontend recibe `API_URL` en runtime y genera `env.js`; no hay que
  reconstruir la imagen para cambiar la URL.
- `cafe-postgres` de Docker Hub **no se usa**: Render provee Postgres gestionado.

### 10.2 Blueprint (`render.yaml`)

El archivo `render.yaml` de la raíz define todo:

```bash
# En Render: New → Blueprint → seleccionar el repo → Apply
```

- **Postgres:** `cafe-db-odd`, plan free, PostgreSQL 16, región `oregon`.
- **API:** variables `DB_*` tomadas del Postgres con `fromDatabase`,
  `DB_SSL=true` y `DB_SYNCHRONIZE=true`.
- **Frontend:** `API_URL` tomada de `RENDER_EXTERNAL_URL` del servicio de la API
  (si el Blueprint no la resuelve, se reemplaza por la URL literal).
- **Ambos servicios:** `autoDeploy: false`. Sin eso, Render redeployaría solo al
  detectar un `:latest` nuevo y el Deploy Hook sería un segundo deploy
  redundante.

### 10.3 Deploy Hooks desde GitHub Actions

Render **no redeploya solo** cuando cambia `:latest` (`autoDeploy: false`). El
workflow `.github/workflows/cd.yml` se dispara con `workflow_run` cuando termina
`CI Monorepo` en `main` con `success`, y hace:

```bash
curl -fsS -X POST "$RENDER_DEPLOY_HOOK_API"
curl -fsS -X POST "$RENDER_DEPLOY_HOOK_FRONTEND"
```

| Secret | Dónde se obtiene |
|---|---|
| `RENDER_DEPLOY_HOOK_API` | Render → `cafe-api-odd` → Settings → Deploy Hook |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Render → `cafe-frontend-odd` → Settings → Deploy Hook |

Render responde **200** (deploy iniciado) o **202** (encolado). `curl -f` hace
fallar el job si Render rechaza la solicitud. El hook no espera a que termine el
deploy; el resultado se ve en el dashboard.

### 10.4 Variables de entorno en Render

| Variable | Servicio | Valor |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | API | del Postgres de Render |
| `DB_SSL` | API | `true` |
| `DB_SYNCHRONIZE` | API | `true` (todavía no hay migraciones) |
| `API_URL` | Frontend | `https://cafe-api-odd.onrender.com` |

`NODE_ENV=production` ya viene en la imagen y `PORT` lo inyecta Render.

### 10.5 Flujo completo

```
push a main
  → CI (ci.yml): tests backend + frontend
  → CI (ci.yml): docker build & push (Docker Hub :sha y :latest)
  → CI termina en success
  → CD (cd.yml): curl Deploy Hook API
               → curl Deploy Hook Frontend
  → Render descarga :latest → health check → online
```

### 10.6 Plan free: límites a tener en cuenta

- El Postgres free **expira a los 30 días** (1 GB, sin backups).
- Los web services se **duermen a los 15 min** sin tráfico; el arranque en frío
  tarda ~1 min por servicio.
- 512 MB de RAM / 0.1 CPU y 750 horas de instancia por mes.
- Sin shell, sin disco persistente y sin red privada de entrada (la API sí puede
  hablar con el Postgres interno de la misma región).

### 10.7 Rollback

- Cada push publica `:<sha>` además de `:latest`.
- En Render se puede volver a un deploy anterior (en free, a los dos últimos).
- La imagen del SHA debe seguir existiendo en Docker Hub.

### 10.8 Verificación

Verificado el **16/11/2026**:

```bash
curl -s https://cafe-api-odd.onrender.com/tipos      # 200 JSON
curl -s https://cafe-api-odd.onrender.com/cafes      # 200 JSON
curl -s https://cafe-api-odd.onrender.com/metrics | head
curl -s https://cafe-frontend-odd.onrender.com/env.js  # apiUrl correcta
```

- Escritura contra el Postgres gestionado (`cafe-db-odd`) → persiste.
- Deploy disparado desde GitHub Actions con los dos Deploy Hooks.

> El primer request después del spin-down puede tardar ~1 min.

---

# ANEXOS

## 11. Comandos rápidos

```bash
# Stack completo en Docker
docker compose up -d
docker compose up -d --build

# Monitoreo local
docker compose -f docker-compose.monitoring.yml up -d

# Desarrollo
cd Cafe-API && npm run start:dev        # API en 3000
cd cafe-frontend && npm start           # ng serve en 4200

# Tests
cd Cafe-API && npm run test:cov && npm run test:e2e
cd cafe-frontend && npm run test:cov -- --watch=false --browsers=ChromeHeadless

# Lint (local corrige / CI verifica)
cd Cafe-API && npm run lint
cd cafe-frontend && npm run lint:ci

# Kubernetes
kubectl apply -k .
kubectl -n cafe get pods,svc,ingress
```

## 12. Resumen

| Tema | Dónde |
|---|---|
| Aplicación | Angular 20 + NestJS 11 + PostgreSQL 16 |
| Docker local | `docker-compose.yml` (puertos 8080 / 3000 / 5432) |
| Monitoreo local | `docker-compose.monitoring.yml` (9090 / 3002) |
| Kubernetes local | `k8s/` + `kustomization.yaml` (minikube) |
| CI/CD | GitHub Actions → Docker Hub (`pablodavid98/cafe-*`) |
| Calidad | ESLint (`lint:ci`) + cobertura con umbral (39 % API / 32.5 % frontend) |
| Producción | Render (`render.yaml`) con imágenes de Docker Hub + Deploy Hooks |
| Configuración | `.env.example` (Compose) + ConfigMap/Secret (k8s) + env vars (Render) |
| URL del API | `API_URL` en runtime → `env.js` (sin rebuild) |

## 13. Pendientes

1. **Migraciones de TypeORM:** hoy Render usa `DB_SYNCHRONIZE=true`; pasar a
   migraciones y `DB_SYNCHRONIZE=false`.
2. **Postgres free:** renovarlo antes de los 30 días o pasar a un plan pago.
3. **Cobertura:** subir el frontend testeando las acciones (`guardar`,
   `eliminar`) y los `catchError`; hoy los specs solo verifican la creación.
4. Evaluar `npm ci` y multi-stage en los Dockerfiles (opcional; hoy se prioriza
   la simplicidad).
5. Publicar imágenes multi-arch si se migra a un servidor ARM.
6. Commitear `render.yaml`, `cd.yml`, los specs y esta documentación.
