import {
  Counter,
  Histogram,
  collectDefaultMetrics,
  register,
} from 'prom-client';

// Usamos el registry global de prom-client: es el registry al que se
// suscriben por defecto las métricas creadas más abajo. Antes se exportaba
// un `new Registry()` vacío, por eso /metrics devolvía una respuesta vacía.
export { register };

// Métricas de proceso y runtime de Node.js (memoria, CPU, event loop, GC...).
collectDefaultMetrics({ register });

// Contador de peticiones HTTP totales
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Número total de peticiones HTTP',
  labelNames: ['method', 'route', 'code'],
  registers: [register],
});

// Histograma de duración de peticiones HTTP (en segundos)
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Middleware para registrar cada petición entrante
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;

    // Normalizamos los IDs para no generar una etiqueta distinta por cada
    // registro (evita explotar la cardinalidad de Prometheus).
    const route =
      req.route?.path || req.path.replace(/\/\d+(?=\/|$)/g, '/:id');

    const labels = {
      method: req.method,
      route,
      code: res.statusCode,
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });

  next();
};

// En prom-client >= 14 `register.metrics()` devuelve una Promise<string>.
export const getMetrics = () => register.metrics();
