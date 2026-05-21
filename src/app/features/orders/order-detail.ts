import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { OrderService } from '../../core/account/order.service';
import { ReviewService } from '../../core/catalog/review.service';
import { Order } from '../../shared/models/order.models';
import { OrderStatus, OrderGroupStatus } from '../../shared/models/enums';

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PAYMENT_PENDING: 'Pago pendiente',
  PAYMENT_APPROVED: 'Pago aprobado',
  PAYMENT_REJECTED: 'Pago rechazado',
  PROCESSING: 'En proceso',
  PARTIALLY_SHIPPED: 'Parcialmente enviado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  PAYMENT_PENDING: 'bg-yellow-500/15 text-yellow-400',
  PAYMENT_APPROVED: 'bg-green-500/15 text-green-400',
  PAYMENT_REJECTED: 'bg-red-500/15 text-red-400',
  PROCESSING: 'bg-blue-500/15 text-blue-400',
  PARTIALLY_SHIPPED: 'bg-blue-500/15 text-blue-400',
  SHIPPED: 'bg-blue-500/15 text-blue-400',
  DELIVERED: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
  REFUNDED: 'bg-purple-500/15 text-purple-400',
};

const GROUP_STATUS_LABEL: Record<OrderGroupStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const GROUP_STATUS_CLASS: Record<OrderGroupStatus, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  CONFIRMED: 'bg-blue-500/15 text-blue-400',
  PREPARING: 'bg-blue-500/15 text-blue-400',
  SHIPPED: 'bg-blue-500/15 text-blue-400',
  DELIVERED: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
};

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-3xl">

      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/orders"
          class="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ng-icon name="lucideChevronLeft" size="14" />
          Mis órdenes
        </a>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          <div class="h-20 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          <div class="h-48 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
        </div>
      } @else if (!order()) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucideClipboardX" size="40" />
          <p>Orden no encontrada.</p>
        </div>
      } @else {
        <!-- Encabezado -->
        <div class="bg-bg-surface border border-border rounded-xl p-5 mb-4">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p class="text-xs text-text-muted mb-1">Número de orden</p>
              <p class="text-sm font-mono font-semibold text-text-primary">
                #{{ order()!.id.slice(-8).toUpperCase() }}
              </p>
              <p class="text-xs text-text-muted mt-1">
                {{ order()!.createdAt | date:'d MMMM yyyy, HH:mm':'':'es' }}
              </p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
              [ngClass]="orderStatusClass(order()!.status)">
              {{ orderStatusLabel(order()!.status) }}
            </span>
          </div>
        </div>

        <!-- Grupos de vendedores -->
        @for (group of order()!.groups; track group.id) {
          <div class="bg-bg-surface border border-border rounded-xl p-5 mb-4">
            <div class="flex items-center justify-between gap-3 mb-4">
              <div class="flex items-center gap-2">
                <ng-icon name="lucideStore" size="15" class="text-text-muted" />
                <span class="text-sm text-text-secondary">Vendedor</span>
                <span class="text-xs font-mono text-text-muted">{{ group.sellerId.slice(-8) }}</span>
              </div>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                [ngClass]="groupStatusClass(group.status)">
                {{ groupStatusLabel(group.status) }}
              </span>
            </div>

            @if (group.trackingNumber) {
              <div class="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-bg-elevated border border-border text-sm">
                <ng-icon name="lucideTruck" size="14" class="text-accent shrink-0" />
                <span class="text-text-secondary">Número de seguimiento:</span>
                <span class="font-mono text-text-primary">{{ group.trackingNumber }}</span>
              </div>
            }

            <div class="divide-y divide-border">
              @for (item of group.items; track item.productId) {
                <div class="py-3 first:pt-0 last:pb-0">
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-text-primary truncate">{{ item.productName }}</p>
                      <p class="text-xs text-text-muted">SKU: {{ item.productSku }} · ×{{ item.quantity }}</p>
                    </div>
                    <div class="shrink-0 text-right">
                      <p class="text-sm font-medium text-text-primary">
                        {{ item.subtotal | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                      </p>
                      <p class="text-xs text-text-muted">
                        {{ item.unitPrice | currency:'COP':'symbol-narrow':'1.0-0':'es' }} c/u
                      </p>
                    </div>
                  </div>

                  <!-- Reseña — solo para órdenes DELIVERED -->
                  @if (order()!.status === 'DELIVERED' || order()!.status === 'PAYMENT_APPROVED') {
                    @if (reviewedProducts().has(item.productId)) {
                      <div class="mt-2 flex items-center gap-1.5 text-xs text-green-400">
                        <ng-icon name="lucideCheck" size="12" />
                        Reseña enviada — pendiente de aprobación
                      </div>
                    } @else if (reviewingProductId() === item.productId) {
                      <!-- Formulario inline -->
                      <div class="mt-3 bg-bg-elevated rounded-lg p-4 border border-border">
                        <p class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                          Dejar reseña
                        </p>

                        @if (reviewError()) {
                          <p class="mb-2 text-xs text-error">{{ reviewError() }}</p>
                        }

                        <form [formGroup]="reviewForm" (ngSubmit)="submitReview(item.productId, order()!.id)" novalidate
                          class="flex flex-col gap-3">
                          <!-- Estrellas -->
                          <div class="flex items-center gap-1">
                            @for (star of [1,2,3,4,5]; track star) {
                              <button type="button" (click)="setRating(star)"
                                class="transition-colors">
                                <ng-icon name="lucideStar" size="20"
                                  [class]="star <= reviewForm.value.rating! ? 'text-yellow-400' : 'text-text-muted'" />
                              </button>
                            }
                          </div>

                          <input type="text" formControlName="title" placeholder="Título (opcional)"
                            class="w-full rounded-lg bg-bg-surface border border-border px-3 py-2 text-text-primary text-sm
                                   focus:outline-none focus:border-accent transition-colors" />

                          <textarea formControlName="body" rows="3" placeholder="Cuéntanos tu experiencia..."
                            class="w-full rounded-lg bg-bg-surface border border-border px-3 py-2 text-text-primary text-sm
                                   focus:outline-none focus:border-accent transition-colors resize-none"></textarea>

                          <div class="flex gap-2">
                            <button type="submit" [disabled]="submittingReview()"
                              class="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50
                                     text-white text-xs font-medium transition-colors flex items-center gap-1.5">
                              @if (submittingReview()) {
                                <ng-icon name="lucideRefreshCw" size="11" class="animate-spin" />
                              }
                              Enviar reseña
                            </button>
                            <button type="button" (click)="cancelReview()"
                              class="px-3 py-1.5 rounded-lg border border-border text-text-secondary text-xs transition-colors">
                              Cancelar
                            </button>
                          </div>
                        </form>
                      </div>
                    } @else {
                      <button (click)="startReview(item.productId)"
                        class="mt-2 flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors">
                        <ng-icon name="lucideStar" size="12" />
                        Dejar una reseña
                      </button>
                    }
                  }
                </div>
              }
            </div>

            <div class="flex justify-end pt-3 mt-1 border-t border-border">
              <span class="text-sm text-text-secondary">
                Subtotal:
                <span class="text-text-primary font-semibold ml-1">
                  {{ group.subtotal | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                </span>
              </span>
            </div>
          </div>
        }

        <!-- Resumen de costos + dirección -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div class="bg-bg-surface border border-border rounded-xl p-5">
            <h2 class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <ng-icon name="lucideMapPin" size="13" />
              Dirección de envío
            </h2>
            @if (shippingLabel()) {
              <p class="text-sm font-medium text-text-primary mb-0.5">{{ shippingLabel() }}</p>
            }
            @if (shippingStreet()) {
              <p class="text-sm text-text-secondary">{{ shippingStreet() }}</p>
            }
            @if (shippingCity()) {
              <p class="text-xs text-text-muted mt-0.5">{{ shippingCity() }}</p>
            }
          </div>

          <div class="bg-bg-surface border border-border rounded-xl p-5">
            <h2 class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <ng-icon name="lucideReceipt" size="13" />
              Resumen
            </h2>
            <div class="space-y-1.5 text-sm">
              <div class="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>{{ order()!.subtotal | currency:'COP':'symbol-narrow':'1.0-0':'es' }}</span>
              </div>
              <div class="flex justify-between text-text-secondary">
                <span>Envío</span>
                <span>{{ order()!.shippingCost | currency:'COP':'symbol-narrow':'1.0-0':'es' }}</span>
              </div>
              <div class="flex justify-between font-semibold text-text-primary pt-1.5 border-t border-border">
                <span>Total</span>
                <span>{{ order()!.total | currency:'COP':'symbol-narrow':'1.0-0':'es' }}</span>
              </div>
            </div>
          </div>

        </div>
      }
    </div>
  `,
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private reviewService = inject(ReviewService);
  private fb = inject(FormBuilder);

  order = signal<Order | null>(null);
  loading = signal(true);
  reviewingProductId = signal<string | null>(null);
  reviewedProducts = signal<Set<string>>(new Set());
  submittingReview = signal(false);
  reviewError = signal<string | null>(null);

  reviewForm = this.fb.nonNullable.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    title: [''],
    body: [''],
  });

  orderStatusLabel(s: OrderStatus): string { return ORDER_STATUS_LABEL[s] ?? s; }
  orderStatusClass(s: OrderStatus): string { return ORDER_STATUS_CLASS[s] ?? ''; }
  groupStatusLabel(s: OrderGroupStatus): string { return GROUP_STATUS_LABEL[s] ?? s; }
  groupStatusClass(s: OrderGroupStatus): string { return GROUP_STATUS_CLASS[s] ?? ''; }

  shippingLabel(): string { return String(this.order()?.shippingAddress?.['label'] ?? ''); }
  shippingStreet(): string {
    const a = this.order()?.shippingAddress;
    if (!a) return '';
    const parts = [a['street'], a['number']].filter(Boolean).join(' ');
    return a['apartment'] ? `${parts}, Apto ${a['apartment']}` : parts;
  }
  shippingCity(): string {
    const a = this.order()?.shippingAddress;
    if (!a) return '';
    return [a['city'], a['department'], a['country']].filter(Boolean).join(', ');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.orderService.getOrder(id).subscribe({
      next: (res) => { this.order.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setRating(value: number): void {
    this.reviewForm.patchValue({ rating: value });
  }

  startReview(productId: string): void {
    this.reviewForm.reset({ rating: 5, title: '', body: '' });
    this.reviewError.set(null);
    this.reviewingProductId.set(productId);
  }

  cancelReview(): void {
    this.reviewingProductId.set(null);
  }

  submitReview(productId: string, orderId: string): void {
    if (this.reviewForm.invalid) return;
    this.submittingReview.set(true);
    this.reviewError.set(null);

    const raw = this.reviewForm.getRawValue();
    this.reviewService.create({
      productId,
      orderId,
      rating: raw.rating,
      title: raw.title || undefined,
      body: raw.body || undefined,
    }).subscribe({
      next: () => {
        this.submittingReview.set(false);
        this.reviewingProductId.set(null);
        this.reviewedProducts.update(s => new Set([...s, productId]));
      },
      error: (err) => {
        this.reviewError.set(err.error?.message ?? 'Error al enviar la reseña');
        this.submittingReview.set(false);
      },
    });
  }
}
