import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api.models';
import { Cart, AddCartItemRequest } from '../../shared/models/cart.models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getCart(): Observable<ApiResponse<Cart>> {
    return this.http.get<ApiResponse<Cart>>(`${this.base}/cart`);
  }

  addItem(request: AddCartItemRequest): Observable<ApiResponse<Cart>> {
    return this.http.post<ApiResponse<Cart>>(`${this.base}/cart/items`, request);
  }

  updateItem(itemId: string, quantity: number): Observable<ApiResponse<Cart>> {
    const params = new HttpParams().set('quantity', quantity);
    return this.http.patch<ApiResponse<Cart>>(`${this.base}/cart/items/${itemId}`, null, { params });
  }

  removeItem(itemId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/cart/items/${itemId}`);
  }

  clearCart(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/cart`);
  }
}
