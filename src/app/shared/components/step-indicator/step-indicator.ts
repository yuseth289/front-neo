import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [CommonModule, NgIcon],
  template: `
    <div class="flex items-center gap-3">
      @for (label of steps; track $index; let i = $index; let last = $last) {
        <div class="flex items-center gap-2.5">
          <span class="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[13px] font-bold
                       transition-all duration-300 [transition-timing-function:var(--ease-out-snappy)] shrink-0 border-[1.5px]"
                [class.bg-accent]="i < active"
                [class.text-white]="i < active"
                [class.border-accent]="i <= active"
                [class.text-accent]="i === active"
                [class.bg-bg-elevated]="i >= active"
                [class.text-text-muted]="i > active"
                [class.border-border]="i > active"
                [style.box-shadow]="i === active ? '0 0 16px var(--color-accent-glow)' : ''">
            @if (i < active) {
              <ng-icon name="lucideCheck" size="14" />
            } @else {
              {{ i + 1 }}
            }
          </span>
          <span class="text-sm font-medium"
                [class.text-text-primary]="i <= active"
                [class.text-text-muted]="i > active">
            {{ label }}
          </span>
        </div>
        @if (!last) {
          <span class="flex-1 h-px transition-colors duration-300"
                [class.bg-accent]="i < active"
                [class.bg-border]="i >= active"></span>
        }
      }
    </div>
  `,
})
export class StepIndicatorComponent {
  @Input({ required: true }) steps!: string[];
  @Input({ required: true }) active!: number;
}
