import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { SellerService } from '../../core/seller/seller.service';
import { PaymentAccountResponse } from '../../shared/models/seller.models';
import { TipoCuentaPago, TipoDocumento } from '../../shared/models/enums';

const ACCOUNT_TYPE_LABEL: Record<TipoCuentaPago, string> = {
  MERCADO_PAGO: 'MercadoPago',
  BANK_TRANSFER: 'Transferencia bancaria',
};

const DOC_TYPE_LABEL: Record<TipoDocumento, string> = {
  CC: 'Cédula (CC)',
  NIT: 'NIT',
  CE: 'Cédula extranjería',
  PASSPORT: 'Pasaporte',
  TI: 'Tarjeta identidad',
};

@Component({
  selector: 'app-seller-accounts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-xl">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-text-primary">Cuentas bancarias</h1>
        <button (click)="toggleForm()"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors">
          <ng-icon name="lucidePlus" size="14" />
          Nueva cuenta
        </button>
      </div>

      @if (showForm()) {
        <div class="bg-bg-surface border border-border rounded-xl p-5 mb-5">
          <h2 class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">
            Agregar cuenta
          </h2>

          @if (formError()) {
            <div class="mb-4 flex items-center gap-2 rounded-lg bg-error/10 border border-error/30 px-4 py-2.5 text-sm text-error">
              <ng-icon name="lucideTriangleAlert" size="14" />{{ formError() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="add()" novalidate class="flex flex-col gap-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2">
                <label class="block text-sm text-text-secondary mb-1.5">Tipo de cuenta</label>
                <select formControlName="accountType"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors"
                  [class.border-error]="isInvalid('accountType')">
                  <option value="">Seleccionar tipo</option>
                  <option value="MERCADO_PAGO">MercadoPago</option>
                  <option value="BANK_TRANSFER">Transferencia bancaria</option>
                </select>
              </div>

              <div class="col-span-2">
                <label class="block text-sm text-text-secondary mb-1.5">Banco / entidad</label>
                <input type="text" formControlName="bankName" placeholder="Bancolombia, Nequi..."
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors"
                  [class.border-error]="isInvalid('bankName')" />
              </div>

              <div class="col-span-2">
                <label class="block text-sm text-text-secondary mb-1.5">Número de cuenta / alias</label>
                <input type="text" formControlName="accountNumber" placeholder="123456789012"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors"
                  [class.border-error]="isInvalid('accountNumber')" />
              </div>

              <div class="col-span-2">
                <label class="block text-sm text-text-secondary mb-1.5">Titular</label>
                <input type="text" formControlName="accountHolder" placeholder="Nombre del titular"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors"
                  [class.border-error]="isInvalid('accountHolder')" />
              </div>

              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Tipo documento</label>
                <select formControlName="documentType"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors"
                  [class.border-error]="isInvalid('documentType')">
                  <option value="">Tipo</option>
                  @for (doc of docTypes; track doc.value) {
                    <option [value]="doc.value">{{ doc.label }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-sm text-text-secondary mb-1.5">N° documento</label>
                <input type="text" formControlName="documentNumber" placeholder="1020304050"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors"
                  [class.border-error]="isInvalid('documentNumber')" />
              </div>
            </div>

            <div class="flex gap-3 pt-1">
              <button type="submit" [disabled]="adding()"
                class="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                @if (adding()) { <ng-icon name="lucideRefreshCw" size="14" class="animate-spin" /> }
                Guardar cuenta
              </button>
              <button type="button" (click)="toggleForm()"
                class="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2]; track $index) {
            <div class="h-20 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (accounts().length === 0) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucideCreditCard" size="40" />
          <p>No tienes cuentas registradas.</p>
          <p class="text-xs text-center max-w-xs">
            Agrega una cuenta bancaria o de MercadoPago para recibir los pagos de tus ventas.
          </p>
        </div>
      } @else {
        <div class="flex flex-col gap-3">
          @for (account of accounts(); track account.id) {
            <div class="bg-bg-surface border rounded-xl p-4 transition-colors"
              [class.border-accent]="account.active"
              [class.border-border]="!account.active">
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    [class.bg-accent\/15]="account.active"
                    [class.bg-bg-elevated]="!account.active">
                    <ng-icon name="lucideCreditCard" size="16"
                      [class.text-accent]="account.active"
                      [class.text-text-muted]="!account.active" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <p class="text-sm font-semibold text-text-primary">{{ account.bankName }}</p>
                      <span class="text-[11px] text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded">
                        {{ accountTypeLabel(account.accountType) }}
                      </span>
                      @if (account.active) {
                        <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                          Activa
                        </span>
                      }
                    </div>
                    <p class="text-sm font-mono text-text-secondary mt-0.5">
                      {{ account.accountNumberMasked }}
                    </p>
                    <p class="text-xs text-text-muted mt-0.5">
                      {{ account.accountHolder }} · {{ account.documentType }} {{ account.documentNumber }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  @if (!account.active) {
                    <button (click)="activate(account.id)"
                      [disabled]="activatingId() === account.id"
                      class="px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-accent
                             hover:border-accent/50 text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50">
                      @if (activatingId() === account.id) {
                        <ng-icon name="lucideRefreshCw" size="11" class="animate-spin" />
                      } @else {
                        <ng-icon name="lucideCheck" size="11" />
                      }
                      Activar
                    </button>
                    <button (click)="remove(account.id)"
                      [disabled]="deletingId() === account.id"
                      class="p-1.5 rounded-lg border border-border hover:border-error/50 text-text-muted
                             hover:text-error transition-colors disabled:opacity-50">
                      <ng-icon name="lucideTrash2" size="14" />
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SellerAccountsComponent implements OnInit {
  private sellerService = inject(SellerService);
  private fb = inject(FormBuilder);

  accounts = signal<PaymentAccountResponse[]>([]);
  loading = signal(true);
  showForm = signal(false);
  adding = signal(false);
  activatingId = signal<string | null>(null);
  deletingId = signal<string | null>(null);
  formError = signal<string | null>(null);

  docTypes: { value: TipoDocumento; label: string }[] = (
    Object.keys(DOC_TYPE_LABEL) as TipoDocumento[]
  ).map(k => ({ value: k, label: DOC_TYPE_LABEL[k] }));

  form = this.fb.nonNullable.group({
    accountType: ['' as TipoCuentaPago | '', Validators.required],
    bankName: ['', Validators.required],
    accountNumber: ['', Validators.required],
    accountHolder: ['', Validators.required],
    documentType: ['' as TipoDocumento | '', Validators.required],
    documentNumber: ['', Validators.required],
  });

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  accountTypeLabel(t: TipoCuentaPago): string { return ACCOUNT_TYPE_LABEL[t] ?? t; }

  ngOnInit(): void {
    this.sellerService.getAccounts().subscribe({
      next: (res) => { this.accounts.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleForm(): void {
    this.showForm.update(v => !v);
    this.form.reset();
    this.formError.set(null);
  }

  add(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.adding.set(true);
    this.formError.set(null);
    const raw = this.form.getRawValue();
    this.sellerService.addAccount({
      accountType: raw.accountType as TipoCuentaPago,
      bankName: raw.bankName,
      accountNumber: raw.accountNumber,
      accountHolder: raw.accountHolder,
      documentType: raw.documentType as TipoDocumento,
      documentNumber: raw.documentNumber,
    }).subscribe({
      next: (res) => {
        this.accounts.update(list => [...list, res.data]);
        this.showForm.set(false);
        this.form.reset();
        this.adding.set(false);
      },
      error: (err) => {
        this.formError.set(err.error?.message ?? 'Error al guardar la cuenta');
        this.adding.set(false);
      },
    });
  }

  activate(id: string): void {
    this.activatingId.set(id);
    this.sellerService.activateAccount(id).subscribe({
      next: () => {
        this.accounts.update(list =>
          list.map(a => ({ ...a, active: a.id === id }))
        );
        this.activatingId.set(null);
      },
      error: () => this.activatingId.set(null),
    });
  }

  remove(id: string): void {
    this.deletingId.set(id);
    this.sellerService.deleteAccount(id).subscribe({
      next: () => {
        this.accounts.update(list => list.filter(a => a.id !== id));
        this.deletingId.set(null);
      },
      error: () => this.deletingId.set(null),
    });
  }
}
