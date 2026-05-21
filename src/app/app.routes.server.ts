import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas públicas con contenido dinámico — se renderizan en servidor (SSR)
  { path: '', renderMode: RenderMode.Server },
  { path: 'catalog', renderMode: RenderMode.Server },
  { path: 'catalog/category/:categoryId', renderMode: RenderMode.Server },
  { path: 'product/:slug', renderMode: RenderMode.Server },
  { path: 'store/:storeSlug', renderMode: RenderMode.Server },
  { path: 'wishlist/public/:id', renderMode: RenderMode.Server },
  // Todo lo demás (rutas autenticadas) se renderiza solo en cliente
  { path: '**', renderMode: RenderMode.Client },
];
