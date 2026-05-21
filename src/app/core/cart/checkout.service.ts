import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api.models';
import { Checkout, InitCheckoutRequest } from '../../shared/models/checkout.models';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  initCheckout(request: InitCheckoutRequest): Observable<ApiResponse<Checkout>> {
    return this.http.post<ApiResponse<Checkout>>(`${this.base}/checkout`, request);
  }

  getCurrent(): Observable<ApiResponse<Checkout>> {
    return this.http.get<ApiResponse<Checkout>>(`${this.base}/checkout/current`);
  }

  cancel(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/checkout/current`);
  }
}
