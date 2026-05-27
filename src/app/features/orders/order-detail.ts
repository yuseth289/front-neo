import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { OrderService } from '../../core/account/order.service';
import { ReviewService } from '../../core/catalog/review.service';
import { Order } from '../../shared/models/order.models';
import { OrderStatus, OrderGroupStatus } from '../../shared/models/enums';

type StatusMeta = { label: string; color: string; bg: string; border: string; icon: string };

const ORDER_STATUS_MAP: Record<OrderStatus, StatusMeta> = {
  PENDING:           { label: 'Pendiente',             color: 'var(--color-warning)',     bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  icon: 'lucideClipboardList' },
  PAYMENT_PENDING:   { label: 'Pago pendiente',         color: 'var(--color-warning)',     bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  icon: 'lucideCreditCard'    },
  PAYMENT_APPROVED:  { label: 'Pago aprobado',          color: 'var(--color-success)',     bg: 'rgba(0,200,120,0.08)',   border: 'rgba(0,200,120,0.25)',   icon: 'lucideCheck'         },
  PAYMENT_REJECTED:  { label: 'Pago rechazado',         color: 'var(--color-error)',       bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   icon: 'lucideX'             },
  PROCESSING:        { label: 'En proceso',             color: 'var(--color-neon-cyan)',   bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.22)',   icon: 'lucideRefreshCw'     },
  PARTIALLY_SHIPPED: { label: 'Parcialmente enviado',   color: 'var(--color-neon-cyan)',   bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.22)',   icon: 'lucideTruck'         },
  SHIPPED:           { label: 'Enviado',                color: '#818cf8',                  bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.25)', icon: 'lucideTruck'         },
  DELIVERED:         { label: 'Entregado',              color: 'var(--color-success)',     bg: 'rgba(0,200,120,0.08)',   border: 'rgba(0,200,120,0.25)',   icon: 'lucideCircleCheck'   },
  CANCELLED:         { label: 'Cancelado',              color: 'var(--color-error)',       bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   icon: 'lucideX'             },
  REFUNDED:          { label: 'Reembolsado',            color: 'var(--color-text-muted)',  bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.22)', icon: 'lucideReceipt'       },
};

const GROUP_STATUS_MAP: Record<OrderGroupStatus, StatusMeta> = {
  PENDING:   { label: 'Pendiente',   color: 'var(--color-warning)',   bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  icon: 'lucideClipboardList' },
  CONFIRMED: { label: 'Confirmado',  color: 'var(--color-neon-cyan)', bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.22)',   icon: 'lucideCheck'         },
  PREPARING: { label: 'Preparando',  color: 'var(--color-neon-cyan)', bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.22)',   icon: 'lucidePackage'       },
  SHIPPED:   { label: 'Enviado',     color: '#818cf8',                bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.25)', icon: 'lucideTruck'         },
  DELIVERED: { label: 'Entregado',   color: 'var(--color-success)',   bg: 'rgba(0,200,120,0.08)',   border: 'rgba(0,200,120,0.25)',   icon: 'lucideCircleCheck'   },
  CANCELLED: { label: 'Cancelado',   color: 'var(--color-error)',     bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   icon: 'lucideX'             },
};

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon, CopCurrencyPipe],
  template: `
    <div class="relative">

      <!-- Ambient backdrop -->
      <div class="neo-grid-bg pointer-events-none absolute inset-0 opacity-30 rounded-3xl"></div>
      <div class="pointer-events-none absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full"
           style="background: radial-gradient(circle, var(--color-accent) 0%, transparent 70%); opacity: 0.04"></div>
      <div class="pointer-events-none absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full"
           style="background: radial-gradient(circle, var(--color-neon-cyan) 0%, transparent 70%); opacity: 0.03"></div>

      <div class="relative max-w-3xl">

        <!-- Breadcrumb -->
        <a routerLink="/orders"
          class="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary transition-colors mb-5">
          <ng-icon name="lucideChevronLeft" size="13" />
          Mis órdenes
        </a>

        <!-- Loading -->
        @if (loading()) {
          <div class="flex flex-col gap-4">
            <div class="h-24 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
            <div class="h-52 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
            <div class="h-36 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
          </div>

        <!-- Not found -->
        } @else if (!order()) {
          <div class="neo-card-premium p-14 flex flex-col items-center gap-4 text-center neo-reveal">
            <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
              <ng-icon name="lucideClipboardX" size="26" class="text-text-muted" />
            </div>
            <p class="text-base font-semibold text-text-primary">Orden no encontrada</p>
            <a routerLink="/orders" class="neo-btn-outline !text-[13px] !py-2 !px-4">
              <ng-icon name="lucideChevronLeft" size="13" />
              Volver a mis órdenes
            </a>
          </div>

        <!-- Order found -->
        } @else {

          <!-- ── Encabezado ──────────────────────────────────── -->
          <div class="neo-card-premium overflow-hidden mb-4 neo-reveal">
            <div class="h-[3px] w-full"
                 style="background: linear-gradient(90deg, var(--color-accent), var(--color-neon-cyan), var(--color-success))"></div>
            <div class="p-5">
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="flex items-center gap-3.5">
                  <div class="w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0"
                       style="background: rgba(100,93,255,0.08); border-color: rgba(100,93,255,0.25)">
                    <ng-icon name="lucideReceipt" size="18" style="color: var(--color-accent)" />
                  </div>
                  <div>
                    <p class="neo-stat-label">Detalle de orden</p>
                    <p class="font-display text-[22px] font-bold tracking-[-0.02em] text-text-primary mt-0.5 font-mono">
                      #{{ order()!.id.slice(-8).toUpperCase() }}
                    </p>
                    <p class="text-[12px] text-text-muted mt-0.5">
                      {{ order()!.createdAt | date:'d MMMM yyyy, HH:mm':'':'es' }}
                    </p>
                  </div>
                </div>
                <span class="flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full border self-start"
                  [style.color]="orderStatusMeta(order()!.status).color"
                  [style.background]="orderStatusMeta(order()!.status).bg"
                  [style.border-color]="orderStatusMeta(order()!.status).border">
                  <ng-icon [name]="orderStatusMeta(order()!.status).icon" size="11" />
                  {{ orderStatusMeta(order()!.status).label }}
                </span>
              </div>
            </div>
          </div>

          <!-- ── Grupos de vendedores ────────────────────────── -->
          @for (group of order()!.groups; track group.id; let gi = $index) {
            <div class="neo-card-premium overflow-hidden mb-4 neo-reveal"
                 [style.animation-delay]="(gi + 1) * 60 + 'ms'">

              <!-- Group header -->
              <div class="px-5 pt-4 pb-4 border-b border-border"
                   style="background: var(--color-bg-subtle)">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0"
                         style="background: rgba(100,93,255,0.08); border-color: rgba(100,93,255,0.2)">
                      <ng-icon name="lucideStore" size="14" style="color: var(--color-accent)" />
                    </div>
                    <div>
                      <p class="text-[13px] font-semibold text-text-primary leading-none">Vendedor</p>
                      <p class="text-[11px] font-mono text-text-muted mt-0.5">{{ group.sellerId.slice(-8).toUpperCase() }}</p>
                    </div>
                  </div>
                  <span class="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                    [style.color]="groupStatusMeta(group.status).color"
                    [style.background]="groupStatusMeta(group.status).bg"
                    [style.border-color]="groupStatusMeta(group.status).border">
                    <ng-icon [name]="groupStatusMeta(group.status).icon" size="11" />
                    {{ groupStatusMeta(group.status).label }}
                  </span>
                </div>

                @if (group.trackingNumber) {
                  <div class="mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] border"
                       style="background: rgba(0,212,255,0.05); border-color: rgba(0,212,255,0.2)">
                    <ng-icon name="lucideTruck" size="13" style="color: var(--color-neon-cyan)" class="shrink-0" />
                    <span class="text-[12px] text-text-muted">Seguimiento:</span>
                    <span class="font-mono text-[12px] font-semibold"
                          style="color: var(--color-neon-cyan)">{{ group.trackingNumber }}</span>
                  </div>
                }
              </div>

              <!-- Items -->
              <div class="px-5">
                @for (item of group.items; track item.productId; let last = $last) {
                  <div class="py-4" [class.border-b]="!last" [class.border-border]="!last">

                    <!-- Item row -->
                    <div class="flex items-start justify-between gap-3 mb-2">
                      <div class="flex-1 min-w-0">
                        <p class="text-[13px] text-text-primary font-semibold truncate">{{ item.productName }}</p>
                        <p class="text-[12px] text-text-muted font-mono mt-0.5">
                          {{ item.productSku }} · ×{{ item.quantity }}
                        </p>
                      </div>
                      <div class="shrink-0 text-right">
                        <p class="text-[13px] font-bold text-text-primary tabular-nums">
                          {{ item.subtotal | copCurrency }}
                        </p>
                        <p class="text-[11px] text-text-muted tabular-nums">
                          {{ item.unitPrice | copCurrency }} c/u
                        </p>
                      </div>
                    </div>

                    <!-- Review section — only for delivered orders -->
                    @if (order()!.status === 'DELIVERED') {
                      @if (reviewedProducts().has(item.productId)) {
                        <div class="flex items-center gap-2 text-[12px] mt-1 px-3 py-2 rounded-[8px]"
                             style="background: rgba(0,200,120,0.06); color: var(--color-success)">
                          <ng-icon name="lucideCheck" size="12" />
                          Reseña enviada — pendiente de aprobación
                        </div>

                      } @else if (reviewingProductId() === item.productId) {
                        <!-- Review form -->
                        <div class="mt-1 rounded-xl border overflow-hidden"
                             style="background: var(--color-bg-elevated); border-color: rgba(100,93,255,0.2)">
                          <div class="px-4 pt-3.5 pb-1 border-b"
                               style="border-color: var(--color-border)">
                            <p class="text-[11px] font-mono uppercase tracking-wider"
                               style="color: var(--color-accent)">Dejar reseña</p>
                          </div>
                          <div class="p-4">
                            @if (reviewError()) {
                              <div class="mb-3 flex items-center gap-2 text-[12px] px-3 py-2 rounded-[8px]"
                                   style="background: rgba(239,68,68,0.08); color: var(--color-error); border: 1px solid rgba(239,68,68,0.2)">
                                <ng-icon name="lucideTriangleAlert" size="11" />
                                {{ reviewError() }}
                              </div>
                            }
                            <form [formGroup]="reviewForm"
                              (ngSubmit)="submitReview(item.productId, order()!.id)" novalidate
                              class="flex flex-col gap-3">

                              <!-- Star rating -->
                              <div>
                                <p class="text-[11px] text-text-muted mb-2">Calificación</p>
                                <div class="flex items-center gap-1">
                                  @for (star of [1,2,3,4,5]; track star) {
                                    <button type="button"
                                      (click)="setRating(star)"
                                      (mouseenter)="hoverRating.set(star)"
                                      (mouseleave)="hoverRating.set(0)"
                                      class="p-0.5 transition-transform hover:scale-110 focus:outline-none">
                                      <ng-icon name="lucideStar" size="24"
                                        [style.color]="star <= (hoverRating() || reviewForm.value.rating || 5) ? '#FBBF24' : 'var(--color-text-muted)'"
                                        [style.filter]="star <= (hoverRating() || reviewForm.value.rating || 5) ? 'drop-shadow(0 0 5px rgba(251,191,36,0.55))' : 'none'"
                                        class="transition-all duration-100" />
                                    </button>
                                  }
                                  <span class="ml-2 text-[12px] font-mono text-text-muted">
                                    {{ hoverRating() || reviewForm.value.rating || 5 }} / 5
                                  </span>
                                </div>
                              </div>

                              <input type="text" formControlName="title"
                                placeholder="Título (opcional)"
                                class="w-full rounded-[10px] border px-3.5 py-2.5 text-sm text-text-primary
                                       placeholder:text-text-muted outline-none transition-all
                                       focus:ring-2 focus:ring-accent/20 focus:border-accent/50"
                                style="background: var(--color-bg-elevated); border-color: var(--color-border)" />

                              <textarea formControlName="body" rows="3"
                                placeholder="Cuéntanos tu experiencia con este producto..."
                                class="w-full rounded-[10px] border px-3.5 py-2.5 text-sm text-text-primary
                                       placeholder:text-text-muted outline-none transition-all resize-none
                                       focus:ring-2 focus:ring-accent/20 focus:border-accent/50"
                                style="background: var(--color-bg-elevated); border-color: var(--color-border)"
                              ></textarea>

                              <div class="flex gap-2 pt-1">
                                <button type="submit" [disabled]="submittingReview()"
                                  class="neo-btn-primary !text-[12px] !py-2 !px-4 disabled:opacity-50">
                                  @if (submittingReview()) {
                                    <ng-icon name="lucideRefreshCw" size="11" class="neo-spin" />
                                  }
                                  Enviar reseña
                                </button>
                                <button type="button" (click)="cancelReview()"
                                  class="neo-btn-outline !text-[12px] !py-2 !px-3">
                                  Cancelar
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>

                      } @else {
                        <button (click)="startReview(item.productId)"
                          class="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-accent
                                 transition-colors mt-1 group/rev">
                          <ng-icon name="lucideStar" size="12" class="group-hover/rev:text-accent transition-colors" />
                          Dejar una reseña
                        </button>
                      }
                    }
                  </div>
                }
              </div>

              <!-- Group subtotal footer -->
              <div class="px-5 py-3 border-t border-border flex justify-between items-center"
                   style="background: var(--color-bg-subtle)">
                <span class="text-[12px] text-text-muted">Subtotal del vendedor</span>
                <span class="text-[13px] font-bold text-text-primary tabular-nums">
                  {{ group.subtotal | copCurrency }}
                </span>
              </div>
            </div>
          }

          <!-- ── Resumen + Dirección ────────────────────────── -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 neo-reveal"
               [style.animation-delay]="(order()!.groups.length + 1) * 60 + 'ms'">

            <!-- Shipping address -->
            <div class="neo-card-premium p-5">
              <p class="text-[11px] font-mono uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
                <ng-icon name="lucideMapPin" size="11" />
                Dirección de envío
              </p>
              @if (shippingLabel()) {
                <p class="text-[13px] font-semibold text-text-primary">{{ shippingLabel() }}</p>
              }
              @if (shippingStreet()) {
                <p class="text-[13px] text-text-secondary mt-0.5">{{ shippingStreet() }}</p>
              }
              @if (shippingCity()) {
                <p class="text-[12px] text-text-muted mt-0.5">{{ shippingCity() }}</p>
              }
              @if (!shippingLabel() && !shippingStreet()) {
                <p class="text-[13px] text-text-muted italic">No especificada</p>
              }
            </div>

            <!-- Payment summary -->
            <div class="neo-card-premium p-5">
              <p class="text-[11px] font-mono uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
                <ng-icon name="lucideReceipt" size="11" />
                Resumen de pago
              </p>
              <div class="flex flex-col gap-2 text-[13px]">
                <div class="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span class="tabular-nums">{{ order()!.subtotal | copCurrency }}</span>
                </div>
                <div class="flex justify-between text-text-secondary">
                  <span>Envío</span>
                  <span class="tabular-nums">{{ order()!.shippingCost | copCurrency }}</span>
                </div>
                <div class="flex justify-between font-bold text-text-primary pt-2 mt-1 border-t border-border">
                  <span>Total</span>
                  <span class="tabular-nums text-[15px]">{{ order()!.total | copCurrency }}</span>
                </div>
              </div>
            </div>

          </div>
        }

      </div>
    </div>
  `,
})
export class OrderDetailComponent implements OnInit {
  private route         = inject(ActivatedRoute);
  private orderService  = inject(OrderService);
  private reviewService = inject(ReviewService);
  private fb            = inject(FormBuilder);

  order              = signal<Order | null>(null);
  loading            = signal(true);
  reviewingProductId = signal<string | null>(null);
  reviewedProducts   = signal<Set<string>>(new Set());
  submittingReview   = signal(false);
  reviewError        = signal<string | null>(null);
  hoverRating        = signal(0);

  reviewForm = this.fb.nonNullable.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    title:  [''],
    body:   [''],
  });

  orderStatusMeta(s: OrderStatus): StatusMeta      { return ORDER_STATUS_MAP[s] ?? ORDER_STATUS_MAP.PENDING; }
  groupStatusMeta(s: OrderGroupStatus): StatusMeta { return GROUP_STATUS_MAP[s] ?? GROUP_STATUS_MAP.PENDING; }

  shippingLabel(): string {
    return String(this.order()?.shippingAddress?.['label'] ?? '');
  }
  shippingStreet(): string {
    const a = this.order()?.shippingAddress;
    if (!a) return '';
    const base = [a['street'], a['number']].filter(Boolean).join(' ');
    return a['apartment'] ? `${base}, Apto ${a['apartment']}` : base;
  }
  shippingCity(): string {
    const a = this.order()?.shippingAddress;
    if (!a) return '';
    return [a['city'], a['department'], a['country']].filter(Boolean).join(', ');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.orderService.getOrder(id).subscribe({
      next:  (res) => { this.order.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setRating(value: number): void { this.reviewForm.patchValue({ rating: value }); }

  startReview(productId: string): void {
    this.reviewForm.reset({ rating: 5, title: '', body: '' });
    this.reviewError.set(null);
    this.hoverRating.set(0);
    this.reviewingProductId.set(productId);
  }

  cancelReview(): void { this.reviewingProductId.set(null); this.hoverRating.set(0); }

  submitReview(productId: string, orderId: string): void {
    if (this.reviewForm.invalid) return;
    this.submittingReview.set(true);
    this.reviewError.set(null);

    const raw = this.reviewForm.getRawValue();
    this.reviewService.create({
      productId,
      orderId,
      rating: raw.rating,
      title:  raw.title  || undefined,
      body:   raw.body   || undefined,
    }).subscribe({
      next: () => {
        this.submittingReview.set(false);
        this.reviewingProductId.set(null);
        this.hoverRating.set(0);
        this.reviewedProducts.update(s => new Set([...s, productId]));
      },
      error: (err) => {
        this.reviewError.set(err.error?.message ?? 'Error al enviar la reseña');
        this.submittingReview.set(false);
      },
    });
  }
}
