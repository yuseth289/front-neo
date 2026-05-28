import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout';
import { AccountLayoutComponent } from './layouts/account-layout/account-layout';
import { SellerLayoutComponent } from './layouts/seller-layout/seller-layout';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout';
import { authGuard } from './core/guards/auth.guard';
import { guestOnlyGuard } from './core/guards/guest-only.guard';
import { roleGuard } from './core/guards/role.guard';

const notFound = () =>
  import('./shared/components/not-found/not-found').then(
    (m) => m.NotFoundComponent,
  );

export const routes: Routes = [
  // ─── RUTAS PÚBLICAS ────────────────────────────────────────────────────────
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/catalog/home/home').then((m) => m.HomeComponent),
        data: { title: 'Home — NeoGaming' },
      },
      {
        path: 'catalog',
        loadComponent: () => import('./features/catalog/catalog-page/catalog-page').then((m) => m.CatalogPageComponent),
        data: { title: 'Catálogo' },
      },
      {
        path: 'catalog/category/:categoryId',
        loadComponent: () => import('./features/catalog/catalog-page/catalog-page').then((m) => m.CatalogPageComponent),
        data: { title: 'Categoría' },
      },
      {
        path: 'product/:slug',
        loadComponent: () => import('./features/catalog/product-detail/product-detail').then((m) => m.ProductDetailComponent),
        data: { title: 'Producto' },
      },
      {
        path: 'stores',
        loadComponent: () => import('./features/catalog/stores-page/stores-page').then((m) => m.StoresPageComponent),
        data: { title: 'Tiendas' },
      },
      {
        path: 'store/:storeSlug',
        loadComponent: () => import('./features/catalog/store-page/store-page').then((m) => m.StorePageComponent),
        data: { title: 'Tienda' },
      },
      {
        path: 'wishlist/public/:id',
        loadComponent: () => import('./features/wishlists/wishlist-public').then((m) => m.WishlistPublicComponent),
        data: { title: 'Wishlist pública' },
      },
      {
        path: 'login',
        canActivate: [guestOnlyGuard],
        loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
        data: { title: 'Iniciar sesión' },
      },
      {
        path: 'register',
        canActivate: [guestOnlyGuard],
        loadComponent: () => import('./features/auth/register/register').then((m) => m.RegisterComponent),
        data: { title: 'Crear cuenta' },
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/search/smart-search/smart-search.component').then(
            (m) => m.SmartSearchComponent,
          ),
        data: { title: 'Búsqueda inteligente' },
      },
    ],
  },

  // ─── CARRITO Y CHECKOUT (header público, sin sidebar) ────────────────────
  {
    path: '',
    canActivate: [authGuard],
    component: PublicLayoutComponent,
    children: [
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart-page').then((m) => m.CartPageComponent),
        data: { title: 'Carrito' },
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout-page').then((m) => m.CheckoutPageComponent),
        data: { title: 'Checkout' },
      },
      {
        path: 'checkout/result',
        loadComponent: () => import('./features/checkout/checkout-result').then((m) => m.CheckoutResultComponent),
        data: { title: 'Estado del pago' },
      },
    ],
  },

  // ─── CUENTA DE CLIENTE (autenticado) ──────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    component: AccountLayoutComponent,
    children: [
      {
        path: 'account',
        loadComponent: () => import('./features/account/profile/profile').then((m) => m.ProfileComponent),
        data: { title: 'Mi perfil' },
      },
      {
        path: 'account/addresses',
        loadComponent: () => import('./features/account/addresses/addresses').then((m) => m.AddressesComponent),
        data: { title: 'Mis direcciones' },
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders-list').then((m) => m.OrdersListComponent),
        data: { title: 'Mis órdenes' },
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/orders/order-detail').then((m) => m.OrderDetailComponent),
        data: { title: 'Detalle de orden' },
      },
      {
        path: 'invoices',
        loadComponent: () => import('./features/account/invoices/my-invoices').then((m) => m.MyInvoicesComponent),
        data: { title: 'Mis facturas' },
      },
      {
        path: 'reviews/me',
        loadComponent: () => import('./features/reviews/my-reviews').then((m) => m.MyReviewsComponent),
        data: { title: 'Mis reseñas' },
      },
      {
        path: 'wishlists',
        loadComponent: () => import('./features/wishlists/wishlists-list').then((m) => m.WishlistsListComponent),
        data: { title: 'Mis wishlists' },
      },
      {
        path: 'followed-stores',
        loadComponent: () => import('./features/account/followed-stores/followed-stores').then((m) => m.FollowedStoresComponent),
        data: { title: 'Tiendas seguidas' },
      },
      {
        path: 'wishlists/:id',
        loadComponent: () => import('./features/wishlists/wishlist-detail').then((m) => m.WishlistDetailComponent),
        data: { title: 'Wishlist' },
      },
      {
        path: 'become-seller',
        loadComponent: () => import('./features/account/become-seller/become-seller').then((m) => m.BecomeSellerComponent),
        data: { title: 'Convertirme en vendedor' },
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/chat/chat-shell').then((m) => m.ChatShellComponent),
        data: { title: 'Mensajes' },
        children: [
          {
            path: ':id',
            loadComponent: () => import('./features/chat/chat-detail').then((m) => m.ChatDetailComponent),
          },
        ],
      },
    ],
  },

  // ─── PANEL SELLER ──────────────────────────────────────────────────────────
  {
    path: 'seller',
    canActivate: [authGuard, roleGuard('SELLER')],
    component: SellerLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/seller/seller-dashboard').then((m) => m.SellerDashboardComponent),
        data: { title: 'Dashboard' },
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/seller/seller-profile').then((m) => m.SellerProfileComponent),
        data: { title: 'Mi tienda' },
      },
      {
        path: 'accounts',
        loadComponent: () => import('./features/seller/seller-accounts').then((m) => m.SellerAccountsComponent),
        data: { title: 'Cuentas bancarias' },
      },
      {
        path: 'products',
        loadComponent: () => import('./features/seller/seller-products').then((m) => m.SellerProductsComponent),
        data: { title: 'Mis productos' },
      },
      {
        path: 'products/new',
        loadComponent: () => import('./features/seller/seller-product-form').then((m) => m.SellerProductFormComponent),
        data: { title: 'Crear producto' },
      },
      {
        path: 'products/:id/preview',
        loadComponent: () => import('./features/seller/seller-product-preview').then((m) => m.SellerProductPreviewComponent),
        data: { title: 'Vista previa del producto' },
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./features/seller/seller-product-form').then((m) => m.SellerProductFormComponent),
        data: { title: 'Editar producto' },
      },
      {
        path: 'products/:id/inventory',
        loadComponent: () => import('./features/seller/seller-inventory').then((m) => m.SellerInventoryComponent),
        data: { title: 'Inventario' },
      },
      {
        path: 'products/:id/offers',
        loadComponent: () => import('./features/seller/seller-offers').then((m) => m.SellerOffersComponent),
        data: { title: 'Ofertas' },
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/seller/seller-orders').then((m) => m.SellerOrdersComponent),
        data: { title: 'Órdenes recibidas' },
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/seller/seller-analytics').then((m) => m.SellerAnalyticsComponent),
        data: { title: 'Analytics' },
      },
      {
        path: 'product-assistant',
        loadComponent: () =>
          import('./features/seller/product-assistant/seller-assistant.component').then(
            (m) => m.SellerAssistantComponent,
          ),
        data: { title: 'Asistente de producto IA' },
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/chat/chat-shell').then((m) => m.ChatShellComponent),
        data: { title: 'Mensajes' },
        children: [
          {
            path: ':id',
            loadComponent: () => import('./features/chat/chat-detail').then((m) => m.ChatDetailComponent),
          },
        ],
      },
    ],
  },

  // ─── PANEL ADMIN ───────────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/admin/admin-home').then((m) => m.AdminHomeComponent),
        data: { title: 'Panel de administración' },
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/admin-users').then((m) => m.AdminUsersComponent),
        data: { title: 'Gestión de usuarios' },
      },
      {
        path: 'sellers',
        loadComponent: () => import('./features/admin/admin-sellers').then((m) => m.AdminSellersComponent),
        data: { title: 'Gestión de vendedores' },
      },
      {
        path: 'reviews',
        loadComponent: () => import('./features/admin/admin-reviews').then((m) => m.AdminReviewsComponent),
        data: { title: 'Moderación de reseñas' },
      },
      {
        path: 'invoices',
        loadComponent: () => import('./features/admin/admin-invoices').then((m) => m.AdminInvoicesComponent),
        data: { title: 'Facturas' },
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/admin/admin-categories').then((m) => m.AdminCategoriesComponent),
        data: { title: 'Categorías' },
      },
      {
        path: 'brands',
        loadComponent: () => import('./features/admin/admin-brands').then((m) => m.AdminBrandsComponent),
        data: { title: 'Marcas' },
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/admin/admin-analytics').then((m) => m.AdminAnalyticsComponent),
        data: { title: 'Analytics global' },
      },
      {
        path: 'analytics-ai',
        loadComponent: () =>
          import('./features/admin/analytics-dashboard/analytics-dashboard.component').then(
            (m) => m.AnalyticsDashboardComponent,
          ),
        data: { title: 'Analytics IA' },
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/chat/chat-shell').then((m) => m.ChatShellComponent),
        data: { title: 'Mensajes a vendedores' },
        children: [
          {
            path: ':id',
            loadComponent: () => import('./features/chat/chat-detail').then((m) => m.ChatDetailComponent),
          },
        ],
      },
    ],
  },

  // ─── 404 ───────────────────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: notFound,
  },
];
