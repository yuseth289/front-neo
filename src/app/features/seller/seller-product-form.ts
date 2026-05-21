import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { SellerProductService } from '../../core/seller/seller-product.service';
import { CategoryService } from '../../core/catalog/category.service';
import { Category } from '../../shared/models/catalog.models';
import { ProductImageResponse } from '../../shared/models/product.models';

@Component({
  selector: 'app-seller-product-form',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-2xl">
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/seller/products"
          class="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ng-icon name="lucideChevronLeft" size="14" />
          Productos
        </a>
      </div>

      <h1 class="text-xl font-bold text-text-primary mb-6">
        {{ productId() ? 'Editar producto' : 'Nuevo producto' }}
      </h1>

      @if (formError()) {
        <div class="mb-5 flex items-center gap-2 rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
          <ng-icon name="lucideTriangleAlert" size="14" />{{ formError() }}
        </div>
      }
      @if (formSuccess()) {
        <div class="mb-5 flex items-center gap-2 rounded-lg bg-success/10 border border-success/30 px-4 py-3 text-sm text-success">
          <ng-icon name="lucideCircleCheck" size="14" />Producto guardado correctamente
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="save()" novalidate class="flex flex-col gap-5">

        <div class="bg-bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
          <h2 class="text-xs font-semibold text-text-secondary uppercase tracking-wide">Información básica</h2>

          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Nombre del producto</label>
            <input type="text" formControlName="name"
              class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                     focus:outline-none focus:border-accent transition-colors"
              [class.border-error]="isInvalid('name')" />
          </div>

          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Descripción</label>
            <textarea formControlName="description" rows="4"
              class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                     focus:outline-none focus:border-accent transition-colors resize-none"
              [class.border-error]="isInvalid('description')"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Marca</label>
              <input type="text" formControlName="brand"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors"
                [class.border-error]="isInvalid('brand')" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">SKU</label>
              <input type="text" formControlName="sku"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors"
                [class.border-error]="isInvalid('sku')" />
            </div>
          </div>

          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Categoría</label>
            <select formControlName="categoryId"
              class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                     focus:outline-none focus:border-accent transition-colors"
              [class.border-error]="isInvalid('categoryId')">
              <option value="">Seleccionar categoría</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
                @for (sub of cat.children; track sub.id) {
                  <option [value]="sub.id">— {{ sub.name }}</option>
                }
              }
            </select>
          </div>
        </div>

        <div class="bg-bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
          <h2 class="text-xs font-semibold text-text-secondary uppercase tracking-wide">Precio</h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Precio base (COP)</label>
              <input type="number" formControlName="basePrice" min="0"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors"
                [class.border-error]="isInvalid('basePrice')" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">IVA (%)</label>
              <select formControlName="ivaPercent"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors">
                <option [value]="0">0% — Excluido</option>
                <option [value]="5">5%</option>
                <option [value]="19">19% — General</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button type="submit" [disabled]="saving()"
            class="px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2">
            @if (saving()) { <ng-icon name="lucideRefreshCw" size="14" class="animate-spin" /> }
            {{ productId() ? 'Guardar cambios' : 'Crear producto' }}
          </button>
          <a routerLink="/seller/products"
            class="px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm transition-colors">
            Cancelar
          </a>
        </div>

      </form>

      <!-- ── IMÁGENES (solo al editar) ──────────────────────────────── -->
      @if (productId()) {
        <div class="bg-bg-surface border border-border rounded-xl p-5 mt-5">
          <h2 class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">
            Imágenes del producto
          </h2>

          <!-- Galería actual -->
          @if (images().length > 0) {
            <div class="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
              @for (img of images(); track img.id) {
                <div class="relative group aspect-square rounded-lg overflow-hidden border-2 transition-colors"
                  [class.border-accent]="img.primary"
                  [class.border-border]="!img.primary">
                  <img [src]="img.url" alt="Imagen producto"
                    class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity
                               flex flex-col items-center justify-center gap-1.5">
                    @if (!img.primary) {
                      <button (click)="setPrimary(img.id)"
                        class="px-2 py-1 rounded text-[10px] font-medium bg-accent text-white">
                        Principal
                      </button>
                    } @else {
                      <span class="px-2 py-1 rounded text-[10px] font-semibold bg-accent/80 text-white">
                        Principal
                      </span>
                    }
                    <button (click)="removeImage(img.id)"
                      class="px-2 py-1 rounded text-[10px] font-medium bg-error/80 text-white">
                      Eliminar
                    </button>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Agregar imagen por URL -->
          @if (imageError()) {
            <p class="mb-2 text-xs text-error">{{ imageError() }}</p>
          }
          <div class="flex gap-2">
            <input type="url" [formControl]="imageUrlControl"
              placeholder="https://cdn.ejemplo.com/imagen.jpg"
              class="flex-1 rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                     focus:outline-none focus:border-accent transition-colors" />
            <button (click)="addImage()" [disabled]="addingImage()"
              class="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm
                     font-medium transition-colors flex items-center gap-1.5 shrink-0">
              @if (addingImage()) {
                <ng-icon name="lucideRefreshCw" size="13" class="animate-spin" />
              } @else {
                <ng-icon name="lucidePlus" size="13" />
              }
              Agregar
            </button>
          </div>
          <p class="mt-1.5 text-xs text-text-muted">
            Ingresa la URL pública de la imagen. Sube tus imágenes a un CDN o servicio de hosting primero.
          </p>
        </div>
      }
    </div>
  `,
})
export class SellerProductFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(SellerProductService);
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  productId = signal<string | null>(null);
  categories = signal<Category[]>([]);
  saving = signal(false);
  formError = signal<string | null>(null);
  formSuccess = signal(false);

  images = signal<ProductImageResponse[]>([]);
  imageUrlControl: FormControl<string> = this.fb.nonNullable.control('', Validators.required);
  addingImage = signal(false);
  imageError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    brand: ['', Validators.required],
    sku: ['', Validators.required],
    categoryId: ['', Validators.required],
    basePrice: [0, [Validators.required, Validators.min(1)]],
    ivaPercent: [19, Validators.required],
  });

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  ngOnInit(): void {
    this.categoryService.getTree().subscribe({
      next: (res) => this.categories.set(res.data),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(id);
      this.productService.getProduct(id).subscribe({
        next: (res) => {
          const p = res.data;
          this.form.patchValue({
            name: p.name,
            description: p.description,
            brand: p.brand,
            sku: p.sku,
            categoryId: p.categoryId,
            basePrice: p.basePrice,
            ivaPercent: p.ivaPercent,
          });
          this.images.set(p.images ?? []);
        },
      });
    }
  }

  addImage(): void {
    if (this.imageUrlControl.invalid) return;
    const id = this.productId();
    if (!id) return;
    this.addingImage.set(true);
    this.imageError.set(null);
    this.productService.addImage(id, this.imageUrlControl.value).subscribe({
      next: (res) => {
        this.images.update(imgs => [...imgs, res.data]);
        this.imageUrlControl.reset('');
        this.addingImage.set(false);
      },
      error: (err) => {
        this.imageError.set(err.error?.message ?? 'Error al agregar imagen');
        this.addingImage.set(false);
      },
    });
  }

  setPrimary(imageId: string): void {
    const id = this.productId();
    if (!id) return;
    this.productService.setPrimaryImage(id, imageId).subscribe({
      next: () => {
        this.images.update(imgs =>
          imgs.map(img => ({ ...img, primary: img.id === imageId }))
        );
      },
    });
  }

  removeImage(imageId: string): void {
    const id = this.productId();
    if (!id) return;
    this.productService.deleteImage(id, imageId).subscribe({
      next: () => {
        this.images.update(imgs => imgs.filter(img => img.id !== imageId));
      },
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const request = {
      name: raw.name,
      description: raw.description,
      brand: raw.brand,
      sku: raw.sku,
      categoryId: raw.categoryId,
      basePrice: raw.basePrice,
      ivaPercent: raw.ivaPercent,
    };

    const op$ = this.productId()
      ? this.productService.update(this.productId()!, request)
      : this.productService.create(request);

    op$.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (!this.productId()) {
          this.router.navigate(['/seller/products', res.data.id]);
        } else {
          this.formSuccess.set(true);
          setTimeout(() => this.formSuccess.set(false), 3000);
        }
      },
      error: (err) => {
        this.formError.set(err.error?.message ?? 'Error al guardar');
        this.saving.set(false);
      },
    });
  }
}
