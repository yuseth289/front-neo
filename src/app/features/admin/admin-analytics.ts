import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { AnalyticsService, AdminDashboard } from '../../core/analytics/analytics.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, NgIcon],
  template: `
    <div>
      <h1 class="text-xl font-bold text-text-primary mb-6">Analytics global</h1>

      @if (loading()) {
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          @for (_ of [1,2,3,4,5,6]; track $index) {
            <div class="h-24 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (error()) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucideTriangleAlert" size="40" />
          <p>No se pudieron cargar las analíticas.</p>
        </div>
      } @else if (data()) {

        <!-- ── Usuarios & Vendedores ─────────────────────────────── -->
        <h2 class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Usuarios</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Usuarios totales</p>
            <p class="text-2xl font-bold text-text-primary">{{ data()!.totalUsuarios }}</p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Nuevos este mes</p>
            <p class="text-2xl font-bold text-accent">{{ data()!.usuariosNuevosEsteMes }}</p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Vendedores activos</p>
            <p class="text-2xl font-bold text-text-primary">{{ data()!.totalVendedores }}</p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Vendors pendientes</p>
            <p class="text-2xl font-bold text-yellow-400">{{ data()!.vendedoresPendientesAprobacion }}</p>
          </div>
        </div>

        <!-- ── Órdenes ──────────────────────────────────────────── -->
        <h2 class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Órdenes</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Totales</p>
            <p class="text-2xl font-bold text-text-primary">{{ data()!.ordenesTotales }}</p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Este mes</p>
            <p class="text-2xl font-bold text-text-primary">{{ data()!.ordenesEsteMes }}</p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Pendientes</p>
            <p class="text-2xl font-bold text-yellow-400">{{ data()!.ordenesPendientes }}</p>
          </div>
        </div>

        <!-- ── Facturación ───────────────────────────────────────── -->
        <h2 class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Facturación</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Ingresos totales</p>
            <p class="text-2xl font-bold text-accent">
              {{ data()!.ingresosTotales | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}
            </p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Ingresos este mes</p>
            <p class="text-2xl font-bold text-text-primary">
              {{ data()!.ingresosEsteMes | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}
            </p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Comisiones este mes</p>
            <p class="text-2xl font-bold text-text-primary">
              {{ data()!.comisionesEsteMes | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}
            </p>
          </div>
        </div>

        <!-- ── Pagos ─────────────────────────────────────────────── -->
        <h2 class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Pagos este mes</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Pagos aprobados</p>
            <p class="text-2xl font-bold text-green-400">{{ data()!.pagosAprobadosEsteMes }}</p>
            <p class="text-xs text-text-muted mt-1">
              {{ data()!.montoAprobadoEsteMes | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}
            </p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Pagos rechazados</p>
            <p class="text-2xl font-bold text-error">{{ data()!.pagosRechazadosEsteMes }}</p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Catálogo activo</p>
            <p class="text-2xl font-bold text-text-primary">{{ data()!.totalProductosActivos }}</p>
            @if (data()!.productosPendientesRevision > 0) {
              <p class="text-xs text-yellow-400 mt-1">
                {{ data()!.productosPendientesRevision }} en revisión
              </p>
            }
          </div>
        </div>

        <!-- ── Top productos globales ────────────────────────────── -->
        @if (data()!.topProductos.length) {
          <div class="bg-bg-surface border border-border rounded-xl overflow-hidden">
            <div class="px-5 py-4 border-b border-border">
              <h2 class="text-sm font-semibold text-text-primary flex items-center gap-2">
                <ng-icon name="lucideTrendingUp" size="16" class="text-accent" />
                Top productos globales
              </h2>
            </div>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-left bg-bg-elevated">
                  <th class="px-4 py-3 text-xs text-text-muted font-medium">Producto</th>
                  <th class="px-4 py-3 text-xs text-text-muted font-medium text-right">Unidades</th>
                  <th class="px-4 py-3 text-xs text-text-muted font-medium text-right hidden sm:table-cell">Órdenes</th>
                  <th class="px-4 py-3 text-xs text-text-muted font-medium text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                @for (p of data()!.topProductos; track p.productId) {
                  <tr class="hover:bg-bg-elevated transition-colors">
                    <td class="px-4 py-3 text-text-primary">{{ p.productName }}</td>
                    <td class="px-4 py-3 text-right text-text-secondary">{{ p.unidadesVendidas }}</td>
                    <td class="px-4 py-3 text-right text-text-secondary hidden sm:table-cell">{{ p.ordenes }}</td>
                    <td class="px-4 py-3 text-right font-medium text-text-primary">
                      {{ p.ingresosTotales | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

      }
    </div>
  `,
})
export class AdminAnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  data = signal<AdminDashboard | null>(null);
  loading = signal(true);
  error = signal(false);

  ngOnInit(): void {
    this.analyticsService.getAdminAnalytics().subscribe({
      next: (res) => { this.data.set(res.data); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }
}
