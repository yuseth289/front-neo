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
        <div class="h-32 rounded-xl bg-bg-surface border border-border animate-pulse mb-4"></div>
        <div class="h-44 rounded-xl bg-bg-surface border border-border animate-pulse mb-4"></div>
        <div class="h-44 rounded-xl bg-bg-surface border border-border animate-pulse"></div>

      } @else if (loadError()) {
        <div class="flex items-center gap-2 rounded-xl bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
          <ng-icon name="lucideTriangleAlert" size="15" />{{ loadError() }}
        </div>

      } @else if (inventory()) {

        <!-- ── Stock actual ───────────────────────────────── -->
        <div class="neo-card-premium p-5 mb-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-[11px] font-semibold text-text-muted uppercase tracking-[0.06em] font-mono">
              Stock actual
            </h2>
            @if (inventory()!.availableStock > 0) {
              @if (confirmingAgotado()) {
                <div class="flex items-center gap-2">
                  <span class="text-[12px] text-text-muted">¿Marcar como agotado?</span>
                  <button (click)="markAsAgotado()"
                    [disabled]="setting()"
                    class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-semibold
                           transition-colors disabled:opacity-50"
                    style="background:rgba(239,68,68,0.12);color:var(--color-error);border:1px solid rgba(239,68,68,0.3)">
                    @if (setting()) {
                      <ng-icon name="lucideRefreshCw" size="11" class="animate-spin" />
                    } @else {
                      <ng-icon name="lucideCheck" size="11" />
                    }
                    Sí, agotar
                  </button>
                  <button (click)="confirmingAgotado.set(false)"
                    class="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors">
                    <ng-icon name="lucideX" size="13" />
                  </button>
                </div>
              } @else {
                <button (click)="confirmingAgotado.set(true)"
                  [disabled]="inventory()!.reservedStock > 0"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
                         transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style="background:rgba(239,68,68,0.08);color:var(--color-error);border:1px solid rgba(239,68,68,0.2)"
                  [attr.title]="inventory()!.reservedStock > 0
                    ? 'No se puede agotar: hay ' + inventory()!.reservedStock + ' unidades en checkouts activos'
                    : 'Pone el stock físico a 0'">
                  <ng-icon name="lucidePackageX" size="13" />
                  Marcar agotado
                </button>
              }
            }
          </div>

          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-[28px] font-display font-bold text-text-primary leading-none">
                {{ inventory()!.physicalStock }}
              </p>
              <p class="text-[11px] text-text-muted mt-1.5">Físico</p>
            </div>
            <div>
              <p class="text-[28px] font-display font-bold leading-none" style="color:var(--color-warning)">
                {{ inventory()!.reservedStock }}
              </p>
              <p class="text-[11px] text-text-muted mt-1.5">Reservado</p>
            </div>
            <div>
              <p class="text-[28px] font-display font-bold leading-none"
                 [style.color]="inventory()!.availableStock > 0 ? 'var(--color-success)' : 'var(--color-error)'">
                {{ inventory()!.availableStock }}
              </p>
              <p class="text-[11px] text-text-muted mt-1.5">Disponible</p>
            </div>
          </div>

          @if (inventory()!.availableStock === 0) {
            <div class="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium"
                 style="background:rgba(239,68,68,0.08);color:var(--color-error);border:1px solid rgba(239,68,68,0.2)">
              <ng-icon name="lucidePackageX" size="13" />
              Producto agotado — usa "Agregar unidades" o "Establecer stock" para reabastecer.
            </div>
          }
        </div>

        <!-- ── Agregar unidades ───────────────────────────── -->
        <div class="neo-card-premium p-5 mb-4">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 style="background:rgba(0,200,120,0.1);border:1px solid rgba(0,200,120,0.25);color:var(--color-success)">
              <ng-icon name="lucidePlus" size="15" />
            </div>
            <div>
              <h2 class="text-[13px] font-semibold text-text-primary">Agregar unidades</h2>
              <p class="text-[12px] text-text-muted mt-0.5">
                Recibiste nueva mercancía — suma unidades al stock actual.
              </p>
            </div>
          </div>

          @if (addSuccess()) {
            <div class="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium"
                 style="background:rgba(0,200,120,0.08);color:var(--color-success);border:1px solid rgba(0,200,120,0.2)">
              <ng-icon name="lucideCircleCheck" size="13" /> Unidades agregadas correctamente
            </div>
          }
          @if (addError()) {
            <div class="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]"
                 style="background:rgba(239,68,68,0.08);color:var(--color-error);border:1px solid rgba(239,68,68,0.2)">
              <ng-icon name="lucideTriangleAlert" size="13" /> {{ addError() }}
            </div>
          }

          <form [formGroup]="addForm" (ngSubmit)="addStock()" novalidate class="flex flex-col gap-3">
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                  Unidades a agregar
                </label>
                <input type="number" formControlName="quantity" min="1"
                  class="w-full rounded-[10px] bg-bg-elevated border border-border px-3 py-2.5 text-[14px]
                         text-text-primary focus:outline-none focus:border-accent/50 transition-colors" />
              </div>
              <div class="flex-1">
                <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                  Nota (opcional)
                </label>
                <input type="text" formControlName="notes" placeholder="Ej: Lote proveedor enero"
                  class="w-full rounded-[10px] bg-bg-elevated border border-border px-3 py-2.5 text-[13px]
                         text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors" />
              </div>
            </div>
            <button type="submit" [disabled]="adding() || addForm.invalid"
              class="self-start flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold
                     transition-colors disabled:opacity-50"
              style="background:rgba(0,200,120,0.15);color:var(--color-success);border:1px solid rgba(0,200,120,0.3)">
              @if (adding()) {
                <ng-icon name="lucideRefreshCw" size="13" class="animate-spin" />
              } @else {
                <ng-icon name="lucidePlus" size="13" />
              }
              Agregar al stock
            </button>
          </form>
        </div>

        <!-- ── Reiniciar / Establecer stock exacto ───────── -->
        <div class="neo-card-premium p-5">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 style="background:rgba(100,93,255,0.1);border:1px solid rgba(100,93,255,0.25);color:var(--color-accent)">
              <ng-icon name="lucideRefreshCw" size="15" />
            </div>
            <div>
              <h2 class="text-[13px] font-semibold text-text-primary">Reiniciar / Establecer stock exacto</h2>
              <p class="text-[12px] text-text-muted mt-0.5">
                Hiciste un conteo físico o quieres corregir el número — reemplaza el stock actual con este valor.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-2 px-3 py-2 rounded-lg mb-4 text-[12px]"
               style="background:rgba(245,158,11,0.06);color:var(--color-warning);border:1px solid rgba(245,158,11,0.2)">
            <ng-icon name="lucideInfo" size="13" class="mt-0.5 shrink-0" />
            <span>El valor que ingreses <strong>reemplaza</strong> el stock actual completo.
              No puede ser menor al stock reservado ({{ inventory()!.reservedStock }} uds.).</span>
          </div>

          @if (setSuccess()) {
            <div class="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium"
                 style="background:rgba(0,200,120,0.08);color:var(--color-success);border:1px solid rgba(0,200,120,0.2)">
              <ng-icon name="lucideCircleCheck" size="13" /> Stock establecido correctamente
            </div>
          }
          @if (setError()) {
            <div class="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]"
                 style="background:rgba(239,68,68,0.08);color:var(--color-error);border:1px solid rgba(239,68,68,0.2)">
              <ng-icon name="lucideTriangleAlert" size="13" /> {{ setError() }}
            </div>
          }

          <form [formGroup]="setForm" (ngSubmit)="setStock()" novalidate class="flex flex-col gap-3">
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                  Nuevo stock total
                </label>
                <input type="number" formControlName="quantity" min="0"
                  class="w-full rounded-[10px] bg-bg-elevated border border-border px-3 py-2.5 text-[14px]
                         text-text-primary focus:outline-none focus:border-accent/50 transition-colors" />
              </div>
              <div class="flex-1">
                <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                  Motivo (opcional)
                </label>
                <input type="text" formControlName="notes" placeholder="Ej: Conteo físico 01/06"
                  class="w-full rounded-[10px] bg-bg-elevated border border-border px-3 py-2.5 text-[13px]
                         text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors" />
              </div>
            </div>
            <button type="submit" [disabled]="setting() || setForm.invalid"
              class="self-start flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold
                     transition-colors disabled:opacity-50"
              style="background:rgba(100,93,255,0.12);color:var(--color-accent);border:1px solid rgba(100,93,255,0.3)">
              @if (setting()) {
                <ng-icon name="lucideRefreshCw" size="13" class="animate-spin" />
              } @else {
                <ng-icon name="lucideRefreshCw" size="13" />
              }
              Establecer stock
            </button>
          </form>
        </div>

      }
    </div>
  `,
})
export class SellerInventoryComponent implements OnInit {
  private route          = inject(ActivatedRoute);
  private productService = inject(SellerProductService);
  private fb             = inject(FormBuilder);

  productId  = signal('');
  inventory  = signal<InventoryResponse | null>(null);
  loading    = signal(true);
  loadError  = signal<string | null>(null);

  adding            = signal(false);
  addSuccess        = signal(false);
  addError          = signal<string | null>(null);

  setting           = signal(false);
  setSuccess        = signal(false);
  setError          = signal<string | null>(null);

  confirmingAgotado = signal(false);

  addForm = this.fb.nonNullable.group({
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(99999)]],
    notes: [''],
  });

  setForm = this.fb.nonNullable.group({
    quantity: [0, [Validators.required, Validators.min(0), Validators.max(99999)]],
    notes: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productId.set(id);
    this.productService.getInventory(id).subscribe({
      next: (res) => { this.inventory.set(res.data); this.loading.set(false); },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err.error?.message ?? 'Error al cargar el inventario');
      },
    });
  }

  addStock(): void {
    if (this.addForm.invalid) return;
    const raw = this.addForm.getRawValue();
    this.adding.set(true);
    this.addError.set(null);
    this.productService.adjustStock(this.productId(), { quantity: raw.quantity, notes: raw.notes || undefined })
      .subscribe({
        next: (res) => {
          this.inventory.set(res.data);
          this.addForm.reset({ quantity: 1, notes: '' });
          this.adding.set(false);
          this.addSuccess.set(true);
          setTimeout(() => this.addSuccess.set(false), 3000);
        },
        error: (err) => { this.addError.set(err.error?.message ?? 'Error al agregar'); this.adding.set(false); },
      });
  }

  markAsAgotado(): void {
    this.setting.set(true);
    this.setError.set(null);
    this.productService.setStock(this.productId(), { quantity: 0, notes: 'Marcado como agotado' })
      .subscribe({
        next: (res) => {
          this.inventory.set(res.data);
          this.confirmingAgotado.set(false);
          this.setting.set(false);
          this.setSuccess.set(true);
          setTimeout(() => this.setSuccess.set(false), 3000);
        },
        error: (err) => {
          this.setError.set(err.error?.message ?? 'Error al marcar como agotado');
          this.confirmingAgotado.set(false);
          this.setting.set(false);
        },
      });
  }

  setStock(): void {
    if (this.setForm.invalid) return;
    const raw = this.setForm.getRawValue();
    this.setting.set(true);
    this.setError.set(null);
    this.productService.setStock(this.productId(), { quantity: raw.quantity, notes: raw.notes || undefined })
      .subscribe({
        next: (res) => {
          this.inventory.set(res.data);
          this.setForm.patchValue({ notes: '' });
          this.setting.set(false);
          this.setSuccess.set(true);
          setTimeout(() => this.setSuccess.set(false), 3000);
        },
        error: (err) => { this.setError.set(err.error?.message ?? 'Error al establecer'); this.setting.set(false); },
      });
  }
}
