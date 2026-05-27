import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, RouterOutlet, FormsModule, NgIcon],
  template: `
    <div class="flex h-[calc(100vh-72px)] min-h-0 -mx-4 -my-8 overflow-hidden rounded-xl border border-border">

      <!-- ── LEFT: Conversation list ─────────────────────────────── -->
      <div class="w-[280px] shrink-0 flex flex-col bg-bg-surface border-r border-border">

        <!-- Header -->
        <div class="px-4 pt-5 pb-3 shrink-0">
          <h2 class="font-display text-[18px] font-bold text-text-primary mb-3">Mensajes</h2>
          <div class="relative">
            <ng-icon name="lucideSearch" size="14"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input [(ngModel)]="searchQuery"
              placeholder="Filtrar mensajes..."
              class="w-full h-9 pl-9 pr-3 rounded-[10px] bg-bg-elevated border border-border
                     text-[13px] text-text-primary placeholder:text-text-muted outline-none
                     focus:border-accent/50 transition-colors" />
          </div>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto">
          @if (loading()) {
            @for (_ of [1,2,3]; track $index) {
              <div class="flex items-center gap-3 px-3 py-3 animate-pulse">
                <div class="w-11 h-11 rounded-full bg-bg-elevated shrink-0"></div>
                <div class="flex-1 flex flex-col gap-1.5">
                  <div class="h-3 rounded bg-bg-elevated w-1/2"></div>
                  <div class="h-2.5 rounded bg-bg-elevated w-3/4"></div>
                </div>
              </div>
            }
          } @else if (filtered().length === 0) {
            <div class="flex flex-col items-center gap-2 py-12 text-center px-4">
              <ng-icon name="lucideMail" size="28" class="text-text-muted" />
              <p class="text-[13px] text-text-muted">Sin conversaciones</p>
            </div>
          } @else {
            @for (conv of filtered(); track conv.id) {
              <button (click)="open(conv.id)"
                class="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors
                       hover:bg-bg-elevated relative"
                [class.bg-bg-elevated]="activeId() === conv.id"
                [class.border-l-2]="activeId() === conv.id"
                [class.border-accent]="activeId() === conv.id"
                [class.pl-[10px]]="activeId() === conv.id">

                <!-- Avatar -->
                <div class="relative shrink-0">
                  <div class="w-11 h-11 rounded-full overflow-hidden bg-bg-elevated border border-border
                              flex items-center justify-center font-bold text-accent text-base">
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
                    <p class="text-[13px] font-semibold text-text-primary truncate">
                      {{ isSeller() ? conv.buyerName : conv.storeName }}
                    </p>
                    <span class="text-[10px] text-text-muted shrink-0">
                      {{ conv.lastMessageAt | date:'h:mm a' }}
                    </span>
                  </div>
                  <p class="text-[12px] truncate mt-0.5"
                     [class.text-text-primary]="conv.unreadCount > 0"
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

      <!-- ── RIGHT: Chat detail ───────────────────────────────────── -->
      <div class="flex-1 min-w-0 flex flex-col bg-bg-base">
        @if (activeId()) {
          <router-outlet />
        } @else {
          <div class="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <div class="w-16 h-16 rounded-2xl bg-bg-elevated border border-border
                        flex items-center justify-center">
              <ng-icon name="lucideMail" size="26" class="text-text-muted" />
            </div>
            <p class="text-[14px] font-semibold text-text-primary">Selecciona una conversación</p>
            <p class="text-[12px] text-text-muted max-w-[200px]">
              Elige una conversación de la lista para ver los mensajes
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

    // Sync activeId from URL
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
