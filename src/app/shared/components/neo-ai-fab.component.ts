import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-neo-ai-fab',
  standalone: true,
  imports: [NgIcon],
  template: `
    <div class="group fixed z-[9999] transition-all duration-200"
         [style.opacity]="isOpen ? '0' : '1'"
         [style.pointer-events]="isOpen ? 'none' : 'auto'"
         style="bottom:24px;right:24px">
      <div class="absolute bottom-full right-0 mb-2 px-2.5 py-1 rounded-md
                  pointer-events-none whitespace-nowrap
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200"
           style="font-family:'JetBrains Mono',monospace;font-size:12px;
                  color:#B5B5B5;background:rgba(0,0,0,0.72);backdrop-filter:blur(4px)">
        Asistente IA
      </div>

      <button (click)="toggle.emit()"
              class="w-14 h-14 rounded-full flex items-center justify-center
                     transition-all duration-200 hover:scale-[1.08] active:scale-95"
              [class.neo-fab-open]="isOpen"
              style="background:linear-gradient(135deg,#FF003C 0%,#9B30FF 100%);
                     box-shadow:0 0 20px rgba(255,0,60,0.25),0 0 40px rgba(155,48,255,0.25)">
        <ng-icon name="lucideSparkles" size="22" style="color:white" />
      </button>
    </div>
  `,
  styles: [`
    @keyframes fab-pulse {
      0%, 100% { box-shadow: 0 0 0 2px #00D4FF, 0 0 20px rgba(255,0,60,0.25), 0 0 40px rgba(155,48,255,0.25); }
      50%       { box-shadow: 0 0 0 3px #00D4FF, 0 0 28px rgba(255,0,60,0.35), 0 0 50px rgba(155,48,255,0.35); }
    }
    .neo-fab-open {
      animation: fab-pulse 2s ease-in-out infinite;
    }
  `],
})
export class NeoAiFabComponent {
  @Input() isOpen = false;
  @Output() toggle = new EventEmitter<void>();
}
