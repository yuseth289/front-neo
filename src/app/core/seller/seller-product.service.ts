import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../../shared/models/api.models';
import {
  ProductSummaryResponse,
  ProductResponse,
  ProductImageResponse,
  CreateProductRequest,
  InventoryResponse,
  OfferResponse,
  CreateOfferRequest,
} from '../../shared/models/product.models';

export interface AdjustStockRequest {
  quantity: number;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class SellerProductService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getMyProducts(page = 0, size = 20): Observable<ApiResponse<PageResponse<ProductSummaryResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<ProductSummaryResponse>>>(
      `${this.base}/products/me`,
      { params },
    );
  }

  getProduct(id: string): Observable<ApiResponse<ProductResponse>> {
    return this.http.get<ApiResponse<ProductResponse>>(`${this.base}/products/me/${id}`);
  }

  create(request: CreateProductRequest): Observable<ApiResponse<ProductResponse>> {
    return this.http.post<ApiResponse<ProductResponse>>(`${this.base}/products`, request);
  }

  update(id: string, request: Partial<CreateProductRequest>): Observable<ApiResponse<ProductResponse>> {
    return this.http.put<ApiResponse<ProductResponse>>(`${this.base}/products/me/${id}`, request);
  }

  publish(id: string): Observable<ApiResponse<ProductResponse>> {
    return this.http.patch<ApiResponse<ProductResponse>>(`${this.base}/products/me/${id}/publish`, {});
  }

  pause(id: string): Observable<ApiResponse<ProductResponse>> {
    return this.http.patch<ApiResponse<ProductResponse>>(`${this.base}/products/me/${id}/pause`, {});
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/products/me/${id}`);
  }

  getInventory(productId: string): Observable<ApiResponse<InventoryResponse>> {
    return this.http.get<ApiResponse<InventoryResponse>>(`${this.base}/products/${productId}/inventory`);
  }

  adjustStock(productId: string, request: AdjustStockRequest): Observable<ApiResponse<InventoryResponse>> {
    return this.http.post<ApiResponse<InventoryResponse>>(
      `${this.base}/products/${productId}/inventory/adjust`,
      request,
    );
  }

  getOffers(productId: string): Observable<ApiResponse<OfferResponse[]>> {
    return this.http.get<ApiResponse<OfferResponse[]>>(`${this.base}/products/${productId}/offers`);
  }

  createOffer(productId: string, request: CreateOfferRequest): Observable<ApiResponse<OfferResponse>> {
    return this.http.post<ApiResponse<OfferResponse>>(`${this.base}/products/${productId}/offers`, request);
  }

  deleteOffer(productId: string, offerId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/products/${productId}/offers/${offerId}`);
  }

  addImage(productId: string, url: string, altText?: string, sortOrder = 0): Observable<ApiResponse<ProductImageResponse>> {
    return this.http.post<ApiResponse<ProductImageResponse>>(
      `${this.base}/products/me/${productId}/images`,
      { url, altText, sortOrder },
    );
  }

  setPrimaryImage(productId: string, imageId: string): Observable<ApiResponse<ProductImageResponse>> {
    return this.http.patch<ApiResponse<ProductImageResponse>>(
      `${this.base}/products/me/${productId}/images/${imageId}/primary`,
      {},
    );
  }

  deleteImage(productId: string, imageId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.base}/products/me/${productId}/images/${imageId}`,
    );
  }
}
