import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse, SearchResultResponse } from '../../shared/models/search.models';
import { selectAccessToken } from '../auth/store/auth.selectors';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SearchAiService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(Store);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/ai/search`;

  intelligentSearch(query: string, clarification?: string): Observable<SearchResultResponse> {
    return this.http
      .post<ApiResponse<SearchResultResponse>>(`${this.baseUrl}/intelligent`, { query, clarification })
      .pipe(
        map(res => res.data),
        catchError(err => throwError(() => err)),
      );
  }

  intelligentSearchStream(query: string): Observable<string> {
    return new Observable<string>(observer => {
      const controller = new AbortController();
      const token = this.store.selectSignal(selectAccessToken)();

      fetch(`${this.baseUrl}/intelligent/stream?query=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        signal: controller.signal,
      })
        .then(res => {
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          const pump = (): void => {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  observer.complete();
                  return;
                }
                observer.next(decoder.decode(value, { stream: true }));
                pump();
              })
              .catch((e: unknown) => observer.error(e));
          };
          pump();
        })
        .catch((e: unknown) => observer.error(e));

      return () => controller.abort();
    });
  }
}
