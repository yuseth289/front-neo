import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api.models';
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
    return this.http.post<ApiResponse<SellerResponse>>(`${this.base}/sellers`, request);
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
}
