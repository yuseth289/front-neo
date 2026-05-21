import { Component, Input, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-floating-input',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FloatingInputComponent), multi: true }],
  template: `
    <div>
      <label class="relative block bg-bg-elevated rounded-[10px] cursor-text
                    transition-all duration-200 [transition-timing-function:var(--ease-out-snappy)] border"
             [class.border-border]="!focused() && !error && !success"
             [class.border-accent]="focused() && !error && !success"
             [class.border-error]="!!error"
             [class.border-success]="!!success && !error"
             [style.box-shadow]="(focused() && !error) ? '0 0 0 3px var(--color-accent-soft)' : ''"
             style="padding: 20px 14px 8px;">

        @if (icon) {
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                [class.text-accent]="focused() && !error"
                [class.text-error]="!!error">
            <ng-icon [name]="icon" size="16" />
          </span>
        }

        <!-- Floating label -->
        <span class="absolute pointer-events-none transition-all duration-[180ms] [transition-timing-function:var(--ease-out-snappy)]"
              [class.top-[6px]]="floating()"
              [class.top-1/2]="!floating()"
              [class.-translate-y-1/2]="!floating()"
              [class.translate-y-0]="floating()"
              [style.left.px]="icon ? 38 : 14"
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
          [type]="type"
          [value]="value() ?? ''"
          (input)="onInput(($any($event.target)).value)"
          (focus)="focused.set(true); onTouched?.()"
          (blur)="focused.set(false)"
          [disabled]="disabled"
          [attr.autocomplete]="autoComplete"
          [attr.inputmode]="inputMode"
          class="w-full bg-transparent border-none outline-none text-text-primary text-sm pt-0.5"
          [style.padding-left.px]="icon ? 24 : 0"
          [style.padding-right.px]="suffix ? 32 : 0"
        />

        @if (suffix) {
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs font-mono">
            {{ suffix }}
          </span>
        }
      </label>

      @if (error) {
        <p class="mt-1.5 text-xs text-error inline-flex items-center gap-1">
          <ng-icon name="lucideCircleAlert" size="12" />
          {{ error }}
        </p>
      } @else if (success) {
        <p class="mt-1.5 text-xs text-success inline-flex items-center gap-1">
          <ng-icon name="lucideCircleCheck" size="12" />
          {{ success }}
        </p>
      } @else if (hint) {
        <p class="mt-1.5 text-xs text-text-muted">{{ hint }}</p>
      }
    </div>
  `,
})
export class FloatingInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type: 'text' | 'email' | 'tel' | 'password' | 'number' | 'search' = 'text';
  @Input() icon?: string;
  @Input() suffix?: string;
  @Input() hint?: string;
  @Input() error?: string | null;
  @Input() success?: string | null;
  @Input() autoComplete?: string;
  @Input() inputMode?: string;
  @Input() disabled = false;

  readonly value   = signal<string | null>(null);
  readonly focused = signal(false);
  readonly filled  = computed(() => this.value() != null && this.value() !== '');
  readonly floating = computed(() => this.focused() || this.filled());

  private onChange?: (v: string) => void;
  onTouched?: () => void;

  writeValue(v: string | null): void { this.value.set(v ?? null); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onInput(v: string) {
    this.value.set(v);
    this.onChange?.(v);
  }
}
