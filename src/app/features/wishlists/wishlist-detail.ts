import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { WishlistService } from '../../core/account/wishlist.service';
import { Wishlist, WishlistItem } from '../../shared/models/wishlist.models';

@Component({
  selector: 'app-wishlist-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon, CopCurrencyPipe],
  template: `
    <div class="max-w-2xl">

      <!-- Breadcrumb -->
      <a routerLink="/wishlists"
        class="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary transition-colors mb-5">
        <ng-icon name="lucideChevronLeft" size="13" />
        Mis wishlists
      </a>

      @if (loading()) {
        <div class="flex flex-col gap-3">
          <div class="h-16 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
          <div class="h-32 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
        </div>

      } @else if (!wishlist()) {
        <div class="neo-card-premium p-14 flex flex-col items-center gap-4 text-center">
          <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
            <ng-icon name="lucideHeartCrack" size="26" class="text-text-muted" />
          </div>
          <p class="text-base font-semibold text-text-primary">Wishlist no encontrada</p>
        </div>

      } @else {
        <!-- ── Encabezado ──────────────────────────────────── -->
        <div class="neo-card-premium p-5 mb-4">
          @if (editingMeta()) {
            <form [formGroup]="metaForm" (ngSubmit)="saveMeta()" novalidate class="flex flex-col gap-3">
              <input type="text" formControlName="name"
                class="w-full rounded-[10px] bg-bg-elevated border px-3.5 py-2.5 text-sm text-text-primary
                       outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent"
                [class.border-error]="metaForm.get('name')!.invalid && metaForm.get('name')!.touched"
                [class.border-border]="!(metaForm.get('name')!.invalid && metaForm.get('name')!.touched)" />
              <label class="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" formControlName="isPublic"
                  class="w-4 h-4 rounded accent-[var(--color-accent)]" />
                <span class="text-[13px] text-text-secondary">Hacer pública</span>
              </label>
              <div class="flex gap-2">
                <button type="submit" [disabled]="savingMeta()"
                  class="neo-btn-primary !text-[13px] !py-2 !px-4 disabled:opacity-50">
                  @if (savingMeta()) { <ng-icon name="lucideRefreshCw" size="13" class="neo-spin" /> }
                  Guardar
                </button>
                <button type="button" (click)="cancelMeta()" class="neo-btn-outline !text-[13px] !py-2 !px-3">
                  Cancelar
                </button>
              </div>
            </form>
          } @else {
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="font-display text-[22px] font-bold tracking-[-0.02em] text-text-primary">
                    {{ wishlist()!.name }}
                  </h1>
                  @if (wishlist()!.isPublic) {
                    <span class="text-[10px] font-bold uppercase tracking-wide font-mono
                                 text-accent bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded-full">
                      Pública
                    </span>
                  }
                </div>
                <p class="text-[12px] text-text-muted mt-0.5">
                  {{ wishlist()!.items.length }} {{ wishlist()!.items.length === 1 ? 'producto' : 'productos' }}
                </p>
              </div>
              <button (click)="startEditMeta()"
                class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
                <ng-icon name="lucideSettings" size="15" />
              </button>
            </div>
          }
        </div>

        <!-- ── Items ──────────────────────────────────────── -->
        @if (wishlist()!.items.length === 0) {
          <div class="neo-card-premium p-12 flex flex-col items-center gap-4 text-center">
            <div class="w-12 h-12 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
              <ng-icon name="lucideHeart" size="22" class="text-text-muted" />
            </div>
            <div>
              <p class="text-sm font-semibold text-text-primary">Lista vacía</p>
              <p class="text-[13px] text-text-muted mt-1">Agrega productos desde el catálogo.</p>
            </div>
            <a routerLink="/catalog" class="neo-btn-outline !text-[13px] !py-2 !px-4">
              <ng-icon name="lucideLayoutGrid" size="13" />
              Explorar catálogo
            </a>
          </div>
        } @else {
          <div class="flex flex-col gap-3">
            @for (item of wishlist()!.items; track item.itemId) {
              <div class="neo-card-premium p-4 flex items-center gap-4">
                <a [routerLink]="['/product', item.productSlug]" class="shrink-0">
                  <div class="w-16 h-16 rounded-xl overflow-hidden bg-bg-elevated border border-border">
                    @if (item.productImageUrl) {
                      <img [src]="item.productImageUrl" [alt]="item.productName"
                        class="w-full h-full object-cover" loading="lazy" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center">
                        <ng-icon name="lucidePackage" size="18" class="text-text-muted" />
                      </div>
                    }
                  </div>
                </a>

                <div class="flex-1 min-w-0">
                  <a [routerLink]="['/product', item.productSlug]"
                    class="text-[13px] font-semibold text-text-primary hover:text-accent transition-colors line-clamp-2 leading-snug">
                    {{ item.productName }}
                  </a>
                  <p class="text-sm font-bold text-text-primary mt-1 tabular-nums">
                    {{ item.finalPrice | copCurrency }}
                  </p>
                  @if (!item.inStock) {
                    <span class="text-[11px] font-semibold uppercase tracking-wide text-error">Sin stock</span>
                  }
                </div>

                <button (click)="removeItem(item)"
                  class="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors shrink-0">
                  <ng-icon name="lucideX" size="15" />
                </button>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class WishlistDetailComponent implements OnInit {
  private route           = inject(ActivatedRoute);
  private wishlistService = inject(WishlistService);
  private fb              = inject(FormBuilder);

  wishlist    = signal<Wishlist | null>(null);
  loading     = signal(true);
  editingMeta = signal(false);
  savingMeta  = signal(false);

  metaForm = this.fb.nonNullable.group({
    name:     ['', Validators.required],
    isPublic: [false],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.wishlistService.getById(id).subscribe({
      next:  (res) => { this.wishlist.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  startEditMeta(): void {
    const wl = this.wishlist()!;
    this.metaForm.patchValue({ name: wl.name, isPublic: wl.isPublic });
    this.editingMeta.set(true);
  }

  cancelMeta(): void { this.editingMeta.set(false); }

  saveMeta(): void {
    if (this.metaForm.invalid) { this.metaForm.markAllAsTouched(); return; }
    const id = this.wishlist()!.id;
    this.savingMeta.set(true);
    this.wishlistService.update(id, this.metaForm.getRawValue()).subscribe({
      next:  (res) => { this.wishlist.set(res.data); this.editingMeta.set(false); this.savingMeta.set(false); },
      error: () => this.savingMeta.set(false),
    });
  }

  removeItem(item: WishlistItem): void {
    const wlId = this.wishlist()!.id;
    this.wishlistService.removeItem(wlId, item.productId).subscribe({
      next: () => {
        this.wishlist.update(wl => wl
          ? { ...wl, items: wl.items.filter(i => i.itemId !== item.itemId) }
          : wl
        );
      },
    });
  }
}
