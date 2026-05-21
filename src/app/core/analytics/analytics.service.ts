import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api.models';

export interface TopProducto {
  productId: string;
  productName: string;
  unidadesVendidas: number;
  ingresosTotales: number;
  ordenes: number;
}

export interface SellerDashboard {
  ordenesEsteMes: number;
  ingresosEsteMes: number;
  unidadesVendidasEsteMes: number;
  ordenesMesAnterior: number;
  ingresosMesAnterior: number;
  ordenesTotales: number;
  ingresosTotales: number;
  ordenesPendientes: number;
  ordenesEnPreparacion: number;
  ordenesEnviadas: number;
  topProductos: TopProducto[];
  promedioCalificacion: number;
  totalResenas: number;
}

export interface AdminDashboard {
  totalUsuarios: number;
  usuariosNuevosEsteMes: number;
  totalVendedores: number;
  vendedoresPendientesAprobacion: number;
  ordenesTotales: number;
  ordenesEsteMes: number;
  ordenesPendientes: number;
  ingresosTotales: number;
  ingresosEsteMes: number;
  comisionesEsteMes: number;
  pagosAprobadosEsteMes: number;
  pagosRechazadosEsteMes: number;
  montoAprobadoEsteMes: number;
  totalProductosActivos: number;
  productosPendientesRevision: number;
  topProductos: TopProducto[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getSellerAnalytics(): Observable<ApiResponse<SellerDashboard>> {
    return this.http.get<ApiResponse<SellerDashboard>>(`${this.base}/analytics/seller`);
  }

  getAdminAnalytics(): Observable<ApiResponse<AdminDashboard>> {
    return this.http.get<ApiResponse<AdminDashboard>>(`${this.base}/analytics/admin`);
  }
}
