# Kubernetes local (minikube)

Entorno **solo para desarrollo local**. Producción no usa estos manifiestos.

## Componentes

| Archivo | Contenido |
|---|---|
| `namespace.yaml` | Namespace `cafe` |
| `secret.yaml` | `DB_PASSWORD` y `GRAFANA_PASSWORD` (valores dev) |
| `api-config.yaml` | `DB_*`, `DB_SSL`, `DB_SYNCHRONIZE` |
| `frontend-config.yaml` | `API_URL` |
| `postgres.yaml` | StatefulSet + Service + PVC |
| `backend.yaml` | Deployment + Service + initContainer de espera |
| `frontend.yaml` | Deployment + Service |
| `prometheus.yaml` | Deployment + Service (9090) |
| `grafana.yaml` | Deployment + Service (3000) |
| `ingress.yaml` | `cafe.local`, `api.cafe.local`, `grafana.cafe.local` |

La configuración de Prometheus y el provisioning/dashboard de Grafana se
generan como ConfigMaps desde los archivos que ya existen en `prometheus/` y
`grafana/`, mediante el `kustomization.yaml` de la raíz.

## Puesta en marcha

```bash
# 1) Cluster
minikube start --profile=cafe --driver=docker --cpus=2 --memory=4096 --disk-size=20g

# 2) Ingress nginx (clase "nginx")
minikube addons enable ingress --profile=cafe

# 3) Imágenes locales
minikube image load operaciones-copia-api:latest --profile=cafe
minikube image load operaciones-copia-frontend:latest --profile=cafe

# 4) Manifiestos
kubectl apply -k .

# 5) Hosts (una sola vez)
echo "$(minikube ip --profile=cafe) cafe.local api.cafe.local grafana.cafe.local" | sudo tee -a /etc/hosts
```

## URLs

| Servicio | URL |
|---|---|
| Frontend | http://cafe.local |
| API | http://api.cafe.local/tipos |
| Métricas | http://api.cafe.local/metrics |
| Grafana | http://grafana.cafe.local (admin / admin) |
| Prometheus | `kubectl -n cafe port-forward svc/prometheus 9090:9090` |

## Rebuild de una imagen

```bash
docker compose build api frontend
minikube image load operaciones-copia-api:latest --profile=cafe
minikube image load operaciones-copia-frontend:latest --profile=cafe
kubectl -n cafe rollout restart deploy/api deploy/frontend
```

## Verificación sin tocar /etc/hosts

```bash
IP=$(minikube ip --profile=cafe)
curl --resolve cafe.local:80:$IP http://cafe.local/
curl --resolve api.cafe.local:80:$IP http://api.cafe.local/tipos
curl --resolve grafana.cafe.local:80:$IP http://grafana.cafe.local/api/health
```

## Operación

```bash
kubectl -n cafe get pods,svc,ingress,pvc
kubectl -n cafe logs deploy/api
kubectl -n cafe port-forward svc/grafana 3002:3000

# Destruir todo
kubectl delete -k .
minikube delete --profile=cafe
```

## Notas

- Las imágenes se referencian como `:latest` con `imagePullPolicy: IfNotPresent`.
  Si no se cargan en minikube, el pod queda en `ImagePullBackOff`.
- `DB_SYNCHRONIZE=true` crea las tablas al primer arranque. No hay migraciones.
- Los datos de Postgres viven en el PVC `data-postgres-0`.
- Prometheus usa `emptyDir`: el historial se pierde si se recrea el pod.
- El dashboard de Grafana se toma de `grafana/dashboards/cafe-api.json`; al
  cambiar ese archivo, volver a aplicar (`kubectl apply -k .`) y reiniciar
  Grafana.
