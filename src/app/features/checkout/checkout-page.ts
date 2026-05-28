import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { CheckoutService } from '../../core/cart/checkout.service';
import { PaymentService } from '../../core/cart/payment.service';
import { AddressService } from '../../core/account/address.service';
import { selectCartItems, selectCartTotal } from '../../core/cart/store/cart.selectors';
import { AddressResponse } from '../../shared/models/auth.models';


@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon, CopCurrencyPipe],
  template: `
    <div class="relative">
      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-20"></div>
        <span class="neo-orb red"  style="width:400px;height:400px;top:-5%;right:-5%;opacity:0.1;"></span>
        <span class="neo-orb cyan" style="width:320px;height:320px;bottom:0%;left:-5%;opacity:0.08;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-[1100px] mx-auto px-4 py-8">

        <!-- Header -->
        <div class="neo-reveal mb-6">
          <p class="neo-stat-label">Pago seguro</p>
          <h1 class="font-display text-[32px] font-bold tracking-[-0.02em] text-text-primary mt-1">
            Finaliza tu compra
          </h1>
        </div>

        <!-- Step indicator -->
        <div class="neo-reveal mb-7">
          <div class="flex items-center gap-0">
            @for (step of steps; track $index) {
              <div class="flex items-center"
                   [class.flex-1]="$index < steps.length - 1">
                <!-- Step pill -->
                <div class="flex items-center gap-2 shrink-0">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all"
                    [style.background]="$index < currentStep() ? 'var(--color-success)' :
                                        $index === currentStep() ? 'var(--color-accent)' : 'var(--color-bg-elevated)'"
                    [style.border-color]="$index < currentStep() ? 'var(--color-success)' :
                                          $index === currentStep() ? 'var(--color-accent)' : 'var(--color-border)'"
                    [style.box-shadow]="$index === currentStep() ? '0 0 12px var(--color-accent-glow)' : 'none'"
                    [style.color]="$index <= currentStep() ? 'white' : 'var(--color-text-muted)'">
                    @if ($index < currentStep()) {
                      <ng-icon name="lucideCheck" size="12" />
                    } @else {
                      {{ $index + 1 }}
                    }
                  </div>
                  <span class="text-[12px] font-medium hidden sm:block"
                    [style.color]="$index === currentStep() ? 'var(--color-text-primary)' : 'var(--color-text-muted)'">
                    {{ step }}
                  </span>
                </div>
                <!-- Connector line -->
                @if ($index < steps.length - 1) {
                  <div class="flex-1 h-px mx-3 transition-colors"
                    [style.background]="$index < currentStep() ? 'var(--color-success)' : 'var(--color-border)'">
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Error -->
        @if (error()) {
          <div class="mb-5 flex items-center gap-2 rounded-[10px] bg-error/10 border border-error/30
                      px-3.5 py-2.5 text-sm text-error neo-reveal">
            <ng-icon name="lucideTriangleAlert" size="16" /><span>{{ error() }}</span>
          </div>
        }

        <div class="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

          <!-- Left: form -->
          <div class="flex flex-col gap-5 neo-reveal" [formGroup]="form">

            <!-- Dirección de entrega -->
            <div class="neo-card-premium p-5">
              <div class="flex items-start gap-3 mb-4">
                <div class="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
                  <ng-icon name="lucideMapPin" size="15" class="text-accent" />
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-text-primary">Dirección de entrega</h2>
                  <p class="text-[12px] text-text-muted mt-0.5">¿Dónde enviamos tu pedido?</p>
                </div>
              </div>

              @if (loadingAddresses()) {
                <div class="h-20 rounded-[10px] bg-bg-elevated animate-pulse"></div>
              } @else if (addresses().length === 0) {
                <div class="flex flex-col gap-2 py-2">
                  <p class="text-sm text-text-muted">No tienes direcciones guardadas.</p>
                  <a routerLink="/account/addresses"
                     class="neo-btn-outline !text-[12px] !py-1.5 !px-3 self-start">
                    <ng-icon name="lucidePlus" size="12" /> Agregar dirección
                  </a>
                </div>
              } @else {
                <div class="flex flex-col gap-2">
                  @for (addr of addresses(); track addr.id) {
                    <label class="flex items-start gap-3 p-3.5 rounded-[10px] border cursor-pointer
                                  transition-all duration-200"
                      [style.border-color]="form.get('addressId')?.value === addr.id
                        ? 'var(--color-accent)' : 'var(--color-border)'"
                      [style.background]="form.get('addressId')?.value === addr.id
                        ? 'var(--color-accent-soft)' : 'transparent'"
                      [style.box-shadow]="form.get('addressId')?.value === addr.id
                        ? '0 0 12px var(--color-accent-glow)' : 'none'">
                      <input type="radio" formControlName="addressId" [value]="addr.id"
                             class="mt-0.5 accent-[var(--color-accent)] shrink-0" />
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-text-primary flex items-center gap-1.5 flex-wrap">
                          {{ addr.label }}
                          @if (addr.primary) {
                            <span class="text-[10px] text-accent font-semibold font-mono uppercase tracking-wide">Principal</span>
                          }
                        </p>
                        <p class="text-xs text-text-secondary mt-0.5 leading-snug">
                          {{ addr.street }} {{ addr.number }}
                          @if (addr.apartment) { , Apto {{ addr.apartment }} }
                          — {{ addr.city }}, {{ addr.department }}
                        </p>
                      </div>
                    </label>
                  }
                </div>
              }
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-3">
              <button type="button" (click)="submit()"
                [disabled]="form.invalid || submitting()"
                class="neo-btn-primary !py-3.5 !px-6 disabled:opacity-50 disabled:cursor-not-allowed">
                @if (submitting()) {
                  <ng-icon name="lucideRefreshCw" size="15" class="neo-spin" />
                  Procesando…
                } @else {
                  <ng-icon name="lucideShield" size="15" />
                  Confirmar y pagar
                  <ng-icon name="lucideArrowRight" size="14" />
                }
              </button>
              <a routerLink="/cart" class="neo-btn-outline !py-3.5 !px-4">
                <ng-icon name="lucideChevronLeft" size="14" />
                Carrito
              </a>
            </div>

          </div><!-- /left -->

          <!-- Right: sticky summary -->
          <aside style="position:sticky;top:92px;">

            <!-- Order items -->
            <div class="neo-card-premium p-5 neo-reveal">
              <p class="text-[13px] font-semibold text-text-primary mb-4">Resumen del pedido</p>

              <div class="flex flex-col gap-3 mb-4">
                @for (item of items$ | async; track item.id) {
                  <div class="flex gap-2.5 items-start">
                    <div class="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-bg-elevated border border-border">
                      @if (item.productImageUrl) {
                        <img [src]="item.productImageUrl" [alt]="item.productName"
                             class="w-full h-full object-cover" />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center">
                          <ng-icon name="lucidePackage" size="16" class="text-text-muted" />
                        </div>
                      }
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[12px] text-text-secondary leading-snug line-clamp-2">
                        {{ item.productName }}
                      </p>
                      <p class="text-[11px] text-text-muted font-mono mt-0.5">× {{ item.quantity }}</p>
                    </div>
                    <span class="text-[13px] font-semibold text-text-primary tabular-nums shrink-0">
                      {{ item.subtotal | copCurrency }}
                    </span>
                  </div>
                }
              </div>

              <div class="border-t border-border pt-4 flex flex-col gap-2 text-[13px]">
                <div class="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span class="text-text-primary tabular-nums">{{ total$ | async | copCurrency }}</span>
                </div>
                <div class="flex justify-between text-text-secondary">
                  <span>Envío</span>
                  <span class="text-success font-medium">A confirmar</span>
                </div>
                <div class="flex justify-between items-baseline pt-3 border-t border-border mt-1">
                  <span class="font-semibold text-text-primary">Total</span>
                  <span class="font-display text-[20px] font-bold text-text-primary tabular-nums">
                    {{ total$ | async | copCurrency }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Security badge -->
            <div class="flex items-center gap-2.5 mt-3 px-4 py-3 rounded-[10px]
                        bg-bg-surface border border-border neo-reveal">
              <ng-icon name="lucideShieldCheck" size="16" class="text-success shrink-0" />
              <p class="text-xs text-text-secondary leading-snug">
                Tu pago está protegido con cifrado 3-D Secure.
                <a class="text-accent hover:underline ml-0.5">Política de devoluciones</a>
              </p>
            </div>

          </aside>
        </div>
      </div>
    </div>
  `,
})
export class CheckoutPageComponent implements OnInit {
  private store           = inject(Store);
  private fb              = inject(FormBuilder);
  private checkoutService = inject(CheckoutService);
  private paymentService  = inject(PaymentService);
  private addressService  = inject(AddressService);
  items$ = this.store.select(selectCartItems);
  total$ = this.store.select(selectCartTotal);

  addresses        = signal<AddressResponse[]>([]);
  loadingAddresses = signal(true);
  submitting       = signal(false);
  error            = signal<string | null>(null);
  currentStep      = signal(1);

  readonly steps = ['Carrito', 'Pago', 'Confirmación'];

  form = this.fb.nonNullable.group({
    addressId: ['', Validators.required],
  });

  ngOnInit(): void {
    this.addressService.getAll().subscribe({
      next: (res) => {
        this.addresses.set(res.data);
        this.loadingAddresses.set(false);
        const primary = res.data.find((a) => a.primary);
        if (primary) this.form.patchValue({ addressId: primary.id });
      },
      error: () => this.loadingAddresses.set(false),
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.error.set(null);
    const { addressId } = this.form.getRawValue();

    // Paso 1: crear el checkout en el backend
    // paymentMethod lo gestiona MercadoPago Checkout Pro en su propia pantalla
    this.checkoutService.initCheckout({ addressId, paymentMethod: 'MP_CHECKOUT_PRO' }).subscribe({
      next: (checkoutRes) => {
        const checkoutId = checkoutRes.data?.id;
        if (!checkoutId) {
          this.error.set('No se pudo obtener el checkout. Inténtalo de nuevo.');
          this.submitting.set(false);
          return;
        }

        // Paso 2: crear preferencia de pago en MP y redirigir al Checkout Pro
        // El carrito se limpia cuando MP retorna a back_url con status=success
        this.paymentService.iniciarYRedirigir(checkoutId).subscribe({
          next: () => {
            // La redirección ya ocurrió en paymentService.redirectToMercadoPago().
            // El carrito se limpia en checkout-result solo cuando MP confirma éxito.
          },
          error: (err) => {
            this.error.set(err.error?.message ?? 'Error al conectar con Mercado Pago. Inténtalo de nuevo.');
            this.submitting.set(false);
          },
        });
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al procesar el pedido');
        this.submitting.set(false);
      },
    });
  }
}
