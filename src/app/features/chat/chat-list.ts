import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { ChatService } from '../../core/chat/chat.service';
import { ConversationResponse } from '../../shared/models/chat.models';
import { selectRole } from '../../core/auth/store/auth.selectors';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    <div class="max-w-2xl">

      <!-- Header -->
      <div class="mb-6">
        <p class="neo-stat-label">Mensajes</p>
        <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
          Conversaciones
        </h1>
      </div>

      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (_ of [1,2,3]; track $index) {
            <div class="neo-card-premium p-4 flex items-center gap-4 animate-pulse">
              <div class="w-12 h-12 rounded-full bg-bg-elevated shrink-0"></div>
              <div class="flex-1 flex flex-col gap-2">
                <div class="h-3.5 rounded bg-bg-elevated w-1/3"></div>
                <div class="h-3 rounded bg-bg-elevated w-2/3"></div>
              </div>
            </div>
          }
        </div>

      } @else if (conversations().length === 0) {
        <div class="neo-card-premium flex flex-col items-center gap-4 py-20 text-center">
          <div class="w-16 h-16 rounded-full bg-bg-elevated border border-border
                      flex items-center justify-center">
            <ng-icon name="lucideMail" size="26" class="text-text-muted" />
          </div>
          <div>
            <p class="font-semibold text-text-primary">Sin conversaciones aún</p>
            <p class="text-[13px] text-text-secondary mt-1 max-w-xs">
              Inicia un chat desde la página de un producto o tienda.
            </p>
          </div>
          <a routerLink="/catalog" class="neo-btn-outline !py-2 !px-4 !text-[13px]">
            <ng-icon name="lucideLayoutGrid" size="14" /> Explorar catálogo
          </a>
        </div>

      } @else {
        <div class="flex flex-col gap-2">
          @for (conv of conversations(); track conv.id) {
            <a [routerLink]="detailRoute(conv.id)"
               class="neo-card-premium p-4 flex items-center gap-4 cursor-pointer
                      hover:border-accent/40 hover:bg-bg-elevated transition-all duration-200 group">

              <!-- Avatar / Logo -->
              <div class="relative shrink-0">
                <div class="w-12 h-12 rounded-full overflow-hidden border border-border
                            bg-bg-elevated flex items-center justify-center">
                  @if (isSeller() ? conv.buyerName : conv.storeLogoUrl) {
                    @if (!isSeller() && conv.storeLogoUrl) {
                      <img [src]="conv.storeLogoUrl" alt="" class="w-full h-full object-cover" />
                    } @else {
                      <span class="font-display font-bold text-lg text-accent">
                        {{ (isSeller() ? conv.buyerName : conv.storeName)[0] }}
                      </span>
                    }
                  } @else {
                    <span class="font-display font-bold text-lg text-accent">
                      {{ (isSeller() ? conv.buyerName : conv.storeName)[0] }}
                    </span>
                  }
                </div>
                @if (conv.unreadCount > 0) {
                  <span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full
                               bg-accent text-white text-[10px] font-bold leading-none
                               flex items-center justify-center shadow-[0_0_8px_var(--color-accent-glow)]">
                    {{ conv.unreadCount > 9 ? '9+' : conv.unreadCount }}
                  </span>
                }
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline gap-2">
                  <p class="text-[14px] font-semibold text-text-primary truncate
                             group-hover:text-accent transition-colors">
                    {{ isSeller() ? conv.buyerName : conv.storeName }}
                  </p>
                  @if (conv.lastMessageAt) {
                    <span class="text-[11px] text-text-muted shrink-0">
                      {{ conv.lastMessageAt | date:'d MMM':'':'es-CO' }}
                    </span>
                  }
                </div>
                @if (conv.productName) {
                  <p class="text-[11px] text-accent/70 mb-0.5 truncate">
                    <ng-icon name="lucidePackage" size="10" class="mr-0.5" />{{ conv.productName }}
                  </p>
                }
                <p class="text-[13px] text-text-secondary truncate"
                   [class.font-medium]="conv.unreadCount > 0"
                   [class.text-text-primary]="conv.unreadCount > 0">
                  {{ conv.lastMessage ?? 'Conversación iniciada' }}
                </p>
              </div>

              <ng-icon name="lucideChevronRight" size="16" class="text-text-muted shrink-0
                       group-hover:text-accent transition-colors" />
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class ChatListComponent implements OnInit {
  private chatService = inject(ChatService);
  private router = inject(Router);
  private store = inject(Store);

  isSeller$ = this.store.select(selectRole).pipe(map(r => r === 'SELLER'));
  isSeller = signal(false);

  loading = signal(true);
  conversations = signal<ConversationResponse[]>([]);

  ngOnInit(): void {
    this.isSeller$.subscribe(v => this.isSeller.set(v));
    this.chatService.listConversations().subscribe({
      next: (res) => { this.conversations.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  detailRoute(convId: string): string[] {
    return this.isSeller() ? ['/seller/messages', convId] : ['/messages', convId];
  }
}
