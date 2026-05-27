import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/search.models';
import { AnalyticsResultResponse } from '../../shared/models/analytics.models';

@Injectable({ providedIn: 'root' })
export class AnalyticsAiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/ai/admin/analytics`;

  analyticsQuery(query: string): Observable<AnalyticsResultResponse> {
    return this.http
      .post<ApiResponse<AnalyticsResultResponse>>(`${this.baseUrl}/query`, { query })
      .pipe(
        map(res => res.data),
        catchError(err => throwError(() => err)),
      );
  }

  getReport(type: string): Observable<AnalyticsResultResponse> {
    return this.http
      .get<ApiResponse<AnalyticsResultResponse>>(`${this.baseUrl}/report/${type}`)
      .pipe(
        map(res => res.data),
        catchError(err => throwError(() => err)),
      );
  }
}
