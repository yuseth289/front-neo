import { Injectable, signal } from '@angular/core';

/**
 * Coordina el FAB global del layout del vendedor (en seller-layout) con el
 * Asistente IA especifico de la pagina de crear/editar producto (renderizado
 * dentro del router-outlet, fuera del alcance directo del layout).
 *
 * En rutas de producto, el FAB debe abrir el asistente de producto en vez
 * del panel generico de Seller Analytics.
 */
@Injectable({ providedIn: 'root' })
export class SellerAiTriggerService {
  readonly genericChatOpen  = signal(false);
  readonly productChatOpen  = signal(false);
  private readonly productChatRequests = signal(0);

  toggleGenericChat(): void {
    this.genericChatOpen.update(v => !v);
  }

  requestProductChat(): void {
    this.productChatRequests.update(v => v + 1);
  }

  setProductChatOpen(open: boolean): void {
    this.productChatOpen.set(open);
  }

  readonly productChatRequested = this.productChatRequests.asReadonly();
}
