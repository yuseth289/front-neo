import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { CheckoutService } from '../../core/cart/checkout.service';
import { AddressService } from '../../core/account/address.service';
import { selectCartItems, selectCartTotal } from '../../core/cart/store/cart.selectors';
import * as CartActions from '../../core/cart/store/cart.actions';
import { AddressResponse } from '../../shared/models/auth.models';
import { PaymentMethod } from '../../shared/models/enums';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  MP_CREDIT_CARD: 'Tarjeta de crédito',
  MP_DEBIT_CARD: 'Tarjeta débito',
  MP_PSE: 'PSE',
  MP_EFECTY: 'Efecty',
  MP_NEQUI: 'Nequi',
  MP_ACCOUNT_MONEY: 'Dinero en cuenta MercadoPago',
};

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon, CopCurrencyPipe],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-text-primary mb-6">Checkout</h1>

      <div class="grid lg:grid-cols-3 gap-6">

        <!-- Formulario -->
        <div class="lg:col-span-2 flex flex-col gap-5">

          <!-- Error global -->
          @if (error()) {
            <div class="flex items-center gap-2 rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
              <ng-icon name="lucideTriangleAlert" size="16" />
              {{ error() }}
            </div>
          }

          <!-- Dirección de entrega -->
          <section class="bg-bg-surface border border-border rounded-xl p-5">
            <h2 class="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <ng-icon name="lucideMapPin" size="18" class="text-accent" />
              Dirección de entrega
            </h2>

            @if (loadingAddresses()) {
              <div class="h-20 rounded-lg bg-bg-elevated animate-pulse"></div>
            } @else if (addresses().length === 0) {
              <div class="text-sm text-text-muted flex flex-col gap-2">
                <p>No tienes direcciones guardadas.</p>
                <a routerLink="/account/addresses" class="text-accent hover:text-accent-hover text-sm">
                  + Agregar dirección
                </a>
              </div>
            } @else {
              <div class="flex flex-col gap-2" [formGroup]="form">
                @for (addr of addresses(); track addr.id) {
                  <label
                    class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                    [class.border-accent]="form.get('addressId')?.value === addr.id"
                    [class.bg-bg-elevated]="form.get('addressId')?.value === addr.id"
                    [class.border-border]="form.get('addressId')?.value !== addr.id">
                    <input
                      type="radio"
                      formControlName="addressId"
                      [value]="addr.id"
                      class="mt-0.5 accent-red-500"
                    />
                    <div>
                      <p class="text-sm font-medium text-text-primary">
                        {{ addr.label }}
                        @if (addr.primary) {
                          <span class="ml-1 text-xs text-accent">(Principal)</span>
                        }
                      </p>
                      <p class="text-xs text-text-secondary mt-0.5">
                        {{ addr.street }} {{ addr.number }}
                        @if (addr.apartment) { , Apto {{ addr.apartment }} }
                        — {{ addr.city }}, {{ addr.department }}
                      </p>
                    </div>
                  </label>
                }
              </div>
            }
          </section>

          <!-- Método de pago -->
          <section class="bg-bg-surface border border-border rounded-xl p-5" [formGroup]="form">
            <h2 class="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <ng-icon name="lucideCreditCard" size="18" class="text-accent" />
              Método de pago
            </h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              @for (method of paymentMethods; track method.value) {
                <label
                  class="flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-sm"
                  [class.border-accent]="form.get('paymentMethod')?.value === method.value"
                  [class.bg-bg-elevated]="form.get('paymentMethod')?.value === method.value"
                  [class.text-text-primary]="form.get('paymentMethod')?.value === method.value"
                  [class.border-border]="form.get('paymentMethod')?.value !== method.value"
                  [class.text-text-secondary]="form.get('paymentMethod')?.value !== method.value">
                  <input type="radio" formControlName="paymentMethod" [value]="method.value" class="accent-red-500" />
                  {{ method.label }}
                </label>
              }
            </div>
          </section>
        </div>

        <!-- Resumen del pedido -->
        <aside>
          <div class="bg-bg-surface border border-border rounded-xl p-5 sticky top-20">
            <h2 class="text-base font-semibold text-text-primary mb-4">Tu pedido</h2>

            <div class="flex flex-col gap-2 mb-4">
              @for (item of items$ | async; track item.id) {
                <div class="flex justify-between text-sm text-text-secondary gap-2">
                  <span class="truncate flex-1">{{ item.productName }} × {{ item.quantity }}</span>
                  <span class="shrink-0 text-text-primary">{{ item.subtotal | copCurrency }}</span>
                </div>
              }
            </div>

            <div class="border-t border-border pt-4 flex justify-between font-bold text-text-primary mb-5">
              <span>Total</span>
              <span>{{ total$ | async | copCurrency }}</span>
            </div>

            <button
              (click)="submit()"
              [disabled]="form.invalid || submitting()"
              class="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed
                     text-white text-sm font-semibold transition-colors shadow-[0_0_20px_theme(colors.accent-glow)]
                     flex items-center justify-center gap-2">
              @if (submitting()) {
                <ng-icon name="lucideRefreshCw" size="16" class="animate-spin" />
                Procesando...
              } @else {
                <ng-icon name="lucideShield" size="16" />
                Confirmar pedido
              }
            </button>

            <p class="text-xs text-text-muted text-center mt-3">
              Tu pedido tendrá 30 minutos para completar el pago.
            </p>
          </div>
        </aside>

      </div>
    </div>
  `,
})
export class CheckoutPageComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private checkoutService = inject(CheckoutService);
  private addressService = inject(AddressService);
  private router = inject(Router);

  items$ = this.store.select(selectCartItems);
  total$ = this.store.select(selectCartTotal);

  addresses = signal<AddressResponse[]>([]);
  loadingAddresses = signal(true);
  submitting = signal(false);
  error = signal<string | null>(null);

  readonly paymentMethods = (Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((v) => ({
    value: v,
    label: PAYMENT_LABELS[v],
  }));

  form = this.fb.nonNullable.group({
    addressId: ['', Validators.required],
    paymentMethod: ['' as PaymentMethod, Validators.required],
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const { addressId, paymentMethod } = this.form.getRawValue();

    this.checkoutService.initCheckout({ addressId, paymentMethod }).subscribe({
      next: () => {
        this.store.dispatch(CartActions.clearCartState());
        this.router.navigate(['/checkout/result'], { queryParams: { status: 'pending' } });
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al procesar el pedido');
        this.submitting.set(false);
      },
    });
  }
}
