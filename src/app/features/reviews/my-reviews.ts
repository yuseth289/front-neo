import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { ReviewService } from '../../core/catalog/review.service';
import { Review } from '../../shared/models/catalog.models';
import { ReviewStatus } from '../../shared/models/enums';

const STATUS_LABEL: Record<ReviewStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

const STATUS_CLASS: Record<ReviewStatus, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  APPROVED: 'bg-green-500/15 text-green-400',
  REJECTED: 'bg-red-500/15 text-red-400',
};

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    <div class="max-w-2xl">
      <h1 class="text-xl font-bold text-text-primary mb-6">Mis reseñas</h1>

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-28 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (reviews().length === 0) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucideStar" size="40" />
          <p>Aún no has escrito reseñas.</p>
          <a routerLink="/catalog" class="text-sm text-accent hover:underline">Explorar productos</a>
        </div>
      } @else {
        <div class="flex flex-col gap-3">
          @for (review of reviews(); track review.id) {
            <div class="bg-bg-surface border border-border rounded-xl p-5">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p class="text-xs text-text-muted mb-1">{{ review.createdAt | date:'d MMM yyyy':'':'es' }}</p>
                  <div class="flex items-center gap-0.5">
                    @for (i of [1,2,3,4,5]; track i) {
                      <ng-icon name="lucideStar" size="13"
                        [class]="i <= review.rating ? 'text-yellow-400' : 'text-bg-elevated'" />
                    }
                  </div>
                </div>
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  [ngClass]="statusClass(review.status)">
                  {{ statusLabel(review.status) }}
                </span>
              </div>

              @if (review.title) {
                <p class="text-sm font-semibold text-text-primary mb-1">{{ review.title }}</p>
              }
              @if (review.body) {
                <p class="text-sm text-text-secondary leading-relaxed">{{ review.body }}</p>
              }

              @if (review.status === 'REJECTED' && review.rejectReason) {
                <div class="mt-3 flex items-start gap-2 text-xs text-error bg-error/10 rounded-lg px-3 py-2">
                  <ng-icon name="lucideTriangleAlert" size="12" class="mt-0.5 shrink-0" />
                  <span>{{ review.rejectReason }}</span>
                </div>
              }
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-3 mt-6">
            <button (click)="prevPage()" [disabled]="page() === 0"
              class="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary
                     hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Anterior
            </button>
            <span class="text-sm text-text-muted">{{ page() + 1 }} / {{ totalPages() }}</span>
            <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
              class="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary
                     hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Siguiente
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class MyReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);

  reviews = signal<Review[]>([]);
  loading = signal(true);
  page = signal(0);
  totalPages = signal(0);

  statusLabel(s: ReviewStatus): string { return STATUS_LABEL[s] ?? s; }
  statusClass(s: ReviewStatus): string { return STATUS_CLASS[s] ?? ''; }

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.reviewService.getMyReviews(this.page(), 10).subscribe({
      next: (res) => {
        this.reviews.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() + 1 < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
}
