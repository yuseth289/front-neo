import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api.models';

/**
 * Respuesta del backend al iniciar un pago.
 * El campo checkoutUrl es la URL de Checkout Pro de Mercado Pago
 * (sandbox_init_point en desarrollo, init_point en producción).
 */
export interface PaymentInitResponse {
  id: string;
  checkoutUrl: string;
  mpPreferenceId: string;
  status: string;
}

/**
 * Servicio de integración con el endpoint de pagos de Mercado Pago.
 *
 * Flujo hosted checkout:
 *  1. iniciarPago() → POST /payments/checkout/:checkoutId
 *  2. El backend crea la preferencia en MP y devuelve checkoutUrl
 *  3. redirectToMercadoPago() navega a esa URL (Hosted Checkout Pro de MP)
 *  4. El usuario paga en la interfaz de MP
 *  5. MP redirige de vuelta a la back_url configurada:
 *     - Aprobado:  /checkout/result?status=success
 *     - Pendiente: /checkout/result?status=pending  (PSE, Efecty)
 *     - Rechazado: /checkout/result?status=failed
 *
 * Nota: NeoGaming usa "hosted" frontend_style — no se embebe el SDK de MP
 * en el frontend. El usuario es redirigido al dominio de Mercado Pago.
 * Esto elimina el riesgo de manejar datos de tarjeta en el frontend.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  /**
   * Solicita al backend la creación de una preferencia de pago en MP
   * y obtiene la URL del Checkout Pro para redirigir al usuario.
   *
   * @param checkoutId UUID del checkout activo
   */
  iniciarPago(checkoutId: string): Observable<ApiResponse<PaymentInitResponse>> {
    return this.http.post<ApiResponse<PaymentInitResponse>>(
      `${this.base}/payments/checkout/${checkoutId}`,
      {}
    );
  }

  /**
   * Redirige al usuario al Checkout Pro de Mercado Pago.
   *
   * Usa window.location.href para una navegación completa (no Angular Router)
   * ya que la URL pertenece al dominio de MP, no a NeoGaming.
   *
   * @param checkoutUrl URL de MP (init_point o sandbox_init_point)
   */
  redirectToMercadoPago(checkoutUrl: string): void {
    if (!checkoutUrl || !checkoutUrl.startsWith('https://')) {
      return;
    }
    window.location.href = checkoutUrl;
  }

  /**
   * Método combinado: solicita la preferencia y redirige automáticamente a MP.
   * Usar en el checkout page cuando el usuario confirma el pago.
   *
   * @param checkoutId UUID del checkout activo
   */
  iniciarYRedirigir(checkoutId: string): Observable<ApiResponse<PaymentInitResponse>> {
    return this.iniciarPago(checkoutId).pipe(
      tap((res) => {
        if (res.data?.checkoutUrl) {
          this.redirectToMercadoPago(res.data.checkoutUrl);
        }
      })
    );
  }
}
