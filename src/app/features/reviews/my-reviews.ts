import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { ReviewService } from '../../core/catalog/review.service';
import { Review } from '../../shared/models/catalog.models';
import { ReviewStatus } from '../../shared/models/enums';

type StatusMeta = { label: string; color: string; bg: string; border: string };

const STATUS_MAP: Record<ReviewStatus, StatusMeta> = {
  PENDING:  { label: 'Pendiente', color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  APPROVED: { label: 'Aprobada',  color: 'var(--color-success)', bg: 'rgba(0,200,120,0.1)',  border: 'rgba(0,200,120,0.3)'  },
  REJECTED: { label: 'Rechazada', color: 'var(--color-error)',   bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)'  },
};

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    <div class="max-w-2xl">

      <!-- Header -->
      <div class="mb-6">
        <p class="neo-stat-label">Cuenta</p>
        <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
          Mis reseñas
        </h1>
      </div>

      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-28 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>

      } @else if (reviews().length === 0) {
        <div class="neo-card-premium p-14 flex flex-col items-center gap-4 text-center">
          <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
            <ng-icon name="lucideStar" size="26" class="text-text-muted" />
          </div>
          <div>
            <p class="text-base font-semibold text-text-primary">Sin reseñas todavía</p>
            <p class="text-sm text-text-muted mt-1">Deja tu opinión sobre los productos que compraste.</p>
          </div>
          <a routerLink="/orders" class="neo-btn-outline !text-[13px] !py-2.5 !px-5 mt-1">
            <ng-icon name="lucideClipboardList" size="14" />
            Ver mis órdenes
          </a>
        </div>

      } @else {
        <div class="flex flex-col gap-3">
          @for (review of reviews(); track review.id) {
            <div class="neo-card-premium p-5">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-0.5">
                    @for (i of [1,2,3,4,5]; track i) {
                      <ng-icon name="lucideStar" size="14"
                        [style.color]="i <= (review.rating ?? 0) ? 'rgb(251,191,36)' : 'var(--color-bg-elevated)'" />
                    }
                  </div>
                  <p class="text-[12px] text-text-muted">
                    {{ review.createdAt | date:'d MMM yyyy':'':'es' }}
                  </p>
                </div>
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0"
                  [style.color]="statusMeta(review.status).color"
                  [style.background]="statusMeta(review.status).bg"
                  [style.border-color]="statusMeta(review.status).border">
                  {{ statusMeta(review.status).label }}
                </span>
              </div>

              @if (review.title) {
                <p class="text-sm font-semibold text-text-primary mb-1.5">{{ review.title }}</p>
              }
              @if (review.body) {
                <p class="text-[13px] text-text-secondary leading-relaxed">{{ review.body }}</p>
              }

              @if (review.status === 'REJECTED' && review.rejectReason) {
                <div class="mt-3 flex items-start gap-2 text-[12px] text-error bg-error/8 rounded-[10px] border border-error/20 px-3.5 py-2.5">
                  <ng-icon name="lucideTriangleAlert" size="12" class="mt-0.5 shrink-0" />
                  <span>{{ review.rejectReason }}</span>
                </div>
              }
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-3 mt-5">
            <button (click)="prevPage()" [disabled]="page() === 0"
              class="neo-btn-outline !py-2 !px-4 !text-[13px] disabled:opacity-40 disabled:cursor-not-allowed">
              <ng-icon name="lucideChevronLeft" size="13" />
              Anterior
            </button>
            <span class="text-sm text-text-muted tabular-nums">{{ page() + 1 }} / {{ totalPages() }}</span>
            <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
              class="neo-btn-outline !py-2 !px-4 !text-[13px] disabled:opacity-40 disabled:cursor-not-allowed">
              Siguiente
              <ng-icon name="lucideChevronRight" size="13" />
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class MyReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);

  reviews    = signal<Review[]>([]);
  loading    = signal(true);
  page       = signal(0);
  totalPages = signal(0);

  statusMeta(s: ReviewStatus): StatusMeta { return STATUS_MAP[s] ?? STATUS_MAP.PENDING; }

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
