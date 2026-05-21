import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../../shared/models/api.models';
import { OrderGroupStatus } from '../../shared/models/enums';

export interface SellerOrderItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SellerOrderGroup {
  id: string;
  orderId: string;
  buyerName: string;
  status: OrderGroupStatus;
  subtotal: number;
  trackingNumber: string | null;
  shippingAddress: Record<string, unknown>;
  items: SellerOrderItem[];
  createdAt: string;
}

export interface SellerOrderSummary {
  id: string;
  orderId: string;
  buyerName: string;
  status: OrderGroupStatus;
  totalItems: number;
  subtotal: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SellerOrderService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getMyOrders(page = 0, size = 20): Observable<ApiResponse<PageResponse<SellerOrderSummary>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<SellerOrderSummary>>>(
      `${this.base}/sellers/me/orders`,
      { params },
    );
  }

  getOrder(groupId: string): Observable<ApiResponse<SellerOrderGroup>> {
    return this.http.get<ApiResponse<SellerOrderGroup>>(`${this.base}/sellers/me/orders/${groupId}`);
  }

  updateStatus(groupId: string, status: OrderGroupStatus, trackingNumber?: string): Observable<ApiResponse<SellerOrderGroup>> {
    return this.http.patch<ApiResponse<SellerOrderGroup>>(
      `${this.base}/sellers/me/orders/${groupId}/status`,
      { status, trackingNumber },
    );
  }
}
