import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api.models';
import { AddressResponse, AddressRequest } from '../../shared/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getAll(): Observable<ApiResponse<AddressResponse[]>> {
    return this.http.get<ApiResponse<AddressResponse[]>>(`${this.base}/users/me/addresses`);
  }

  create(request: AddressRequest): Observable<ApiResponse<AddressResponse>> {
    return this.http.post<ApiResponse<AddressResponse>>(`${this.base}/users/me/addresses`, request);
  }

  update(id: string, request: AddressRequest): Observable<ApiResponse<AddressResponse>> {
    return this.http.put<ApiResponse<AddressResponse>>(`${this.base}/users/me/addresses/${id}`, request);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/users/me/addresses/${id}`);
  }

  setPrimary(id: string): Observable<ApiResponse<AddressResponse>> {
    return this.http.patch<ApiResponse<AddressResponse>>(`${this.base}/users/me/addresses/${id}/set-primary`, null);
  }
}
