import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { WishlistService } from '../../core/account/wishlist.service';
import { Wishlist, WishlistItem } from '../../shared/models/wishlist.models';

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMUExQTFBIi8+PC9zdmc+';

@Component({
  selector: 'app-wishlist-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-2xl">

      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/wishlists"
          class="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ng-icon name="lucideChevronLeft" size="14" />
          Mis wishlists
        </a>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          <div class="h-16 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          <div class="h-32 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
        </div>
      } @else if (!wishlist()) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucideHeartCrack" size="40" />
          <p>Wishlist no encontrada.</p>
        </div>
      } @else {
        <!-- Encabezado editable -->
        <div class="bg-bg-surface border border-border rounded-xl p-5 mb-5">
          @if (editingMeta()) {
            <form [formGroup]="metaForm" (ngSubmit)="saveMeta()" novalidate class="flex flex-col gap-3">
              <input type="text" formControlName="name"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors"
                [class.border-error]="metaForm.get('name')!.invalid && metaForm.get('name')!.touched" />
              <label class="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" formControlName="isPublic"
                  class="w-4 h-4 rounded accent-[var(--color-accent)]" />
                <span class="text-sm text-text-secondary">Hacer pública</span>
              </label>
              <div class="flex gap-2">
                <button type="submit" [disabled]="savingMeta()"
                  class="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-1.5">
                  @if (savingMeta()) { <ng-icon name="lucideRefreshCw" size="13" class="animate-spin" /> }
                  Guardar
                </button>
                <button type="button" (click)="cancelMeta()"
                  class="px-3 py-1.5 rounded-lg border border-border text-text-secondary text-sm transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          } @else {
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-lg font-bold text-text-primary">{{ wishlist()!.name }}</h1>
                  @if (wishlist()!.isPublic) {
                    <span class="text-[10px] font-bold uppercase tracking-wide bg-accent/15 text-accent px-1.5 py-0.5 rounded">
                      Pública
                    </span>
                  }
                </div>
                <p class="text-xs text-text-muted mt-0.5">
                  {{ wishlist()!.items.length }} {{ wishlist()!.items.length === 1 ? 'producto' : 'productos' }}
                </p>
              </div>
              <button (click)="startEditMeta()"
                class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
                <ng-icon name="lucideSettings" size="16" />
              </button>
            </div>
          }
        </div>

        <!-- Items -->
        @if (wishlist()!.items.length === 0) {
          <div class="flex flex-col items-center gap-3 py-12 text-text-muted">
            <ng-icon name="lucideHeart" size="32" />
            <p class="text-sm">Esta wishlist está vacía.</p>
            <a routerLink="/catalog"
              class="text-sm text-accent hover:underline">Explorar productos</a>
          </div>
        } @else {
          <div class="flex flex-col gap-3">
            @for (item of wishlist()!.items; track item.itemId) {
              <div class="bg-bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
                <a [routerLink]="['/product', item.productSlug]" class="shrink-0">
                  <img [src]="item.productImageUrl ?? placeholder" [alt]="item.productName"
                    class="w-14 h-14 rounded-lg object-cover bg-bg-elevated" loading="lazy" />
                </a>
                <div class="flex-1 min-w-0">
                  <a [routerLink]="['/product', item.productSlug]"
                    class="text-sm font-medium text-text-primary hover:text-accent transition-colors line-clamp-2">
                    {{ item.productName }}
                  </a>
                  <p class="text-sm font-semibold text-text-primary mt-0.5">
                    {{ item.finalPrice | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                  </p>
                  @if (!item.inStock) {
                    <span class="text-[10px] font-semibold uppercase tracking-wide text-error">Sin stock</span>
                  }
                </div>
                <button (click)="removeItem(item)"
                  class="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-bg-elevated transition-colors shrink-0">
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
  private route = inject(ActivatedRoute);
  private wishlistService = inject(WishlistService);
  private fb = inject(FormBuilder);

  wishlist = signal<Wishlist | null>(null);
  loading = signal(true);
  editingMeta = signal(false);
  savingMeta = signal(false);
  readonly placeholder = PLACEHOLDER;

  metaForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    isPublic: [false],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.wishlistService.getById(id).subscribe({
      next: (res) => { this.wishlist.set(res.data); this.loading.set(false); },
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
      next: (res) => { this.wishlist.set(res.data); this.editingMeta.set(false); this.savingMeta.set(false); },
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
