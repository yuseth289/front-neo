import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { AdminService, AdminCategory, CreateCategoryRequest } from '../../core/admin/admin.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-2xl">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <p class="neo-stat-label">Admin</p>
          <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
            Categorías
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
              {{ editingId() ? 'Editar categoría' : 'Nueva categoría' }}
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
            </div>
            <div>
              <label class="block text-[12px] font-medium text-text-secondary mb-1.5">Slug (URL)</label>
              <input type="text" formControlName="slug" placeholder="ej: videojuegos-pc"
                class="w-full rounded-[10px] bg-bg-elevated border px-3.5 py-2.5 text-[14px]
                       text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/8
                       focus:border-accent transition-colors font-mono"
                [style.border-color]="isInvalid('slug') ? 'var(--color-error)' : 'var(--color-border)'" />
            </div>
            <div>
              <label class="block text-[12px] font-medium text-text-secondary mb-1.5">Descripción (opcional)</label>
              <input type="text" formControlName="description"
                class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-[14px]
                       text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/8
                       focus:border-accent transition-colors" />
            </div>
            <div>
              <label class="block text-[12px] font-medium text-text-secondary mb-1.5">Categoría padre (opcional)</label>
              <select formControlName="parentId"
                class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-[14px]
                       text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/8
                       focus:border-accent transition-colors">
                <option value="">Sin categoría padre (raíz)</option>
                @for (cat of rootCategories(); track cat.id) {
                  @if (cat.id !== editingId()) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                }
              </select>
            </div>
            <div class="flex gap-3 pt-1">
              <button type="submit" [disabled]="saving()" class="neo-btn-primary flex items-center gap-2">
                @if (saving()) { <ng-icon name="lucideRefreshCw" size="13" class="neo-spin" /> }
                {{ editingId() ? 'Guardar' : 'Crear categoría' }}
              </button>
              <button type="button" (click)="closeForm()" class="neo-btn-outline">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Loading skeletons -->
      @if (loading()) {
        <div class="flex flex-col gap-2.5">
          @for (_ of [1,2,3,4,5]; track $index) {
            <div class="h-12 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>

      } @else if (categories().length === 0) {
        <div class="neo-card-premium p-14 flex flex-col items-center gap-4 text-center">
          <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
            <ng-icon name="lucideTag" size="26" class="text-text-muted" />
          </div>
          <p class="text-base font-semibold text-text-primary">Sin categorías</p>
          <p class="text-sm text-text-muted">Crea la primera categoría para organizar el catálogo.</p>
          <button (click)="openCreate()" class="neo-btn-primary flex items-center gap-2 mt-1">
            <ng-icon name="lucidePlus" size="13" />
            Nueva categoría
          </button>
        </div>

      } @else {
        <div class="neo-card-premium overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-[13px] border-collapse">
              <thead>
                <tr class="bg-bg-elevated">
                  @for (h of ['Nombre','Slug','']; track h) {
                    <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]
                               text-text-muted font-mono whitespace-nowrap"
                        [class.hidden]="h === 'Slug'"
                        [class.sm:table-cell]="h === 'Slug'"
                        [class.w-20]="h === ''"
                        [class.last:text-right]="true">{{ h }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (cat of categories(); track cat.id) {
                  <tr class="border-t border-border transition-colors hover:bg-bg-elevated/60">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-2">
                        @if (cat.parentId) {
                          <span class="text-text-muted text-[11px] font-mono select-none">└</span>
                          <span class="text-[13px] text-text-secondary">{{ cat.name }}</span>
                        } @else {
                          <div class="w-5 h-5 rounded-md bg-bg-elevated border border-border
                                      flex items-center justify-center shrink-0"
                               style="color:var(--color-accent);">
                            <ng-icon name="lucideTag" size="10" />
                          </div>
                          <span class="text-[13px] font-semibold text-text-primary">{{ cat.name }}</span>
                        }
                      </div>
                    </td>
                    <td class="px-5 py-3.5 hidden sm:table-cell">
                      <span class="text-[11px] font-mono text-text-muted px-2 py-0.5 rounded-md
                                   bg-bg-elevated border border-border">{{ cat.slug }}</span>
                    </td>
                    <td class="px-5 py-3.5">
                      <div class="flex gap-1 justify-end">
                        <button (click)="openEdit(cat)"
                          class="p-1.5 rounded-[8px] text-text-muted hover:text-accent
                                 hover:bg-accent/10 transition-colors">
                          <ng-icon name="lucideSettings" size="13" />
                        </button>
                        <button (click)="delete(cat.id)"
                          class="p-1.5 rounded-[8px] text-text-muted hover:text-error
                                 hover:bg-error/10 transition-colors">
                          <ng-icon name="lucideTrash2" size="13" />
                        </button>
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
export class AdminCategoriesComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  categories = signal<AdminCategory[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);

  rootCategories = signal<AdminCategory[]>([]);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    description: [''],
    parentId: [''],
  });

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.adminService.getCategories().subscribe({
      next: (res) => {
        this.categories.set(res.data);
        this.rootCategories.set(res.data.filter(c => !c.parentId));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', slug: '', description: '', parentId: '' });
    this.formError.set(null);
    this.showForm.set(true);
  }

  openEdit(cat: AdminCategory): void {
    this.editingId.set(cat.id);
    this.form.patchValue({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      parentId: cat.parentId ?? '',
    });
    this.formError.set(null);
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editingId.set(null); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const request: CreateCategoryRequest = {
      name: raw.name,
      slug: raw.slug,
      description: raw.description || undefined,
      parentId: raw.parentId || undefined,
    };

    const op$ = this.editingId()
      ? this.adminService.updateCategory(this.editingId()!, request)
      : this.adminService.createCategory(request);

    op$.subscribe({
      next: () => { this.closeForm(); this.saving.set(false); this.load(); },
      error: (err) => { this.formError.set(err.error?.message ?? 'Error al guardar'); this.saving.set(false); },
    });
  }

  delete(id: string): void {
    this.adminService.deleteCategory(id).subscribe({
      next: () => this.load(),
    });
  }
}
