import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { ProductService } from '../../../core/catalog/product.service';
import { CategoryService } from '../../../core/catalog/category.service';
import { ProductSummary, Category } from '../../../shared/models/catalog.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgIcon, ProductCardComponent],
  template: `
    <div>

      <!-- ── HERO ──────────────────────────────────────────────────────── -->
      <section class="relative overflow-hidden bg-bg-base border-b border-border">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,theme(colors.accent-glow),transparent)]"></div>
        <div class="relative max-w-7xl mx-auto px-4 py-20 flex flex-col items-center text-center gap-6">
          <h1 class="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-text-primary">
            El marketplace<br/>
            <span class="text-accent">gamer</span> de Colombia
          </h1>
          <p class="max-w-xl text-text-secondary text-lg">
            Equipos, periféricos y videojuegos de los mejores vendedores del país.
            Precios en COP, envío a todo el territorio nacional.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <a routerLink="/catalog"
               class="px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover font-semibold text-white transition-colors shadow-[0_0_24px_theme(colors.accent-glow)]">
              Ver catálogo
            </a>
            <a routerLink="/register"
               class="px-6 py-3 rounded-lg border border-border hover:border-accent/60 text-text-secondary hover:text-text-primary transition-colors font-medium">
              Crear cuenta gratis
            </a>
          </div>
        </div>
      </section>

      <!-- ── CATEGORÍAS ────────────────────────────────────────────────── -->
      @if (categories().length > 0) {
        <section class="max-w-7xl mx-auto px-4 py-12">
          <h2 class="text-xl font-bold text-text-primary mb-6">Explorar por categoría</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            @for (cat of categories(); track cat.id) {
              <a [routerLink]="['/catalog/category', cat.id]"
                 class="flex flex-col items-center gap-2 p-4 rounded-xl bg-bg-surface border border-border
                        hover:border-accent/50 hover:bg-bg-elevated transition-all text-center group">
                @if (cat.imageUrl) {
                  <img [src]="cat.imageUrl" [alt]="cat.name" class="w-10 h-10 object-contain" />
                } @else {
                  <div class="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center">
                    <ng-icon name="lucideTag" size="20" class="text-text-muted" />
                  </div>
                }
                <span class="text-xs text-text-secondary group-hover:text-text-primary transition-colors font-medium leading-tight">
                  {{ cat.name }}
                </span>
              </a>
            }
          </div>
        </section>
      }

      <!-- ── PRODUCTOS DESTACADOS ──────────────────────────────────────── -->
      <section class="max-w-7xl mx-auto px-4 pb-16">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-text-primary">Productos destacados</h2>
          <a routerLink="/catalog" class="text-sm text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
            Ver todos
            <ng-icon name="lucideChevronRight" size="14" />
          </a>
        </div>

        @if (loading()) {
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            @for (_ of skeletons; track $index) {
              <div class="aspect-square rounded-xl bg-bg-surface border border-border animate-pulse"></div>
            }
          </div>
        } @else if (products().length === 0) {
          <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
            <ng-icon name="lucidePackage" size="40" />
            <p>No hay productos disponibles aún.</p>
          </div>
        } @else {
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            @for (product of products(); track product.id) {
              <app-product-card [product]="product" />
            }
          </div>
        }
      </section>

    </div>
  `,
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  products = signal<ProductSummary[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  readonly skeletons = Array(10);

  ngOnInit(): void {
    this.categoryService.getTree().subscribe({
      next: (res) => this.categories.set(res.data.slice(0, 12)),
      error: () => {},
    });

    this.productService.getCatalog({ size: 10 }).subscribe({
      next: (res) => {
        this.products.set(res.data.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
