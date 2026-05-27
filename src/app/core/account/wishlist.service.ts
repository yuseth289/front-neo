import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api.models';
import { Wishlist, CreateWishlistRequest } from '../../shared/models/wishlist.models';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getAll(): Observable<ApiResponse<Wishlist[]>> {
    return this.http.get<ApiResponse<Wishlist[]>>(`${this.base}/wishlists`);
  }

  getById(id: string): Observable<ApiResponse<Wishlist>> {
    return this.http.get<ApiResponse<Wishlist>>(`${this.base}/wishlists/${id}`);
  }

  create(request: CreateWishlistRequest): Observable<ApiResponse<Wishlist>> {
    return this.http.post<ApiResponse<Wishlist>>(`${this.base}/wishlists`, request);
  }

  update(id: string, request: CreateWishlistRequest): Observable<ApiResponse<Wishlist>> {
    return this.http.put<ApiResponse<Wishlist>>(`${this.base}/wishlists/${id}`, request);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/wishlists/${id}`);
  }

  addItem(wishlistId: string, productId: string): Observable<ApiResponse<Wishlist>> {
    return this.http.post<ApiResponse<Wishlist>>(`${this.base}/wishlists/${wishlistId}/items/${productId}`, null);
  }

  removeItem(wishlistId: string, productId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/wishlists/${wishlistId}/items/${productId}`);
  }

  getPublic(id: string): Observable<ApiResponse<Wishlist>> {
    return this.http.get<ApiResponse<Wishlist>>(`${this.base}/wishlists/public/${id}`);
  }

  getMyWishlist(): Observable<ApiResponse<Wishlist>> {
    return this.http.get<ApiResponse<Wishlist>>(`${this.base}/wishlists/my`);
  }

  toggleItem(productId: string): Observable<ApiResponse<Wishlist>> {
    return this.http.post<ApiResponse<Wishlist>>(`${this.base}/wishlists/my/toggle/${productId}`, null);
  }

  getMyProductIds(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.base}/wishlists/my/product-ids`);
  }
}
