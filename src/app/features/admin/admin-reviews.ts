import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { AdminService } from '../../core/admin/admin.service';
import { Review } from '../../shared/models/catalog.models';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-3xl">
      <h1 class="text-xl font-bold text-text-primary mb-6">Moderación de reseñas</h1>

      @if (loading()) {
        <div class="space-y-4">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-28 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (reviews().length === 0) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucideShieldCheck" size="40" />
          <p>No hay reseñas pendientes de moderación.</p>
        </div>
      } @else {
        <div class="flex flex-col gap-4">
          @for (review of reviews(); track review.id) {
            <div class="bg-bg-surface border border-border rounded-xl p-5">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p class="text-sm font-medium text-text-primary">{{ review.buyerName }}</p>
                  <div class="flex items-center gap-1 mt-0.5">
                    @for (i of [1,2,3,4,5]; track i) {
                      <ng-icon name="lucideStar" size="12"
                        [class]="i <= review.rating ? 'text-yellow-400' : 'text-bg-elevated'" />
                    }
                    <span class="text-xs text-text-muted ml-1">{{ review.createdAt | date:'d MMM yyyy':'':'es' }}</span>
                  </div>
                </div>
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 shrink-0">
                  Pendiente
                </span>
              </div>

              @if (review.title) {
                <p class="text-sm font-semibold text-text-primary mb-1">{{ review.title }}</p>
              }
              @if (review.body) {
                <p class="text-sm text-text-secondary leading-relaxed mb-4">{{ review.body }}</p>
              }

              @if (rejectingId() === review.id) {
                <div class="mb-3">
                  <form [formGroup]="rejectForm" (ngSubmit)="confirmReject(review.id)" novalidate class="flex gap-2">
                    <input type="text" formControlName="reason" placeholder="Motivo del rechazo"
                      class="flex-1 rounded-lg bg-bg-elevated border border-border px-3 py-1.5 text-sm text-text-primary
                             focus:outline-none focus:border-accent transition-colors" />
                    <button type="submit" [disabled]="processing() === review.id"
                      class="px-3 py-1.5 rounded-lg text-xs font-medium bg-error/15 text-error hover:bg-error/25 disabled:opacity-50 transition-colors flex items-center gap-1">
                      @if (processing() === review.id) { <ng-icon name="lucideRefreshCw" size="11" class="animate-spin" /> }
                      Rechazar
                    </button>
                    <button type="button" (click)="cancelReject()"
                      class="px-3 py-1.5 rounded-lg text-xs border border-border text-text-secondary transition-colors">
                      Cancelar
                    </button>
                  </form>
                </div>
              } @else {
                <div class="flex gap-2">
                  <button (click)="approve(review)"
                    [disabled]="processing() === review.id"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-400
                           hover:bg-green-500/25 disabled:opacity-50 transition-colors flex items-center gap-1">
                    @if (processing() === review.id) { <ng-icon name="lucideRefreshCw" size="11" class="animate-spin" /> }
                    <ng-icon name="lucideCheck" size="12" />
                    Aprobar
                  </button>
                  <button (click)="startReject(review.id)"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-text-secondary
                           hover:border-error hover:text-error transition-colors flex items-center gap-1">
                    <ng-icon name="lucideX" size="12" />
                    Rechazar
                  </button>
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
export class AdminReviewsComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  reviews = signal<Review[]>([]);
  loading = signal(true);
  page = signal(0);
  totalPages = signal(0);
  processing = signal<string | null>(null);
  rejectingId = signal<string | null>(null);

  rejectForm = this.fb.nonNullable.group({
    reason: ['', Validators.required],
  });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.adminService.getPendingReviews(this.page(), 10).subscribe({
      next: (res) => {
        this.reviews.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  approve(review: Review): void {
    this.processing.set(review.id);
    this.adminService.approveReview(review.id).subscribe({
      next: () => { this.reviews.update(list => list.filter(r => r.id !== review.id)); this.processing.set(null); },
      error: () => this.processing.set(null),
    });
  }

  startReject(id: string): void {
    this.rejectingId.set(id);
    this.rejectForm.reset();
  }

  cancelReject(): void { this.rejectingId.set(null); }

  confirmReject(id: string): void {
    if (this.rejectForm.invalid) { this.rejectForm.markAllAsTouched(); return; }
    this.processing.set(id);
    this.adminService.rejectReview(id, this.rejectForm.getRawValue().reason).subscribe({
      next: () => { this.reviews.update(list => list.filter(r => r.id !== id)); this.processing.set(null); this.rejectingId.set(null); },
      error: () => this.processing.set(null),
    });
  }

  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() + 1 < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
}
