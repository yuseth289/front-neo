import { Component, Input, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-password-input',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordInputComponent), multi: true }],
  template: `
    <div>
      <label class="relative block bg-bg-elevated rounded-[10px] cursor-text
                    transition-all duration-200 [transition-timing-function:var(--ease-out-snappy)] border"
             [class.border-border]="!focused() && !error"
             [class.border-accent]="focused() && !error"
             [class.border-error]="!!error"
             [style.box-shadow]="(focused() && !error) ? '0 0 0 3px var(--color-accent-soft)' : ''"
             style="padding: 20px 14px 8px;">

        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              [class.text-accent]="focused() && !error"
              [class.text-error]="!!error">
          <ng-icon name="lucideLock" size="16" />
        </span>

        <!-- Floating label -->
        <span class="absolute pointer-events-none transition-all duration-[180ms] [transition-timing-function:var(--ease-out-snappy)]"
              [class.top-[6px]]="floating()"
              [class.top-1/2]="!floating()"
              [class.-translate-y-1/2]="!floating()"
              [class.translate-y-0]="floating()"
              [style.left.px]="38"
              [style.font-size.px]="floating() ? 11 : 14"
              [class.font-mono]="floating()"
              [class.font-semibold]="floating()"
              [class.uppercase]="floating()"
              [style.letter-spacing]="floating() ? '0.04em' : ''"
              [class.text-text-secondary]="floating() && !error"
              [class.text-text-muted]="!floating() && !error"
              [class.text-error]="!!error">
          {{ label }}
        </span>

        <input
          [type]="show() ? 'text' : 'password'"
          [value]="value() ?? ''"
          (input)="onInput(($any($event.target)).value)"
          (focus)="focused.set(true); onTouched?.()"
          (blur)="focused.set(false)"
          [attr.autocomplete]="autoComplete"
          class="w-full bg-transparent border-none outline-none text-text-primary text-sm pt-0.5"
          style="padding-left: 24px; padding-right: 36px;"
        />

        <button type="button" (click)="show.update(s => !s)"
                [attr.aria-label]="show() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-primary transition-colors">
          <ng-icon [name]="show() ? 'lucideEyeOff' : 'lucideEye'" size="14" />
        </button>
      </label>

      @if (error) {
        <p class="mt-1.5 text-xs text-error inline-flex items-center gap-1">
          <ng-icon name="lucideCircleAlert" size="12" />
          {{ error }}
        </p>
      } @else if (hint) {
        <p class="mt-1.5 text-xs text-text-muted">{{ hint }}</p>
      }

      @if (showStrength && value()) {
        <div class="mt-2.5">
          <div class="flex gap-1">
            @for (i of [1,2,3,4]; track i) {
              <span class="flex-1 h-[3px] rounded-full transition-colors duration-300"
                    [style.background]="i <= strength() ? strengthColor() : 'var(--color-bg-elevated)'"></span>
            }
          </div>
          <p class="mt-1.5 text-[11px] font-mono uppercase tracking-[0.04em]"
             [style.color]="strengthColor()">
            {{ strengthLabel() }}
          </p>
        </div>
      }
    </div>
  `,
})
export class PasswordInputComponent implements ControlValueAccessor {
  @Input() label = 'Contraseña';
  @Input() autoComplete: 'current-password' | 'new-password' = 'current-password';
  @Input() showStrength = false;
  @Input() error?: string | null;
  @Input() hint?: string;

  readonly value   = signal<string | null>(null);
  readonly show    = signal(false);
  readonly focused = signal(false);
  readonly filled  = computed(() => this.value() != null && this.value() !== '');
  readonly floating = computed(() => this.focused() || this.filled());

  readonly strength = computed(() => {
    const v = this.value() ?? '';
    if (!v) return 0;
    let s = 0;
    if (v.length >= 8)          s++;
    if (/[A-Z]/.test(v))        s++;
    if (/[0-9]/.test(v))        s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  });

  readonly strengthLabel = computed(() => ['', 'Débil', 'Aceptable', 'Buena', 'Excelente'][this.strength()]);
  readonly strengthColor = computed(() => ['transparent', 'var(--color-error)', 'var(--color-warning)', 'var(--color-neon-cyan)', 'var(--color-success)'][this.strength()]);

  private onChange?: (v: string) => void;
  onTouched?: () => void;

  writeValue(v: string | null): void { this.value.set(v ?? null); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(_: boolean): void {}

  onInput(v: string) {
    this.value.set(v);
    this.onChange?.(v);
  }
}
