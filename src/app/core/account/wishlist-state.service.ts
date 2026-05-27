import { Injectable, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { WishlistService } from './wishlist.service';
import { selectIsAuthenticated } from '../auth/store/auth.selectors';

@Injectable({ providedIn: 'root' })
export class WishlistStateService {
  private wishlistService = inject(WishlistService);
  private store = inject(Store);

  readonly productIds = signal<Set<string>>(new Set());

  constructor() {
    this.store.select(selectIsAuthenticated).subscribe(isAuth => {
      if (isAuth) {
        this.loadProductIds();
      } else {
        this.productIds.set(new Set());
      }
    });
  }

  isInWishlist(productId: string): boolean {
    return this.productIds().has(productId);
  }

  toggle(productId: string): void {
    const prev = new Set(this.productIds());
    const next = new Set(prev);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    this.productIds.set(next);

    this.wishlistService.toggleItem(productId).subscribe({
      next: (res) => {
        this.productIds.set(new Set(res.data.items.map(i => i.productId)));
      },
      error: () => {
        this.productIds.set(prev);
      },
    });
  }

  loadProductIds(): void {
    this.wishlistService.getMyProductIds().subscribe({
      next: (res) => this.productIds.set(new Set(res.data)),
      error: () => {},
    });
  }
}
