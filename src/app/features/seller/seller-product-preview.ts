import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { SellerProductService } from '../../core/seller/seller-product.service';
import { ProductResponse, InventoryResponse } from '../../shared/models/product.models';

@Component({
  selector: 'app-seller-product-preview',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, CopCurrencyPipe],
  template: `
    <div class="relative">
      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-20"></div>
        <span class="neo-orb red"  style="width:500px;height:500px;top:-15%;right:-8%;opacity:0.09;"></span>
        <span class="neo-orb cyan" style="width:360px;height:360px;bottom:5%;left:-5%;opacity:0.07;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-[1160px] mx-auto">

        <!-- Breadcrumb + header -->
        <div class="neo-reveal mb-7">
          <div class="flex items-center gap-1.5 text-xs text-text-muted mb-3">
            <a routerLink="/seller/dashboard" class="hover:text-text-primary transition-colors">Seller</a>
            <ng-icon name="lucideChevronRight" size="11" />
            <a routerLink="/seller/products" class="hover:text-text-primary transition-colors">Productos</a>
            <ng-icon name="lucideChevronRight" size="11" />
            <span class="text-text-secondary font-medium">Paso final</span>
          </div>
          <p class="neo-stat-label">Paso Final</p>
          <h1 class="font-display text-[30px] font-bold tracking-[-0.02em] text-text-primary mt-1">
            Vista previa del producto
          </h1>
          <p class="text-[13px] text-text-muted mt-1.5">
            Verifica que toda la información técnica y visual sea correcta antes de lanzar tu producto al mercado.
          </p>
        </div>

        @if (loading()) {
          <div class="flex flex-col gap-4">
            @for (_ of [1,2,3]; track $index) {
              <div class="h-36 rounded-xl bg-bg-elevated animate-pulse"></div>
            }
          </div>
        } @else if (product()) {
          <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

            <!-- ══ LEFT COLUMN ══════════════════════════════════════════ -->
            <div class="flex flex-col gap-4">

              <!-- Product preview card -->
              <div class="neo-card-premium overflow-hidden">
                <!-- label bar -->
                <div class="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-border">
                  <div class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                  <p class="text-[12px] font-semibold text-text-secondary tracking-[0.04em]">
                    Vista previa de tu publicación
                  </p>
                </div>

                <div class="p-5">
                  <div class="flex gap-5 flex-wrap sm:flex-nowrap">

                    <!-- Images column -->
                    <div class="flex flex-col gap-2.5 shrink-0 w-full sm:w-[200px]">
                      <!-- Main image -->
                      <div class="rounded-[12px] overflow-hidden bg-bg-elevated aspect-square border border-border">
                        @if (activeImage()) {
                          <img [src]="activeImage()" alt="" class="w-full h-full object-cover" />
                        } @else {
                          <div class="w-full h-full flex items-center justify-center text-text-muted">
                            <ng-icon name="lucideImage" size="36" />
                          </div>
                        }
                      </div>
                      <!-- Thumbnails -->
                      <div class="grid grid-cols-4 gap-1.5">
                        @if (product()!.images.length > 0) {
                          @for (img of product()!.images.slice(0, 4); track img.id; let i = $index) {
                            <div class="aspect-square rounded-[6px] overflow-hidden bg-bg-elevated cursor-pointer transition-all"
                                 [style.border]="activeImgIdx() === i ? '2px solid var(--color-accent)' : '1px solid var(--color-border)'"
                                 [style.opacity]="activeImgIdx() === i ? '1' : '0.65'"
                                 (click)="activeImgIdx.set(i)">
                              <img [src]="img.url" alt="" class="w-full h-full object-cover" />
                            </div>
                          }
                          @if (product()!.images.length < 4) {
                            @for (_ of emptyThumbSlots(); track $index) {
                              <div class="aspect-square rounded-[6px] bg-bg-elevated border border-dashed border-border opacity-40"></div>
                            }
                          }
                        } @else {
                          @for (_ of [0,1,2,3]; track $index) {
                            <div class="aspect-square rounded-[6px] bg-bg-elevated border border-dashed border-border opacity-40"></div>
                          }
                        }
                      </div>
                    </div>

                    <!-- Product details -->
                    <div class="flex-1 min-w-0">
                      <!-- Condition badge -->
                      @if (product()!.condition) {
                        <div class="mb-2">
                          <span class="text-[10px] font-bold px-2.5 py-1 rounded-full"
                            [style.background]="conditionBg()" [style.color]="conditionColor()">
                            {{ product()!.condition }}
                          </span>
                        </div>
                      }

                      <h2 class="font-display text-[18px] font-bold text-text-primary leading-snug mb-2">
                        {{ product()!.name }}
                      </h2>

                      <!-- Price -->
                      <div class="flex items-baseline gap-2 mb-3">
                        <span class="font-display text-[22px] font-bold text-accent">
                          {{ finalPrice() | copCurrency }}
                        </span>
                        @if (product()!.ivaPercent > 0) {
                          <span class="text-[11px] text-text-muted line-through font-mono">
                            {{ product()!.basePrice | copCurrency }}
                          </span>
                          <span class="text-[10px] font-semibold text-text-muted">COP</span>
                        }
                      </div>

                      <!-- Category/condition tags -->
                      <div class="flex flex-wrap gap-1.5 mb-4">
                        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
                          Gaming
                        </span>
                        @if (product()!.condition) {
                          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
                            {{ product()!.condition }}
                          </span>
                        }
                      </div>

                      <!-- Specs table -->
                      <div class="flex flex-col divide-y divide-border/50">
                        <div class="flex items-center gap-3 py-2 text-[13px]">
                          <span class="text-text-muted w-28 shrink-0">Marca:</span>
                          <span class="text-text-primary font-semibold">{{ product()!.brand }}</span>
                        </div>
                        <div class="flex items-center gap-3 py-2 text-[13px]">
                          <span class="text-text-muted w-28 shrink-0">Modelo:</span>
                          <span class="text-text-secondary font-mono text-[12px]">{{ product()!.sku }}</span>
                        </div>
                        @if (inventory()) {
                          <div class="flex items-center gap-3 py-2 text-[13px]">
                            <span class="text-text-muted w-28 shrink-0">Disponibilidad:</span>
                            @if (inventory()!.availableStock > 0) {
                              <span class="text-success font-semibold">En stock</span>
                            } @else {
                              <span class="text-error font-semibold">Sin stock</span>
                            }
                          </div>
                          <div class="flex items-center gap-3 py-2 text-[13px]">
                            <span class="text-text-muted w-28 shrink-0">Cantidad:</span>
                            <span class="text-text-primary">{{ inventory()!.availableStock }} unidades</span>
                          </div>
                        }
                        <div class="flex items-center gap-3 py-2 text-[13px]">
                          <span class="text-text-muted w-28 shrink-0">Envío:</span>
                          <span class="text-success flex items-center gap-1 font-semibold">
                            <ng-icon name="lucideTruck" size="12" />Gratis
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div class="neo-card-premium p-5">
                <h3 class="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted mb-3 flex items-center gap-2 font-mono">
                  <ng-icon name="lucideFileText" size="13" class="text-accent" />
                  Descripción del producto
                </h3>
                <p class="text-[13px] text-text-secondary leading-[1.7] whitespace-pre-line">
                  {{ product()!.description || '—' }}
                </p>
              </div>

              <!-- Bottom actions -->
              <div class="flex items-center gap-3 pb-6">
                <a [routerLink]="['/seller/products', product()!.id]"
                   class="neo-btn-outline !py-3 !px-6 text-[13px] flex items-center gap-2">
                  <ng-icon name="lucidePencil" size="13" />
                  Editar publicación
                </a>
                <a routerLink="/seller/products"
                   class="text-[12px] text-text-muted hover:text-text-secondary transition-colors">
                  Ver todos mis productos
                </a>
              </div>
            </div><!-- /left -->

            <!-- ══ RIGHT COLUMN — Estado de publicación ═════════════════ -->
            <div class="flex flex-col gap-4" style="position:sticky;top:88px;">

              <!-- Status panel -->
              <div class="neo-card-premium overflow-hidden">
                <!-- header -->
                <div class="relative px-5 pt-5 pb-5 border-b border-border overflow-hidden">
                  <div class="absolute inset-0 pointer-events-none"
                    style="background:radial-gradient(ellipse at 70% -20%,rgba(255,0,60,0.1),transparent 60%);"></div>
                  <div class="relative flex items-center gap-2.5 mb-4">
                    <div class="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
                      <ng-icon name="lucideRocket" size="15" class="text-accent" />
                    </div>
                    <p class="text-[13px] font-semibold text-text-primary">Estado de Publicación</p>
                  </div>
                  <!-- Progress -->
                  <div class="relative">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-[11px] font-mono text-text-muted">Progreso del producto</p>
                      <p class="text-[14px] font-bold font-mono"
                        [style.color]="progress() >= 75 ? 'var(--color-success)' : progress() >= 50 ? 'var(--color-warning)' : 'var(--color-error)'">
                        {{ progress() }}%
                      </p>
                    </div>
                    <div class="h-2 rounded-full bg-bg-elevated overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-700 ease-out"
                        [style.width]="progress() + '%'"
                        [style.background]="progress() >= 75 ? 'var(--color-success)' : progress() >= 50 ? 'var(--color-warning)' : 'var(--color-error)'">
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Checklist -->
                <div class="p-4 flex flex-col gap-0.5 border-b border-border">
                  @for (item of checklist(); track $index) {
                    <div class="flex gap-3 py-2.5 px-2 rounded-[8px] transition-colors"
                      [style.background]="item.ok ? 'rgba(0,200,120,0.04)' : 'transparent'">
                      <div class="w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center mt-0.5"
                        [style.background]="item.ok ? 'var(--color-success)' : 'var(--color-bg-elevated)'"
                        [style.border]="item.ok ? 'none' : '1px solid var(--color-border)'">
                        @if (item.ok) { <ng-icon name="lucideCheck" size="9" class="text-bg-base" /> }
                      </div>
                      <div>
                        <p class="text-[12px] font-semibold leading-tight"
                          [style.color]="item.ok ? 'var(--color-text-primary)' : 'var(--color-text-muted)'">
                          {{ item.label }}
                        </p>
                        <p class="text-[11px] mt-0.5"
                          [style.color]="item.ok ? 'var(--color-text-muted)' : 'var(--color-text-dim)'">
                          {{ item.hint }}
                        </p>
                      </div>
                    </div>
                  }
                </div>

                <!-- Action buttons -->
                <div class="p-4 flex flex-col gap-2">
                  @if (product()!.status === 'ACTIVE') {
                    <div class="flex items-center gap-2 rounded-[10px] px-3 py-3 bg-success/10
                                border border-success/20 text-success text-[12px] font-semibold">
                      <ng-icon name="lucideCircleCheck" size="14" />
                      Producto publicado y activo
                    </div>
                    <button type="button" (click)="doPause()" [disabled]="actioning()"
                      class="w-full py-2.5 rounded-[10px] text-[13px] font-semibold border border-border
                             text-text-secondary hover:bg-bg-elevated transition-colors disabled:opacity-40">
                      Pausar publicación
                    </button>
                  } @else {
                    <button type="button" (click)="doPublish()" [disabled]="actioning() || progress() < 50"
                      class="neo-btn-primary w-full !py-3 disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2 text-[13px]">
                      @if (actioning()) {
                        <ng-icon name="lucideRefreshCw" size="13" class="animate-spin" />
                        Publicando…
                      } @else {
                        <ng-icon name="lucideRocket" size="13" />
                        Publicar Producto
                        <ng-icon name="lucideArrowRight" size="12" />
                      }
                    </button>
                    <button type="button"
                      class="w-full py-2.5 rounded-[10px] text-[13px] font-semibold border border-border
                             text-text-secondary hover:bg-bg-elevated transition-colors">
                      Guardar Borrador
                    </button>
                  }

                  @if (actionError()) {
                    <p class="text-xs text-error flex items-center gap-1.5 mt-1">
                      <ng-icon name="lucideTriangleAlert" size="11" />{{ actionError() }}
                    </p>
                  }
                  @if (actionSuccess()) {
                    <p class="text-xs text-success flex items-center gap-1.5 mt-1">
                      <ng-icon name="lucideCircleCheck" size="11" />¡Producto publicado exitosamente!
                    </p>
                  }
                </div>
              </div>

            </div><!-- /right -->

          </div>
        }
      </div>
    </div>
  `,
})
export class SellerProductPreviewComponent implements OnInit {
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private productService = inject(SellerProductService);

  product   = signal<ProductResponse | null>(null);
  inventory = signal<InventoryResponse | null>(null);
  loading   = signal(true);
  actioning = signal(false);
  actionError   = signal<string | null>(null);
  actionSuccess = signal(false);
  activeImgIdx  = signal(0);

  activeImage = computed(() => {
    const imgs = this.product()?.images ?? [];
    if (imgs.length === 0) return null;
    return imgs[this.activeImgIdx()]?.url ?? imgs[0]?.url;
  });

  emptyThumbSlots = computed(() =>
    Array(Math.max(0, 4 - (this.product()?.images.length ?? 0))).fill(0),
  );

  finalPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    return Math.round(p.basePrice * (1 + p.ivaPercent / 100));
  });

  conditionColor = computed(() => {
    switch (this.product()?.condition) {
      case 'NUEVO':           return '#00C878';
      case 'USADO':           return '#F59E0B';
      case 'REACONDICIONADO': return '#00D4FF';
      default: return 'var(--color-text-muted)';
    }
  });

  conditionBg = computed(() => {
    switch (this.product()?.condition) {
      case 'NUEVO':           return 'rgba(0,200,120,0.12)';
      case 'USADO':           return 'rgba(245,158,11,0.12)';
      case 'REACONDICIONADO': return 'rgba(0,212,255,0.12)';
      default: return 'var(--color-bg-elevated)';
    }
  });

  checklist = computed(() => {
    const p = this.product();
    if (!p) return [];
    const imgCount = p.images?.length ?? 0;
    return [
      {
        ok: imgCount > 0,
        label: 'Imágenes',
        hint: imgCount > 0
          ? `${imgCount} imagen${imgCount > 1 ? 'es' : ''} subida${imgCount > 1 ? 's' : ''} correctamente`
          : 'Agrega al menos 1 imagen',
      },
      {
        ok: !!(p.name && p.brand && p.categoryId),
        label: 'Información básica',
        hint: 'Título, categoría, modelo y marca',
      },
      {
        ok: (p.description?.length ?? 0) >= 20,
        label: 'Descripción',
        hint: (p.description?.length ?? 0) >= 20
          ? 'Descripción del producto completo'
          : 'Descripción muy corta (mín. 20 caracteres)',
      },
      {
        ok: p.basePrice > 0,
        label: 'Precio',
        hint: p.basePrice > 0 ? 'Precio definido correctamente' : 'Define el precio base',
      },
    ];
  });

  progress = computed(() => {
    const items = this.checklist();
    if (!items.length) return 0;
    return Math.round((items.filter(i => i.ok).length / items.length) * 100);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.productService.getProduct(id).subscribe({
      next: (res) => {
        this.product.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/seller/products']);
      },
    });

    this.productService.getInventory(id).subscribe({
      next: (res) => this.inventory.set(res.data),
      error: () => {},
    });
  }

  doPublish(): void {
    const id = this.product()?.id;
    if (!id) return;
    this.actioning.set(true);
    this.actionError.set(null);
    this.productService.publish(id).subscribe({
      next: () => {
        this.actioning.set(false);
        this.router.navigate(['/seller/products']);
      },
      error: (err) => {
        this.actionError.set(err.error?.message ?? 'Error al publicar');
        this.actioning.set(false);
      },
    });
  }

  doPause(): void {
    const id = this.product()?.id;
    if (!id) return;
    this.actioning.set(true);
    this.productService.pause(id).subscribe({
      next: (res) => {
        this.product.set(res.data);
        this.actioning.set(false);
      },
      error: () => this.actioning.set(false),
    });
  }
}
