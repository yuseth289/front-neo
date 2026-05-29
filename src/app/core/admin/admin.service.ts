import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../../shared/models/api.models';
import { SellerResponse } from '../../shared/models/seller.models';
import { UserResponse } from '../../shared/models/auth.models';
import { ConversationResponse } from '../../shared/models/chat.models';
import { Review, Brand } from '../../shared/models/catalog.models';
import { Invoice } from '../../shared/models/invoice.models';
import { SellerStatus, UserStatus } from '../../shared/models/enums';

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  imageUrl: string | null;
  productCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ── Sellers ──────────────────────────────────────────────────────────────

  getSellers(page = 0, size = 20, status?: SellerStatus, q?: string): Observable<ApiResponse<PageResponse<SellerResponse>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<ApiResponse<PageResponse<SellerResponse>>>(`${this.base}/admin/sellers`, { params });
  }

  approveSeller(id: string): Observable<ApiResponse<SellerResponse>> {
    return this.http.patch<ApiResponse<SellerResponse>>(`${this.base}/admin/sellers/${id}/approve`, {});
  }

  suspendSeller(id: string): Observable<ApiResponse<SellerResponse>> {
    return this.http.patch<ApiResponse<SellerResponse>>(`${this.base}/admin/sellers/${id}/suspend`, {});
  }

  reactivateSeller(id: string): Observable<ApiResponse<SellerResponse>> {
    return this.http.patch<ApiResponse<SellerResponse>>(`${this.base}/admin/sellers/${id}/reactivate`, {});
  }

  // ── Users ────────────────────────────────────────────────────────────────

  getUsers(page = 0, size = 20, status?: UserStatus, q?: string): Observable<ApiResponse<PageResponse<UserResponse>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<ApiResponse<PageResponse<UserResponse>>>(`${this.base}/admin/users`, { params });
  }

  suspendUser(id: string): Observable<ApiResponse<UserResponse>> {
    return this.http.patch<ApiResponse<UserResponse>>(`${this.base}/admin/users/${id}/suspend`, {});
  }

  reactivateUser(id: string): Observable<ApiResponse<UserResponse>> {
    return this.http.patch<ApiResponse<UserResponse>>(`${this.base}/admin/users/${id}/reactivate`, {});
  }

  startConversationWithUser(id: string, firstMessage: string): Observable<ApiResponse<ConversationResponse>> {
    return this.http.post<ApiResponse<ConversationResponse>>(`${this.base}/admin/users/${id}/conversations`, { firstMessage });
  }

  // ── Reviews ──────────────────────────────────────────────────────────────

  createAdminReview(request: {
    productId: string;
    buyerName: string;
    rating: number;
    title?: string;
    body?: string;
  }): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(`${this.base}/admin/reviews`, request);
  }

  getAdminReviews(page = 0, size = 20, status = 'APPROVED'): Observable<ApiResponse<PageResponse<Review>>> {
    const params = new HttpParams().set('page', page).set('size', size).set('status', status);
    return this.http.get<ApiResponse<PageResponse<Review>>>(`${this.base}/admin/reviews`, { params });
  }

  // ── Categories ───────────────────────────────────────────────────────────

  getCategories(): Observable<ApiResponse<AdminCategory[]>> {
    return this.http.get<ApiResponse<AdminCategory[]>>(`${this.base}/categories`);
  }

  createCategory(request: CreateCategoryRequest): Observable<ApiResponse<AdminCategory>> {
    return this.http.post<ApiResponse<AdminCategory>>(`${this.base}/categories`, request);
  }

  updateCategory(id: string, request: Partial<CreateCategoryRequest>): Observable<ApiResponse<AdminCategory>> {
    return this.http.put<ApiResponse<AdminCategory>>(`${this.base}/categories/${id}`, request);
  }

  deleteCategory(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/categories/${id}`);
  }

  // ── Brands ───────────────────────────────────────────────────────────────

  getBrands(): Observable<ApiResponse<Brand[]>> {
    return this.http.get<ApiResponse<Brand[]>>(`${this.base}/brands/all`);
  }

  createBrand(request: { name: string; displayOrder: number }): Observable<ApiResponse<Brand>> {
    return this.http.post<ApiResponse<Brand>>(`${this.base}/brands`, request);
  }

  updateBrand(id: string, request: { name: string; displayOrder: number }): Observable<ApiResponse<Brand>> {
    return this.http.put<ApiResponse<Brand>>(`${this.base}/brands/${id}`, request);
  }

  deleteBrand(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/brands/${id}`);
  }

  activateBrand(id: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.base}/brands/${id}/activate`, {});
  }

  // ── Invoices ─────────────────────────────────────────────────────────────

  getInvoices(page = 0, size = 20): Observable<ApiResponse<PageResponse<Invoice>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<Invoice>>>(`${this.base}/admin/invoices`, { params });
  }

  cancelInvoice(id: string, reason: string): Observable<ApiResponse<Invoice>> {
    return this.http.patch<ApiResponse<Invoice>>(`${this.base}/admin/invoices/${id}/cancel`, { reason });
  }
}
