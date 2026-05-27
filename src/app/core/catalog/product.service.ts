import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../../shared/models/api.models';
import { ProductSummary, ProductDetail, ProductFilters } from '../../shared/models/catalog.models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getCatalog(filters: ProductFilters = {}): Observable<ApiResponse<PageResponse<ProductSummary>>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);
    if (filters.sort) params = params.set('sort', filters.sort);

    return this.http.get<ApiResponse<PageResponse<ProductSummary>>>(
      `${this.base}/products`,
      { params },
    );
  }

  search(q: string, filters: ProductFilters = {}): Observable<ApiResponse<PageResponse<ProductSummary>>> {
    let params = new HttpParams()
      .set('q', q)
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);

    return this.http.get<ApiResponse<PageResponse<ProductSummary>>>(
      `${this.base}/products/search`,
      { params },
    );
  }

  getByCategory(categoryId: string, filters: ProductFilters = {}): Observable<ApiResponse<PageResponse<ProductSummary>>> {
    const params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);

    return this.http.get<ApiResponse<PageResponse<ProductSummary>>>(
      `${this.base}/products/category/${categoryId}`,
      { params },
    );
  }

  getBySlug(slug: string): Observable<ApiResponse<ProductDetail>> {
    return this.http.get<ApiResponse<ProductDetail>>(`${this.base}/products/${slug}`);
  }

  getBySeller(sellerId: string, page = 0, size = 20, sortField = 'createdAt', sortDir = 'desc'): Observable<ApiResponse<PageResponse<ProductSummary>>> {
    const params = new HttpParams()
      .set('sellerId', sellerId)
      .set('page', page)
      .set('size', size)
      .set('sort', `${sortField},${sortDir}`);
    return this.http.get<ApiResponse<PageResponse<ProductSummary>>>(`${this.base}/products`, { params });
  }
}
