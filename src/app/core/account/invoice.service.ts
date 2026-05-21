import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../../shared/models/api.models';
import { Invoice } from '../../shared/models/invoice.models';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getMyInvoices(page = 0, size = 10): Observable<ApiResponse<PageResponse<Invoice>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<Invoice>>>(`${this.base}/invoices`, { params });
  }

  getByOrder(orderId: string): Observable<ApiResponse<Invoice>> {
    return this.http.get<ApiResponse<Invoice>>(`${this.base}/invoices/order/${orderId}`);
  }
}
