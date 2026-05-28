import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { AdminService } from '../../core/admin/admin.service';
import { Brand } from '../../shared/models/catalog.models';

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-2xl">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <p class="neo-stat-label">Admin</p>
          <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
            Marcas
          </h1>
        </div>
        <button (click)="openCreate()" class="neo-btn-primary flex items-center gap-2">
          <ng-icon name="lucidePlus" size="14" />
          Nueva
        </button>
      </div>

      <!-- Create/Edit form -->
      @if (showForm()) {
        <div class="neo-card-premium p-5 mb-5">
          <div class="flex items-center gap-2.5 mb-4">
            <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                 [style.color]="editingId() ? 'var(--color-accent)' : 'var(--color-success)'">
              <ng-icon [name]="editingId() ? 'lucideSettings' : 'lucidePlus'" size="13" />
            </div>
            <h2 class="text-[13px] font-semibold text-text-primary">
              {{ editingId() ? 'Editar marca' : 'Nueva marca' }}
            </h2>
          </div>

          @if (formError()) {
            <div class="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-[13px]"
                 style="background:rgba(239,68,68,0.08);color:var(--color-error);border:1px solid rgba(239,68,68,0.2);">
              <ng-icon name="lucideTriangleAlert" size="13" />
              {{ formError() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="save()" novalidate class="flex flex-col gap-4">
            <div>
              <label class="block text-[12px] font-medium text-text-secondary mb-1.5">Nombre</label>
              <input type="text" formControlName="name"
                class="w-full rounded-[10px] bg-bg-elevated border px-3.5 py-2.5 text-[14px]
                       text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/8
                       focus:border-accent transition-colors"
                [style.border-color]="isInvalid('name') ? 'var(--color-error)' : 'var(--color-border)'" />
              @if (isInvalid('name')) {
                <p class="text-[11px] text-error mt-1">El nombre es obligatorio</p>
              }
            </div>
            <div>
              <label class="block text-[12px] font-medium text-text-secondary mb-1.5">Orden de visualización</label>
              <input type="number" formControlName="displayOrder" min="0"
                class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-[14px]
                       text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/8
                       focus:border-accent transition-colors" />
            </div>
            <div class="flex gap-3 pt-1">
              <button type="submit" [disabled]="saving()" class="neo-btn-primary flex items-center gap-2">
                @if (saving()) { <ng-icon name="lucideRefreshCw" size="13" class="neo-spin" /> }
                {{ editingId() ? 'Guardar' : 'Crear marca' }}
              </button>
              <button type="button" (click)="closeForm()" class="neo-btn-outline">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="flex flex-col gap-2.5">
          @for (_ of [1,2,3,4,5]; track $index) {
            <div class="h-12 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>

      } @else if (brands().length === 0) {
        <div class="neo-card-premium p-14 flex flex-col items-center gap-4 text-center">
          <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
            <ng-icon name="lucideShoppingBag" size="26" class="text-text-muted" />
          </div>
          <p class="text-base font-semibold text-text-primary">Sin marcas</p>
          <p class="text-sm text-text-muted">Agrega marcas para mostrarlas en los filtros del catálogo.</p>
          <button (click)="openCreate()" class="neo-btn-primary flex items-center gap-2 mt-1">
            <ng-icon name="lucidePlus" size="13" />
            Nueva marca
          </button>
        </div>

      } @else {
        <div class="neo-card-premium overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-[13px] border-collapse">
              <thead>
                <tr class="bg-bg-elevated">
                  <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono">
                    Nombre
                  </th>
                  <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono hidden sm:table-cell">
                    Slug
                  </th>
                  <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono w-16">
                    Orden
                  </th>
                  <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono w-20">
                    Estado
                  </th>
                  <th class="w-20"></th>
                </tr>
              </thead>
              <tbody>
                @for (brand of brands(); track brand.id) {
                  <tr class="border-t border-border transition-colors hover:bg-bg-elevated/60">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-2">
                        <div class="w-5 h-5 rounded-md bg-bg-elevated border border-border flex items-center justify-center shrink-0"
                             [style.color]="brand.active ? 'var(--color-accent)' : 'var(--color-text-muted)'">
                          <ng-icon name="lucideShoppingBag" size="10" />
                        </div>
                        <span class="text-[13px] font-semibold text-text-primary"
                              [class.opacity-40]="!brand.active">{{ brand.name }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-3.5 hidden sm:table-cell">
                      <span class="text-[11px] font-mono text-text-muted px-2 py-0.5 rounded-md bg-bg-elevated border border-border">
                        {{ brand.slug }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-[12px] text-text-muted font-mono">{{ brand.displayOrder }}</td>
                    <td class="px-5 py-3.5">
                      @if (brand.active) {
                        <span class="text-[11px] font-medium px-2 py-0.5 rounded-full"
                              style="background:rgba(34,197,94,0.1);color:var(--color-success);">Activa</span>
                      } @else {
                        <span class="text-[11px] font-medium px-2 py-0.5 rounded-full"
                              style="background:rgba(107,114,128,0.1);color:var(--color-text-muted);">Inactiva</span>
                      }
                    </td>
                    <td class="px-5 py-3.5">
                      <div class="flex gap-1 justify-end">
                        <button (click)="openEdit(brand)" title="Editar"
                          class="p-1.5 rounded-[8px] text-text-muted hover:text-accent hover:bg-accent/10 transition-colors">
                          <ng-icon name="lucideSettings" size="13" />
                        </button>
                        @if (brand.active) {
                          <button (click)="deactivate(brand.id)" title="Desactivar"
                            class="p-1.5 rounded-[8px] text-text-muted hover:text-error hover:bg-error/10 transition-colors">
                            <ng-icon name="lucideTrash2" size="13" />
                          </button>
                        } @else {
                          <button (click)="activate(brand.id)" title="Reactivar"
                            class="p-1.5 rounded-[8px] text-text-muted hover:text-success hover:bg-success/10 transition-colors">
                            <ng-icon name="lucideRefreshCw" size="13" />
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminBrandsComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  brands   = signal<Brand[]>([]);
  loading  = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  saving   = signal(false);
  formError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    displayOrder: [0],
  });

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.adminService.getBrands().subscribe({
      next: (res) => { this.brands.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', displayOrder: 0 });
    this.formError.set(null);
    this.showForm.set(true);
  }

  openEdit(brand: Brand): void {
    this.editingId.set(brand.id);
    this.form.patchValue({ name: brand.name, displayOrder: brand.displayOrder });
    this.formError.set(null);
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editingId.set(null); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set(null);

    const { name, displayOrder } = this.form.getRawValue();

    const op$ = this.editingId()
      ? this.adminService.updateBrand(this.editingId()!, { name, displayOrder })
      : this.adminService.createBrand({ name, displayOrder });

    op$.subscribe({
      next: () => { this.closeForm(); this.saving.set(false); this.load(); },
      error: (err) => { this.formError.set(err.error?.message ?? 'Error al guardar'); this.saving.set(false); },
    });
  }

  deactivate(id: string): void {
    this.adminService.deleteBrand(id).subscribe({ next: () => this.load() });
  }

  activate(id: string): void {
    this.adminService.activateBrand(id).subscribe({ next: () => this.load() });
  }
}
