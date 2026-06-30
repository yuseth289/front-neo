import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/search.models';
import { SellerAssistResultResponse, ImageEnhancementResponse, SellerBIResponse } from '../../shared/models/seller.models';

@Injectable({ providedIn: 'root' })
export class SellerAiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/ai/seller`;

  optimizeProduct(data: {
    name: string;
    description?: string;
    price?: number;
    category?: string;
    brand?: string;
    features?: string[];
    imagesBase64?: string[];
    instruction?: string;
  }): Observable<SellerAssistResultResponse> {
    const body = {
      name: data.name,
      rawDescription: data.description || null,
      priceCop: data.price || null,
      category: data.category || null,
      brand: data.brand || null,
      features: data.features ?? [],
      imagesBase64: data.imagesBase64 ?? [],
      instruction: data.instruction || null,
    };
    return this.http
      .post<ApiResponse<SellerAssistResultResponse>>(`${this.baseUrl}/optimize`, body)
      .pipe(
        map(res => res.data),
        catchError(err => throwError(() => err)),
      );
  }

  analyzeImages(name: string, images: File[], category?: string, brand?: string): Observable<SellerAssistResultResponse> {
    const fd = new FormData();
    fd.append('name', name);
    if (category) fd.append('category', category);
    if (brand) fd.append('brand', brand);
    images.forEach(img => fd.append('images', img));
    return this.http
      .post<ApiResponse<SellerAssistResultResponse>>(`${this.baseUrl}/analyze-images`, fd)
      .pipe(
        map(res => res.data),
        catchError(err => throwError(() => err)),
      );
  }

  biQuery(query: string): Observable<SellerBIResponse> {
    return this.http
      .post<ApiResponse<SellerBIResponse>>(`${this.baseUrl}/bi-query`, { query })
      .pipe(
        map(res => res.data),
        catchError(err => throwError(() => err)),
      );
  }

  enhanceImages(
    images: File[],
    operations: string[],
    productName?: string,
    generatePromotional = false,
  ): Observable<ImageEnhancementResponse> {
    const fd = new FormData();
    images.forEach(img => fd.append('images', img));
    operations.forEach(op => fd.append('operations', op));
    if (productName) fd.append('productName', productName);
    fd.append('generatePromotional', String(generatePromotional));
    return this.http
      .post<ApiResponse<ImageEnhancementResponse>>(`${this.baseUrl}/enhance-images`, fd)
      .pipe(
        map(res => res.data),
        catchError(err => throwError(() => err)),
      );
  }
}
