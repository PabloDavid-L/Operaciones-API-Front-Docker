import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

// El contenedor puede inyectar la URL del API en runtime mediante env.js.
// Si no existe (por ejemplo con ng serve), se usa environment.apiUrl.
const runtimeApiUrl = (window as unknown as { __env?: { apiUrl?: string } })
  .__env?.apiUrl;

if (typeof runtimeApiUrl === 'string') {
  environment.apiUrl = runtimeApiUrl;
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
