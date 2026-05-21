# Front NeoGaming

Frontend oficial de NeoGaming, un marketplace gamer orientado al mercado colombiano. Esta aplicación consume la API del backend de NeoGaming y cubre los flujos de catálogo, autenticación, carrito, checkout, cuenta del cliente, panel de vendedor y panel administrativo.

Está construida con Angular 21, rendering híbrido con SSR, estado global con NgRx y estilos con Tailwind CSS v4.

## Tabla de contenido

1. [Resumen del proyecto](#resumen-del-proyecto)
2. [Stack tecnológico](#stack-tecnológico)
3. [Qué resuelve este frontend](#qué-resuelve-este-frontend)
4. [Arquitectura general](#arquitectura-general)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Rutas principales](#rutas-principales)
7. [Estado global y sesión](#estado-global-y-sesión)
8. [Integración con backend](#integración-con-backend)
9. [Requisitos previos](#requisitos-previos)
10. [Instalación y ejecución local](#instalación-y-ejecución-local)
11. [Scripts disponibles](#scripts-disponibles)
12. [Build y despliegue](#build-y-despliegue)
13. [Docker](#docker)
14. [Estilos y sistema visual](#estilos-y-sistema-visual)
15. [Guía rápida para desarrollar nuevas funcionalidades](#guía-rápida-para-desarrollar-nuevas-funcionalidades)
16. [Troubleshooting](#troubleshooting)

## Resumen del proyecto

NeoGaming Front es una SPA/SSR enfocada en tres perfiles:

- `CLIENT`: navega el catálogo, compra productos, administra su cuenta, pedidos, direcciones, facturas, reseñas y wishlists.
- `SELLER`: administra su tienda, productos, inventario, ofertas, pedidos y analíticas.
- `ADMIN`: modera vendedores, categorías, reseñas, facturas y métricas globales.

La aplicación está diseñada para:

- Exponer catálogo y páginas públicas con buena experiencia inicial.
- Proteger rutas privadas con guards por autenticación y rol.
- Mantener sesión del usuario entre recargas.
- Consumir una API REST centralizada.
- Soportar renderizado del lado del servidor para mejorar carga inicial y compatibilidad.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework principal | Angular 21 |
| Renderizado | Angular SSR |
| Estado global | NgRx Store + NgRx Effects |
| HTTP | `HttpClient` con interceptors |
| Estilos | Tailwind CSS v4 |
| Íconos | `@ng-icons` + Lucide |
| Runtime SSR | Node.js + Express |
| Testing unitario | `ng test` con builder de Angular |
| Formateo | Prettier |
| Package manager | npm |

## Qué resuelve este frontend

### Experiencia pública

- Home con hero principal, categorías destacadas y productos destacados.
- Catálogo con navegación por categoría.
- Detalle de producto.
- Vista pública de tienda por `storeSlug`.
- Vista pública de wishlist compartida.
- Registro y login.

### Experiencia del cliente

- Perfil y datos de cuenta.
- Gestión de direcciones.
- Carrito persistido en backend.
- Flujo de checkout y resultado de pago.
- Consulta de pedidos.
- Consulta de facturas.
- Gestión de reseñas propias.
- Gestión de wishlists.
- Solicitud para convertirse en vendedor.

### Experiencia del vendedor

- Dashboard de vendedor.
- Perfil de la tienda.
- Cuentas de cobro.
- CRUD de productos.
- Inventario por producto.
- Ofertas por producto.
- Órdenes recibidas.
- Analíticas.

### Experiencia administrativa

- Inicio del panel admin.
- Gestión de vendedores.
- Moderación de reseñas.
- Facturación.
- Gestión de categorías.
- Analítica global.

## Arquitectura general

La app sigue una organización por responsabilidades dentro de `src/app`:

- `core/`: servicios, guards, interceptors y estado global compartido.
- `features/`: pantallas de negocio agrupadas por dominio o rol.
- `layouts/`: contenedores principales según contexto de navegación.
- `shared/`: componentes reutilizables, pipes y modelos.

Además:

- Se usan componentes standalone.
- El router hace lazy loading de la mayoría de pantallas con `loadComponent`.
- El estado global se concentra en dos slices principales: `auth` y `cart`.
- La sesión se rehidrata al arrancar la app mediante `APP_INITIALIZER`.
- En SSR se soporta reescritura del backend base URL usando un interceptor específico.

## Estructura del proyecto

```text
front-neo/
├── public/                     # Assets públicos
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── account/        # Servicios de perfil, órdenes, direcciones, facturas, wishlists
│   │   │   ├── admin/          # Servicios para panel administrativo
│   │   │   ├── analytics/      # Servicios de métricas
│   │   │   ├── auth/           # Auth service, interceptor, store y effects
│   │   │   ├── cart/           # Servicios y store del carrito
│   │   │   ├── catalog/        # Servicios de categorías, productos y reviews
│   │   │   ├── guards/         # Guards de auth, invitado y roles
│   │   │   ├── seller/         # Servicios del panel seller
│   │   │   └── ssr-api-url.interceptor.ts
│   │   ├── features/
│   │   │   ├── account/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── cart/
│   │   │   ├── catalog/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   ├── reviews/
│   │   │   ├── seller/
│   │   │   └── wishlists/
│   │   ├── layouts/            # Public, account, seller y admin
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   ├── models/
│   │   │   └── pipes/
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── app.routes.server.ts
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── main.ts
│   ├── main.server.ts
│   ├── server.ts
│   └── styles.css
├── angular.json
├── Dockerfile
├── package.json
└── tsconfig*.json
```

## Rutas principales

La navegación está segmentada por layout y permisos.

### Públicas

| Ruta | Descripción |
|---|---|
| `/` | Home |
| `/catalog` | Catálogo general |
| `/catalog/category/:categoryId` | Catálogo filtrado por categoría |
| `/product/:slug` | Detalle de producto |
| `/store/:storeSlug` | Perfil público de tienda |
| `/wishlist/public/:id` | Wishlist pública |
| `/login` | Inicio de sesión |
| `/register` | Registro |

### Cliente autenticado

Estas rutas usan `authGuard`.

| Ruta | Descripción |
|---|---|
| `/account` | Perfil |
| `/account/addresses` | Direcciones |
| `/cart` | Carrito |
| `/checkout` | Checkout |
| `/checkout/result` | Resultado del pago |
| `/orders` | Lista de órdenes |
| `/orders/:id` | Detalle de orden |
| `/invoices` | Facturas |
| `/reviews/me` | Reseñas del usuario |
| `/wishlists` | Listado de wishlists |
| `/wishlists/:id` | Detalle de wishlist |
| `/become-seller` | Solicitud para ser vendedor |

### Vendedor

Estas rutas usan `authGuard` y `roleGuard('SELLER')`.

| Ruta | Descripción |
|---|---|
| `/seller/dashboard` | Dashboard |
| `/seller/profile` | Perfil de tienda |
| `/seller/accounts` | Cuentas bancarias o de cobro |
| `/seller/products` | Productos del vendedor |
| `/seller/products/new` | Crear producto |
| `/seller/products/:id` | Editar producto |
| `/seller/products/:id/inventory` | Inventario |
| `/seller/products/:id/offers` | Ofertas |
| `/seller/orders` | Órdenes recibidas |
| `/seller/analytics` | Analíticas |

### Administración

Estas rutas usan `authGuard` y `roleGuard('ADMIN')`.

| Ruta | Descripción |
|---|---|
| `/admin` | Home admin |
| `/admin/sellers` | Gestión de vendedores |
| `/admin/reviews` | Moderación de reseñas |
| `/admin/invoices` | Facturas |
| `/admin/categories` | Categorías |
| `/admin/analytics` | Analítica global |

## Estado global y sesión

El estado global se define en [src/app/app.config.ts](/home/yuseth28/Documentos/plan%20a/front-neo/src/app/app.config.ts) y actualmente registra dos slices:

- `auth`
- `cart`

### `auth`

Responsabilidades principales:

- Login.
- Registro.
- Restauración automática de sesión al iniciar la app.
- Refresh token.
- Carga del usuario autenticado.
- Redirección automática según rol.
- Logout y limpieza de storage.

Detalles importantes:

- El `refreshToken` se guarda en `localStorage` bajo la clave `neo_refresh_token`.
- Al iniciar la aplicación se dispara `restoreSession`.
- Si el refresh es válido, se recuperan tokens y luego el perfil del usuario con `/users/me`.
- El redirect post-login depende del rol:
  - `SELLER` -> `/seller/dashboard`
  - `ADMIN` -> `/admin`
  - resto -> `/`

### `cart`

Responsabilidades principales:

- Cargar carrito.
- Agregar productos.
- Actualizar items.
- Eliminar items.
- Vaciar carrito.
- Mantener indicadores de carga y errores de adición.

## Integración con backend

### Base URL por entorno

Archivo [src/environments/environment.ts](/home/yuseth28/Documentos/plan%20a/front-neo/src/environments/environment.ts):

```ts
apiUrl: 'http://localhost:8080'
```

Archivo [src/environments/environment.prod.ts](/home/yuseth28/Documentos/plan%20a/front-neo/src/environments/environment.prod.ts):

```ts
apiUrl: 'https://api.neogaming.co'
```

### Endpoints base usados por el frontend

Ejemplos visibles en servicios actuales:

- `/auth/login`
- `/auth/register`
- `/auth/refresh`
- `/auth/logout`
- `/users/me`
- endpoints de catálogo, carrito, checkout, vendedor, admin y analytics según dominio

### Interceptors

La aplicación usa dos interceptors registrados globalmente:

- `ssrApiUrlInterceptor`: en SSR permite reescribir la URL del backend si el servidor necesita usar una base distinta a la expuesta al navegador.
- `authInterceptor`: inyecta headers de autenticación cuando corresponde.

### Requisito local

Para desarrollar normalmente, el backend debe estar corriendo en:

```text
http://localhost:8080
```

Si el backend corre en otro puerto o dominio, debes actualizar `environment.ts` o introducir una estrategia de configuración por runtime.

## Requisitos previos

- Node.js 20 o superior
- npm 10 o superior
- Backend NeoGaming disponible localmente en `http://localhost:8080`

Recomendado:

- Git
- VS Code
- Angular CLI instalado globalmente si quieres usar `ng` fuera de scripts

## Instalación y ejecución local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Levantar el frontend en modo desarrollo

```bash
npm start
```

Esto ejecuta `ng serve` y deja la aplicación disponible en:

```text
http://localhost:4200
```

### 3. Verificar el backend

Antes de probar login, carrito, checkout o paneles protegidos, asegúrate de que la API esté arriba en:

```text
http://localhost:8080
```

## Scripts disponibles

Definidos en [package.json](/home/yuseth28/Documentos/plan%20a/front-neo/package.json):

| Script | Comando | Descripción |
|---|---|---|
| `npm start` | `ng serve` | Servidor de desarrollo |
| `npm run build` | `ng build` | Build de producción |
| `npm run watch` | `ng build --watch --configuration development` | Build incremental para desarrollo |
| `npm test` | `ng test` | Pruebas unitarias |
| `npm run serve:ssr:front-neo` | `node dist/front-neo/server/server.mjs` | Levantar salida SSR compilada |

## Build y despliegue

### Build de producción

```bash
npm run build
```

El artefacto queda en:

```text
dist/front-neo
```

Según `angular.json`, el proyecto usa:

- builder `@angular/build:application`
- `outputMode: "server"`
- entry de SSR en `src/server.ts`

Eso significa que el build queda preparado para servir la app con SSR.

### Servir el build SSR localmente

Después del build:

```bash
npm run serve:ssr:front-neo
```

Por defecto el runtime SSR está pensado para correr en el puerto `4000` cuando se usa el contenedor Docker.

## Docker

El proyecto trae un [Dockerfile](/home/yuseth28/Documentos/plan%20a/front-neo/Dockerfile) multi-stage:

### Build de imagen

```bash
docker build -t front-neo .
```

### Ejecutar contenedor

```bash
docker run --rm -p 4000:4000 front-neo
```

### Qué hace el Dockerfile

- Usa `node:20-alpine` para compilar.
- Ejecuta `npm ci`.
- Construye la app.
- Copia `dist/front-neo` y `node_modules` a una segunda imagen ligera.
- Expone el puerto `4000`.
- Arranca con:

```bash
node dist/front-neo/server/server.mjs
```

## Estilos y sistema visual

La base visual se define en [src/styles.css](/home/yuseth28/Documentos/plan%20a/front-neo/src/styles.css).

Características principales:

- Tailwind CSS v4.
- Tokens personalizados con `@theme`.
- Paleta oscura.
- Acento principal rojo.
- Colores de apoyo neon/cyan/violet para estética gamer/tech.

Variables destacadas:

- `--color-bg-base`
- `--color-bg-surface`
- `--color-accent`
- `--color-neon-cyan`
- `--color-neon-violet`
- `--gradient-hero`

Si quieres mantener consistencia visual:

- Usa los tokens existentes antes de introducir colores nuevos.
- Mantén contraste alto para fondos oscuros.
- Reutiliza componentes compartidos cuando una tarjeta, badge o bloque ya exista.

## Guía rápida para desarrollar nuevas funcionalidades

### Si vas a agregar una nueva pantalla

1. Crea el componente dentro de `src/app/features/...`.
2. Mantén el patrón standalone.
3. Agrega la ruta en `src/app/app.routes.ts`.
4. Usa el layout correspondiente:
   - público
   - cuenta
   - seller
   - admin

### Si vas a consumir un nuevo endpoint

1. Agrega o extiende el servicio correspondiente en `src/app/core/...`.
2. Define o ajusta modelos en `src/app/shared/models/...`.
3. Si el estado necesita persistencia o coordinación global, evalúa integrarlo a NgRx.

### Si la ruta requiere permisos

Usa los guards existentes:

- `authGuard`
- `guestOnlyGuard`
- `roleGuard('SELLER')`
- `roleGuard('ADMIN')`

### Si el cambio afecta sesión o carrito

Revisa primero:

- [src/app/core/auth/store/auth.effects.ts](/home/yuseth28/Documentos/plan%20a/front-neo/src/app/core/auth/store/auth.effects.ts)
- [src/app/core/auth/store/auth.reducer.ts](/home/yuseth28/Documentos/plan%20a/front-neo/src/app/core/auth/store/auth.reducer.ts)
- [src/app/core/cart/store/cart.reducer.ts](/home/yuseth28/Documentos/plan%20a/front-neo/src/app/core/cart/store/cart.reducer.ts)

## Troubleshooting

### El frontend levanta pero no carga datos

Revisa:

- que el backend esté arriba en `http://localhost:8080`
- que no haya errores CORS en la consola
- que `environment.ts` apunte al host correcto

### El login funciona pero al recargar se pierde la sesión

Revisa:

- que el backend responda correctamente a `/auth/refresh`
- que exista `neo_refresh_token` en `localStorage`
- que no haya errores en `restoreSession`

### No puedes entrar al panel seller o admin

Revisa:

- que el usuario autenticado tenga el rol correcto
- que `/users/me` esté devolviendo el rol esperado
- que el backend no esté respondiendo con tokens inconsistentes

### El SSR falla en servidor pero funciona en navegador

Revisa:

- configuración del backend accesible desde el proceso Node SSR
- uso de `ssrApiUrlInterceptor`
- variables o base URLs distintas entre cliente y servidor

### El build falla por tipos o imports

Prueba:

```bash
npm install
npm run build
```

Si persiste:

- valida imports relativos
- revisa modelos en `shared/models`
- confirma que el componente sea standalone y tenga sus `imports` bien declarados

---

Si vas a seguir evolucionando este proyecto, una buena siguiente mejora para esta documentación sería agregar:

- diagrama de flujos de autenticación
- tabla de endpoints consumidos por cada pantalla
- checklist de despliegue
- guía de convenciones de UI y naming
