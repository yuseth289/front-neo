import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api.models';
import {
  LoginRequest,
  RegisterRequest,
  RefreshRequest,
  TokenResponse,
  UserResponse,
} from '../../shared/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  login(credentials: LoginRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(
      `${this.base}/auth/login`,
      credentials,
    );
  }

  register(data: RegisterRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(
      `${this.base}/auth/register`,
      data,
    );
  }

  refresh(request: RefreshRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(
      `${this.base}/auth/refresh`,
      request,
    );
  }

  logout(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/auth/logout`, {});
  }

  googleLogin(idToken: string): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(
      `${this.base}/auth/google`,
      { idToken },
    );
  }

  getMe(): Observable<ApiResponse<UserResponse>> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.base}/users/me`);
  }
}
