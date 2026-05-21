import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../../shared/models/api.models';
import { Review, RatingSummary } from '../../shared/models/catalog.models';

export interface CreateReviewRequest {
  productId: string;
  orderId: string;
  rating: number;
  title?: string;
  body?: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getProductReviews(productId: string, page = 0, size = 10): Observable<ApiResponse<PageResponse<Review>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<Review>>>(
      `${this.base}/products/${productId}/reviews`,
      { params },
    );
  }

  getRatingSummary(productId: string): Observable<ApiResponse<RatingSummary>> {
    return this.http.get<ApiResponse<RatingSummary>>(
      `${this.base}/products/${productId}/reviews/summary`,
    );
  }

  getMyReviews(page = 0, size = 10): Observable<ApiResponse<PageResponse<Review>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<Review>>>(`${this.base}/reviews/me`, { params });
  }

  create(request: CreateReviewRequest): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(`${this.base}/reviews`, request);
  }

  delete(reviewId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/reviews/${reviewId}`);
  }
}
