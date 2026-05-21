import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { SellerProductService } from '../../core/seller/seller-product.service';
import { InventoryResponse } from '../../shared/models/product.models';

@Component({
  selector: 'app-seller-inventory',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-xl">
      <div class="flex items-center gap-3 mb-6">
        <a [routerLink]="['/seller/products', productId()]"
          class="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ng-icon name="lucideChevronLeft" size="14" />
          Editar producto
        </a>
      </div>

      <h1 class="text-xl font-bold text-text-primary mb-6">Inventario</h1>

      @if (loading()) {
        <div class="h-32 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
      } @else if (inventory()) {
        <!-- Stock actual -->
        <div class="bg-bg-surface border border-border rounded-xl p-5 mb-5">
          <h2 class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">Stock actual</h2>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-2xl font-bold text-text-primary">{{ inventory()!.physicalStock }}</p>
              <p class="text-xs text-text-muted mt-1">Físico</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-yellow-400">{{ inventory()!.reservedStock }}</p>
              <p class="text-xs text-text-muted mt-1">Reservado</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-green-400">{{ inventory()!.availableStock }}</p>
              <p class="text-xs text-text-muted mt-1">Disponible</p>
            </div>
          </div>
        </div>

        <!-- Ajuste de stock -->
        <div class="bg-bg-surface border border-border rounded-xl p-5">
          <h2 class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">Ajustar stock</h2>

          @if (adjustSuccess()) {
            <div class="mb-4 flex items-center gap-2 rounded-lg bg-success/10 border border-success/30 px-4 py-2.5 text-sm text-success">
              <ng-icon name="lucideCircleCheck" size="14" />Stock actualizado
            </div>
          }
          @if (adjustError()) {
            <div class="mb-4 flex items-center gap-2 rounded-lg bg-error/10 border border-error/30 px-4 py-2.5 text-sm text-error">
              <ng-icon name="lucideTriangleAlert" size="14" />{{ adjustError() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="adjust()" novalidate class="flex flex-col gap-4">
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">
                Cantidad (positivo = entrada, negativo = salida)
              </label>
              <input type="number" formControlName="quantity"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Nota (opcional)</label>
              <input type="text" formControlName="notes" placeholder="Ej: Recepción mercancía proveedor"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors" />
            </div>
            <button type="submit" [disabled]="adjusting()"
              class="self-start px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2">
              @if (adjusting()) { <ng-icon name="lucideRefreshCw" size="14" class="animate-spin" /> }
              Aplicar ajuste
            </button>
          </form>
        </div>
      }
    </div>
  `,
})
export class SellerInventoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(SellerProductService);
  private fb = inject(FormBuilder);

  productId = signal('');
  inventory = signal<InventoryResponse | null>(null);
  loading = signal(true);
  adjusting = signal(false);
  adjustSuccess = signal(false);
  adjustError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    quantity: [0, [Validators.required, Validators.min(-9999), Validators.max(9999)]],
    notes: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productId.set(id);
    this.productService.getInventory(id).subscribe({
      next: (res) => { this.inventory.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  adjust(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    if (raw.quantity === 0) return;
    this.adjusting.set(true);
    this.adjustError.set(null);
    this.productService.adjustStock(this.productId(), {
      quantity: raw.quantity,
      notes: raw.notes || undefined,
    }).subscribe({
      next: (res) => {
        this.inventory.set(res.data);
        this.form.reset({ quantity: 0, notes: '' });
        this.adjusting.set(false);
        this.adjustSuccess.set(true);
        setTimeout(() => this.adjustSuccess.set(false), 3000);
      },
      error: (err) => {
        this.adjustError.set(err.error?.message ?? 'Error al ajustar');
        this.adjusting.set(false);
      },
    });
  }
}
