import { Component } from '@angular/core';

@Component({
  selector: 'app-ai-typing-indicator',
  standalone: true,
  template: `
    <div class="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
      <div class="flex gap-1">
        <span class="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style="animation-delay: 0ms"></span>
        <span class="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style="animation-delay: 150ms"></span>
        <span class="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style="animation-delay: 300ms"></span>
      </div>
      <span>Procesando con IA...</span>
    </div>
  `,
})
export class AiTypingIndicatorComponent {}
