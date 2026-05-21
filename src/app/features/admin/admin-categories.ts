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
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-text-primary">Categorías</h1>
        <button (click)="openCreate()"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors">
          <ng-icon name="lucidePlus" size="14" />
          Nueva
        </button>
      </div>

      <!-- Formulario crear/editar -->
      @if (showForm()) {
        <div class="bg-bg-surface border border-border rounded-xl p-5 mb-5">
          <h2 class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">
            {{ editingId() ? 'Editar categoría' : 'Nueva categoría' }}
          </h2>

          @if (formError()) {
            <p class="mb-3 text-sm text-error flex items-center gap-1.5">
              <ng-icon name="lucideTriangleAlert" size="13" />{{ formError() }}
            </p>
          }

          <form [formGroup]="form" (ngSubmit)="save()" novalidate class="flex flex-col gap-4">
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Nombre</label>
              <input type="text" formControlName="name"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors"
                [class.border-error]="isInvalid('name')" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Slug (URL)</label>
              <input type="text" formControlName="slug" placeholder="ej: videojuegos-pc"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors font-mono"
                [class.border-error]="isInvalid('slug')" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Descripción (opcional)</label>
              <input type="text" formControlName="description"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Categoría padre (opcional)</label>
              <select formControlName="parentId"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors">
                <option value="">Sin categoría padre (raíz)</option>
                @for (cat of rootCategories(); track cat.id) {
                  @if (cat.id !== editingId()) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                }
              </select>
            </div>
            <div class="flex gap-3">
              <button type="submit" [disabled]="saving()"
                class="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                @if (saving()) { <ng-icon name="lucideRefreshCw" size="14" class="animate-spin" /> }
                {{ editingId() ? 'Guardar' : 'Crear' }}
              </button>
              <button type="button" (click)="closeForm()"
                class="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <div class="space-y-2">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-12 rounded-lg bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else {
        <div class="bg-bg-surface border border-border rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left">
                <th class="px-4 py-3 text-xs text-text-muted font-medium">Nombre</th>
                <th class="px-4 py-3 text-xs text-text-muted font-medium hidden sm:table-cell">Slug</th>
                <th class="px-4 py-3 text-xs text-text-muted font-medium w-20"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (cat of categories(); track cat.id) {
                <tr class="hover:bg-bg-elevated transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      @if (cat.parentId) {
                        <span class="text-text-muted text-xs">└</span>
                      }
                      <span [class]="cat.parentId ? 'text-text-secondary' : 'font-medium text-text-primary'">
                        {{ cat.name }}
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3 hidden sm:table-cell">
                    <span class="text-xs font-mono text-text-muted">{{ cat.slug }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex gap-1 justify-end">
                      <button (click)="openEdit(cat)"
                        class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
                        <ng-icon name="lucideSettings" size="14" />
                      </button>
                      <button (click)="delete(cat.id)"
                        class="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-bg-elevated transition-colors">
                        <ng-icon name="lucideTrash2" size="14" />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
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
