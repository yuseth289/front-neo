import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { filter } from 'rxjs';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { ChatService } from '../../core/chat/chat.service';
import { ConversationResponse } from '../../shared/models/chat.models';
import { selectRole } from '../../core/auth/store/auth.selectors';

@Component({
  selector: 'app-chat-shell',
  standalone: true,
  imports: [CommonModule, NgClass, RouterOutlet, FormsModule, NgIcon],
  template: `
    <div class="flex h-[calc(100vh-72px)] min-h-0 -mx-4 -my-8 overflow-hidden">

      <!-- ── Sidebar ──────────────────────────────────────────────── -->
      <div class="shrink-0 flex flex-col bg-bg-elevated w-full md:w-[260px]"
           [ngClass]="activeId() ? 'hidden md:flex' : 'flex'">

        <!-- Header -->
        <div class="px-4 pt-5 pb-3 shrink-0">
          <h2 class="font-display text-[15px] font-bold text-text-primary tracking-[-0.01em] mb-3">
            Mensajes
          </h2>
          <div class="relative">
            <ng-icon name="lucideSearch" size="13"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input [(ngModel)]="searchQuery"
              placeholder="Buscar conversación…"
              class="w-full h-8 pl-8 pr-3 rounded-lg bg-bg-subtle border border-transparent
                     text-[12px] text-text-primary placeholder:text-text-muted outline-none
                     focus:border-border transition-colors" />
          </div>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-0.5">
          @if (loading()) {
            @for (_ of [1,2,3,4]; track $index) {
              <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse">
                <div class="w-10 h-10 rounded-full bg-bg-subtle shrink-0"></div>
                <div class="flex-1 flex flex-col gap-1.5">
                  <div class="h-2.5 rounded-md bg-bg-subtle w-2/5"></div>
                  <div class="h-2 rounded-md bg-bg-subtle w-3/5"></div>
                </div>
              </div>
            }
          } @else if (filtered().length === 0) {
            <div class="flex flex-col items-center gap-2 py-10 text-center px-4">
              <ng-icon name="lucideMessageSquare" size="22" class="text-text-muted opacity-50" />
              <p class="text-[12px] text-text-muted">Sin conversaciones aún</p>
            </div>
          } @else {
            @for (conv of filtered(); track conv.id) {
              <button (click)="open(conv.id)"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors
                       hover:bg-bg-subtle"
                [class.bg-bg-subtle]="activeId() === conv.id">

                <!-- Avatar -->
                <div class="relative shrink-0">
                  <div class="w-10 h-10 rounded-full overflow-hidden bg-bg-base border border-border
                              flex items-center justify-center font-bold text-accent text-sm">
                    @if (!isSeller() && conv.storeLogoUrl) {
                      <img [src]="conv.storeLogoUrl" alt="" class="w-full h-full object-cover" />
                    } @else {
                      {{ (isSeller() ? conv.buyerName : conv.storeName)[0] }}
                    }
                  </div>
                  @if (conv.unreadCount > 0) {
                    <span class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full
                                 bg-accent text-white text-[9px] font-bold leading-none
                                 flex items-center justify-center">
                      {{ conv.unreadCount > 9 ? '9+' : conv.unreadCount }}
                    </span>
                  }
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-baseline gap-1">
                    <p class="text-[13px] font-medium truncate"
                       [class.text-text-primary]="activeId() === conv.id"
                       [class.text-text-secondary]="activeId() !== conv.id">
                      {{ isSeller() ? conv.buyerName : conv.storeName }}
                    </p>
                    <span class="text-[10px] text-text-muted shrink-0 font-mono">
                      {{ conv.lastMessageAt | date:'h:mm a' }}
                    </span>
                  </div>
                  <p class="text-[11px] truncate mt-0.5"
                     [class.text-text-secondary]="conv.unreadCount > 0"
                     [class.font-medium]="conv.unreadCount > 0"
                     [class.text-text-muted]="conv.unreadCount === 0">
                    {{ conv.lastMessage ?? 'Conversación iniciada' }}
                  </p>
                </div>
              </button>
            }
          }
        </div>
      </div>

      <!-- ── Main area ─────────────────────────────────────────────── -->
      <div class="flex-1 min-w-0 flex flex-col bg-bg-base
                  md:rounded-tl-2xl md:border-t md:border-l md:border-border/40 overflow-hidden"
           [ngClass]="!activeId() ? 'hidden md:flex' : 'flex'">
        @if (activeId()) {
          <router-outlet />
        } @else {
          <!-- Empty state -->
          <div class="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
            <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-border/50
                        flex items-center justify-center mb-1">
              <ng-icon name="lucideMessageSquareDot" size="24" class="text-text-muted" />
            </div>
            <p class="text-[15px] font-semibold text-text-primary tracking-[-0.01em]">
              Elige una conversación
            </p>
            <p class="text-[12px] text-text-muted max-w-[180px] leading-relaxed">
              Selecciona un chat de la lista para ver los mensajes
            </p>
          </div>
        }
      </div>

    </div>
  `,
})
export class ChatShellComponent implements OnInit {
  private chatService = inject(ChatService);
  private router      = inject(Router);
  private route       = inject(ActivatedRoute);
  private store       = inject(Store);

  isSeller    = signal(false);
  loading     = signal(true);
  conversations = signal<ConversationResponse[]>([]);
  searchQuery = '';
  activeId    = signal<string | null>(null);

  filtered = () => {
    const q = this.searchQuery.toLowerCase();
    return this.conversations().filter(c => {
      const name = this.isSeller() ? c.buyerName : c.storeName;
      return !q || name.toLowerCase().includes(q) ||
             (c.lastMessage ?? '').toLowerCase().includes(q);
    });
  };

  ngOnInit(): void {
    this.store.select(selectRole).pipe(map(r => r === 'SELLER'))
      .subscribe(v => this.isSeller.set(v));

    this.chatService.listConversations().subscribe({
      next: (res) => { this.conversations.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });

    const syncId = () => {
      const id = this.route.firstChild?.snapshot.paramMap.get('id') ?? null;
      this.activeId.set(id);
    };
    syncId();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => syncId());
  }

  open(convId: string): void {
    this.activeId.set(convId);
    const base = this.isSeller() ? '/seller/messages' : '/messages';
    this.router.navigate([base, convId]);
  }
}
