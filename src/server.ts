import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

// Railway (y cualquier reverse proxy) agrega x-forwarded-for / x-forwarded-host.
// Sin este flag, Express rechaza esos headers.
app.set('trust proxy', true);

const angularApp = new AngularNodeAppEngine({
  // Permite que el engine procese x-forwarded-host y x-forwarded-prefix
  // desde el reverse proxy de Railway.
  trustProxyHeaders: true,
  // Hosts autorizados para SSR. Se lee de la variable de entorno NG_ALLOWED_HOSTS
  // (valores separados por coma). Si no está definida, se permite cualquier host.
  allowedHosts: process.env['NG_ALLOWED_HOSTS']
    ? process.env['NG_ALLOWED_HOSTS'].split(',').map((h) => h.trim())
    : undefined,
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
