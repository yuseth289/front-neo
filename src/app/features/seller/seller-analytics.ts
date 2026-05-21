import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { AnalyticsService, SellerDashboard } from '../../core/analytics/analytics.service';

@Component({
  selector: 'app-seller-analytics',
  standalone: true,
  imports: [CommonModule, NgIcon],
  template: `
    <div>
      <h1 class="text-xl font-bold text-text-primary mb-6">Analytics</h1>

      @if (loading()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-24 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (error()) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucideTriangleAlert" size="40" />
          <p>No se pudieron cargar las analíticas.</p>
        </div>
      } @else if (data()) {

        <!-- ── Mes actual vs anterior ───────────────────────────── -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Ingresos este mes</p>
            <p class="text-2xl font-bold text-accent">
              {{ data()!.ingresosEsteMes | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}
            </p>
            <p class="text-xs text-text-muted mt-1">
              Mes anterior: {{ data()!.ingresosMesAnterior | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}
            </p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Órdenes este mes</p>
            <p class="text-2xl font-bold text-text-primary">{{ data()!.ordenesEsteMes }}</p>
            <p class="text-xs text-text-muted mt-1">Mes anterior: {{ data()!.ordenesMesAnterior }}</p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Unidades vendidas</p>
            <p class="text-2xl font-bold text-text-primary">{{ data()!.unidadesVendidasEsteMes }}</p>
            <p class="text-xs text-text-muted mt-1">este mes</p>
          </div>
        </div>

        <!-- ── Totales acumulados ───────────────────────────────── -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Ingresos totales</p>
            <p class="text-xl font-bold text-text-primary">
              {{ data()!.ingresosTotales | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}
            </p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Órdenes totales</p>
            <p class="text-xl font-bold text-text-primary">{{ data()!.ordenesTotales }}</p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-1">Calificación promedio</p>
            <div class="flex items-baseline gap-1">
              <p class="text-xl font-bold text-yellow-400">
                {{ data()!.promedioCalificacion | number:'1.1-1' }}
              </p>
              <p class="text-xs text-text-muted">/ 5</p>
            </div>
            <p class="text-xs text-text-muted mt-1">{{ data()!.totalResenas }} reseñas</p>
          </div>
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs text-text-muted mb-3">Estado de órdenes</p>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span class="text-yellow-400">Pendientes</span>
                <span class="font-medium text-text-primary">{{ data()!.ordenesPendientes }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-blue-400">En preparación</span>
                <span class="font-medium text-text-primary">{{ data()!.ordenesEnPreparacion }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-accent">Enviadas</span>
                <span class="font-medium text-text-primary">{{ data()!.ordenesEnviadas }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Top productos ────────────────────────────────────── -->
        @if (data()!.topProductos.length) {
          <div class="bg-bg-surface border border-border rounded-xl overflow-hidden">
            <div class="px-5 py-4 border-b border-border">
              <h2 class="text-sm font-semibold text-text-primary flex items-center gap-2">
                <ng-icon name="lucideTrendingUp" size="16" class="text-accent" />
                Top productos
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
export class SellerAnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  data = signal<SellerDashboard | null>(null);
  loading = signal(true);
  error = signal(false);

  ngOnInit(): void {
    this.analyticsService.getSellerAnalytics().subscribe({
      next: (res) => { this.data.set(res.data); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }
}
