import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../../shared/models/api.models';
import {
  PublicSellerResponse,
  SellerResponse,
  RegisterSellerRequest,
  PaymentAccountResponse,
  PaymentAccountRequest,
} from '../../shared/models/seller.models';

export interface UpdateSellerRequest {
  storeName?: string;
  storeDescription?: string;
  phone?: string;
  address?: string;
  city?: string;
  department?: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class SellerService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getMe(): Observable<ApiResponse<SellerResponse>> {
    return this.http.get<ApiResponse<SellerResponse>>(`${this.base}/sellers/me`);
  }

  update(request: UpdateSellerRequest): Observable<ApiResponse<SellerResponse>> {
    return this.http.put<ApiResponse<SellerResponse>>(`${this.base}/sellers/me`, request);
  }

  register(request: RegisterSellerRequest): Observable<ApiResponse<SellerResponse>> {
    return this.http.post<ApiResponse<SellerResponse>>(`${this.base}/sellers/register`, request);
  }

  getAccounts(): Observable<ApiResponse<PaymentAccountResponse[]>> {
    return this.http.get<ApiResponse<PaymentAccountResponse[]>>(`${this.base}/sellers/me/accounts`);
  }

  addAccount(request: PaymentAccountRequest): Observable<ApiResponse<PaymentAccountResponse>> {
    return this.http.post<ApiResponse<PaymentAccountResponse>>(`${this.base}/sellers/me/accounts`, request);
  }

  activateAccount(id: string): Observable<ApiResponse<PaymentAccountResponse>> {
    return this.http.patch<ApiResponse<PaymentAccountResponse>>(
      `${this.base}/sellers/me/accounts/${id}/activate`, {},
    );
  }

  deleteAccount(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/sellers/me/accounts/${id}`);
  }

  getPublicProfile(storeSlug: string): Observable<ApiResponse<PublicSellerResponse>> {
    return this.http.get<ApiResponse<PublicSellerResponse>>(`${this.base}/sellers/${storeSlug}`);
  }

  searchStores(q: string, size = 6, page = 0): Observable<ApiResponse<PageResponse<PublicSellerResponse>>> {
    const params = new HttpParams().set('q', q).set('size', size).set('page', page);
    return this.http.get<ApiResponse<PageResponse<PublicSellerResponse>>>(`${this.base}/sellers`, { params });
  }

  getFollowedStores(): Observable<ApiResponse<PublicSellerResponse[]>> {
    return this.http.get<ApiResponse<PublicSellerResponse[]>>(`${this.base}/sellers/followed`);
  }

  isFollowing(sellerId: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.base}/sellers/${sellerId}/follow`);
  }

  follow(sellerId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/sellers/${sellerId}/follow`, {});
  }

  unfollow(sellerId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/sellers/${sellerId}/follow`);
  }
}
