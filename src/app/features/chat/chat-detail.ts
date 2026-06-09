import {
  Component, inject, OnInit, OnDestroy, signal,
  AfterViewChecked, ElementRef, ViewChild, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { Subject, interval, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { ChatService } from '../../core/chat/chat.service';
import { ConversationResponse, MessageResponse } from '../../shared/models/chat.models';
import { selectUserId, selectRole } from '../../core/auth/store/auth.selectors';
import { ApplicationRef } from '@angular/core';

const EMOJIS = [
  '😀','😂','😍','😎','🤔','😅','😢','😡','🥳','😴',
  '👍','👎','❤️','🔥','💯','👋','🙏','🤣','🤦','🎮',
  '💪','🫡','😬','🫠','😏','🤩','😭','🫶','✨','🚀',
];

@Component({
  selector: 'app-chat-detail',
  standalone: true,
  host: { class: 'flex flex-col h-full min-h-0 overflow-hidden relative' },
  imports: [CommonModule, FormsModule, NgIcon],
  template: `
    <!-- ── HEADER ──────────────────────────────────────────────────── -->
    <div class="px-4 py-3 flex items-center gap-3 shrink-0 border-b border-border/40 bg-bg-base">

      <!-- Back (mobile) -->
      <button class="md:hidden p-1.5 -ml-1 rounded-lg text-text-muted hover:text-text-primary
                     hover:bg-bg-elevated transition-colors shrink-0"
              (click)="goBack()">
        <ng-icon name="lucideArrowLeft" size="16" />
      </button>

      @if (conversation()) {
        <!-- Avatar -->
        <div class="w-8 h-8 rounded-full overflow-hidden border border-border/60 bg-bg-elevated
                    flex items-center justify-center font-bold text-accent text-xs shrink-0">
          @if (!isSeller() && conversation()!.storeLogoUrl) {
            <img [src]="conversation()!.storeLogoUrl" alt="" class="w-full h-full object-cover" />
          } @else {
            {{ (isSeller() ? conversation()!.buyerName : conversation()!.storeName)[0] }}
          }
        </div>

        <!-- Name + status -->
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-semibold text-text-primary truncate leading-tight">
            {{ isSeller() ? conversation()!.buyerName : conversation()!.storeName }}
          </p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full shrink-0"
                  [class.bg-success]="polling()"
                  [class.bg-text-muted]="!polling()"
                  [class.opacity-40]="!polling()"></span>
            <span class="text-[10px]"
                  [class.text-success]="polling()"
                  [class.text-text-muted]="!polling()">
              {{ polling() ? 'En línea' : 'Desconectado' }}
            </span>
          </div>
        </div>
      } @else {
        <div class="flex-1"></div>
      }

      <!-- Actions -->
      <div class="flex items-center gap-0.5">
        <button (click)="toggleSearch()"
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          [class.text-accent]="searchOpen()"
          [class.bg-accent/8]="searchOpen()"
          [class.text-text-muted]="!searchOpen()"
          [class.hover:text-text-primary]="!searchOpen()"
          [class.hover:bg-bg-elevated]="!searchOpen()">
          <ng-icon name="lucideSearch" size="14" />
        </button>

        <div class="relative" data-menu>
          <button (click)="menuOpen.set(!menuOpen())"
            class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            [class.text-text-primary]="menuOpen()"
            [class.bg-bg-elevated]="menuOpen()"
            [class.text-text-muted]="!menuOpen()"
            [class.hover:text-text-primary]="!menuOpen()"
            [class.hover:bg-bg-elevated]="!menuOpen()">
            <ng-icon name="lucideMoreHorizontal" size="14" />
          </button>

          @if (menuOpen()) {
            <div class="absolute right-0 top-full mt-1.5 w-48 z-50
                        bg-bg-elevated border border-border/60 rounded-[12px]
                        shadow-[var(--shadow-card-lift)] overflow-hidden py-1">
              <button (click)="openInfo()"
                class="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px]
                       text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors text-left">
                <ng-icon name="lucideUser" size="13" class="shrink-0" />
                Info de contacto
              </button>
              <div class="my-1 border-t border-border/50 mx-2"></div>
              <button (click)="confirmDelete()"
                class="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px]
                       text-error hover:bg-error/8 transition-colors text-left">
                <ng-icon name="lucideTrash2" size="13" class="shrink-0" />
                Borrar conversación
              </button>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- ── INFO PANEL ───────────────────────────────────────────────── -->
    @if (infoOpen() && conversation()) {
      <div class="border-b border-border/40 bg-bg-elevated/50 px-4 py-3.5 shrink-0 flex items-center gap-3">
        <div class="w-11 h-11 rounded-full overflow-hidden border border-border bg-bg-surface
                    flex items-center justify-center font-bold text-accent text-base shrink-0">
          @if (!isSeller() && conversation()!.storeLogoUrl) {
            <img [src]="conversation()!.storeLogoUrl" alt="" class="w-full h-full object-cover" />
          } @else {
            {{ (isSeller() ? conversation()!.buyerName : conversation()!.storeName)[0] }}
          }
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-semibold text-text-primary">
            {{ isSeller() ? conversation()!.buyerName : conversation()!.storeName }}
          </p>
          @if (conversation()!.productName) {
            <p class="text-[11px] text-text-muted mt-0.5 flex items-center gap-1">
              <ng-icon name="lucidePackage" size="10" />
              Sobre: {{ conversation()!.productName }}
            </p>
          }
          <p class="text-[10px] text-text-muted mt-0.5">
            Iniciada el {{ conversation()!.createdAt | date:'d MMM yyyy' }}
          </p>
        </div>
        <button (click)="infoOpen.set(false)"
          class="w-7 h-7 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-colors flex items-center justify-center">
          <ng-icon name="lucideX" size="13" />
        </button>
      </div>
    }

    <!-- ── CONFIRM DELETE ────────────────────────────────────────────── -->
    @if (deleteConfirm()) {
      <div class="absolute inset-0 z-40 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-5">
        <div class="bg-bg-elevated border border-border/60 rounded-2xl p-6 max-w-sm w-full
                    shadow-[var(--shadow-card-lift)]">
          <div class="w-10 h-10 rounded-xl bg-error/10 border border-error/25
                      flex items-center justify-center mb-4">
            <ng-icon name="lucideTrash2" size="16" class="text-error" />
          </div>
          <p class="text-[14px] font-semibold text-text-primary">¿Borrar esta conversación?</p>
          <p class="text-[12px] text-text-muted mt-1.5 mb-5 leading-relaxed">
            Todos los mensajes se eliminarán permanentemente. Esta acción no se puede deshacer.
          </p>
          <div class="flex gap-2">
            <button (click)="deleteConfirm.set(false)"
              class="flex-1 py-2 rounded-xl border border-border text-[12px]
                     text-text-secondary hover:bg-bg-subtle transition-colors">
              Cancelar
            </button>
            <button (click)="deleteChat()" [disabled]="deleting()"
              class="flex-1 py-2 rounded-xl bg-error text-white text-[12px] font-medium
                     hover:bg-error/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5">
              @if (deleting()) { <ng-icon name="lucideRefreshCw" size="12" class="animate-spin" /> }
              Borrar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ── SEARCH ────────────────────────────────────────────────────── -->
    @if (searchOpen()) {
      <div class="px-4 py-2 border-b border-border/40 bg-bg-elevated/40 flex items-center gap-2 shrink-0">
        <ng-icon name="lucideSearch" size="13" class="text-text-muted shrink-0" />
        <input #searchInput
          [(ngModel)]="searchQuery"
          placeholder="Buscar en esta conversación…"
          class="flex-1 bg-transparent text-[12px] text-text-primary placeholder:text-text-muted outline-none" />
        @if (searchQuery) {
          <span class="text-[10px] text-text-muted font-mono shrink-0">
            {{ filteredMessages().length }} resultado{{ filteredMessages().length !== 1 ? 's' : '' }}
          </span>
          <button (click)="searchQuery = ''" class="text-text-muted hover:text-text-primary transition-colors">
            <ng-icon name="lucideX" size="13" />
          </button>
        }
      </div>
    }

    <!-- ── MESSAGES ──────────────────────────────────────────────────── -->
    <div #scrollContainer class="flex-1 overflow-y-auto min-h-0">
      <div class="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-2">

        @if (loading()) {
          <div class="flex-1 flex items-center justify-center py-20">
            <ng-icon name="lucideRefreshCw" size="18" class="text-text-muted animate-spin" />
          </div>
        }

        @if (!loading() && filteredMessages().length === 0 && !searchQuery) {
          <!-- Empty conversation greeting -->
          <div class="flex flex-col items-center justify-center py-16 gap-3 text-center">
            @if (conversation()) {
              <div class="w-12 h-12 rounded-full overflow-hidden border border-border/60 bg-bg-elevated
                          flex items-center justify-center font-bold text-accent text-base">
                @if (!isSeller() && conversation()!.storeLogoUrl) {
                  <img [src]="conversation()!.storeLogoUrl" alt="" class="w-full h-full object-cover" />
                } @else {
                  {{ (isSeller() ? conversation()!.buyerName : conversation()!.storeName)[0] }}
                }
              </div>
              <p class="text-[14px] font-semibold text-text-primary">
                {{ isSeller() ? conversation()!.buyerName : conversation()!.storeName }}
              </p>
              <p class="text-[12px] text-text-muted max-w-[220px] leading-relaxed">
                Este es el comienzo de tu conversación. Envía un mensaje para empezar.
              </p>
            }
          </div>
        }

        @for (msg of filteredMessages(); track msg.id; let i = $index) {
          @let own = isOwn(msg);
          @let showAvatar = !own && (i === 0 || filteredMessages()[i-1].senderId !== msg.senderId);

          <div class="flex flex-col gap-0.5" [class.items-end]="own">

            <!-- Sender name (others only, first in group) -->
            @if (showAvatar && !own) {
              <p class="text-[10px] text-text-muted ml-9 mb-0.5">{{ msg.senderName }}</p>
            }

            <div class="flex items-end gap-2" [class.flex-row-reverse]="own">

              <!-- Avatar (others only, last in group) -->
              @if (!own) {
                <div class="w-7 h-7 rounded-full overflow-hidden border border-border/60 bg-bg-elevated
                            flex items-center justify-center text-[10px] font-bold shrink-0 self-end"
                     [class.opacity-0]="i < filteredMessages().length - 1 && filteredMessages()[i+1].senderId === msg.senderId">
                  @if (msg.senderAvatar) {
                    <img [src]="msg.senderAvatar" alt="" class="w-full h-full object-cover" />
                  } @else {
                    <span class="text-accent">{{ msg.senderName[0] }}</span>
                  }
                </div>
              }

              <!-- Bubble + time -->
              <div class="flex flex-col gap-1" [class.items-end]="own">
                @if (isImage(msg.content)) {
                  <div class="rounded-2xl overflow-hidden max-w-[220px] border border-border/40"
                       [class.rounded-br-sm]="own"
                       [class.rounded-bl-sm]="!own">
                    <img [src]="msg.content" alt="imagen" class="w-full object-cover" />
                  </div>
                } @else {
                  <div class="px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed max-w-[min(80%,38ch)]"
                       [class.rounded-br-sm]="own"
                       [class.rounded-bl-sm]="!own"
                       [class.bg-bg-elevated]="own"
                       [class.border]="own"
                       [class.border-border]="own"
                       [class.text-text-primary]="own"
                       [class.bg-bg-surface]="!own"
                       [class.border-border]="!own"
                       [class.border]="!own"
                       [class.text-text-primary]="!own"
                       [innerHTML]="highlight(msg.content)">
                  </div>
                }

                <!-- Timestamp + read receipt -->
                <div class="flex items-center gap-1 px-1"
                     [class.flex-row-reverse]="own">
                  <span class="text-[9px] text-text-muted font-mono">
                    {{ msg.createdAt | date:'h:mm a' }}
                  </span>
                  @if (own && ((isSeller() && msg.readByBuyer) || (!isSeller() && msg.readBySeller))) {
                    <ng-icon name="lucideCheckCheck" size="11" class="text-neon-cyan" />
                  } @else if (own) {
                    <ng-icon name="lucideCheck" size="11" class="text-text-muted opacity-50" />
                  }
                </div>
              </div>

            </div>
          </div>
        }

        <div class="h-1 shrink-0"></div>
      </div>
    </div>

    <!-- ── IMAGE PREVIEW ─────────────────────────────────────────────── -->
    @if (imagePreview()) {
      <div class="px-4 py-2.5 border-t border-border/40 bg-bg-elevated/50 flex items-center gap-3 shrink-0">
        <div class="relative w-12 h-12 rounded-xl overflow-hidden border border-border/60 shrink-0">
          <img [src]="imagePreview()!" alt="" class="w-full h-full object-cover" />
          <button (click)="removeImage()"
            class="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white
                   flex items-center justify-center">
            <ng-icon name="lucideX" size="9" />
          </button>
        </div>
        <span class="text-[11px] text-text-muted truncate flex-1">{{ imageFileName() }}</span>
      </div>
    }

    <!-- ── EMOJI PICKER ──────────────────────────────────────────────── -->
    @if (emojiOpen()) {
      <div class="border-t border-border/40 bg-bg-elevated/60 px-3 py-2.5 shrink-0">
        <div class="max-w-2xl mx-auto grid grid-cols-10 gap-0.5">
          @for (e of emojis; track e) {
            <button (click)="insertEmoji(e)"
              class="h-8 flex items-center justify-center text-[17px] rounded-lg
                     hover:bg-bg-subtle transition-colors">
              {{ e }}
            </button>
          }
        </div>
      </div>
    }

    <!-- ── INPUT ─────────────────────────────────────────────────────── -->
    <div class="px-4 py-3 border-t border-border/40 bg-bg-base shrink-0">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-end gap-2 rounded-2xl border border-border/60 bg-bg-elevated
                    px-3 py-2 focus-within:border-border transition-colors">

          <input #fileInput type="file" accept="image/*" class="hidden"
                 (change)="onFileSelected($event)" />

          <button (click)="fileInput.click()"
            class="p-1.5 rounded-lg transition-colors shrink-0 self-end mb-0.5"
            [class.text-accent]="imagePreview()"
            [class.text-text-muted]="!imagePreview()"
            [class.hover:text-text-secondary]="!imagePreview()">
            <ng-icon name="lucidePaperclip" size="15" />
          </button>

          <textarea #msgInput
            [(ngModel)]="draft"
            (keydown.enter)="onEnter($event)"
            placeholder="Escribe un mensaje…"
            rows="1"
            class="flex-1 bg-transparent border-none outline-none resize-none
                   text-[13px] text-text-primary placeholder:text-text-muted
                   max-h-[120px] leading-relaxed py-1.5"
            (input)="autoGrow($event)">
          </textarea>

          <div class="flex items-center gap-1 self-end mb-0.5">
            <button (click)="toggleEmoji()"
              class="p-1.5 rounded-lg transition-colors"
              [class.text-accent]="emojiOpen()"
              [class.text-text-muted]="!emojiOpen()"
              [class.hover:text-text-secondary]="!emojiOpen()">
              <ng-icon name="lucideSmile" size="15" />
            </button>

            <button (click)="send()" [disabled]="(!draft.trim() && !imagePreview()) || sending()"
              class="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shrink-0
                     shadow-[0_0_12px_var(--color-accent-glow)] transition-all
                     hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed
                     disabled:shadow-none">
              @if (sending()) {
                <ng-icon name="lucideRefreshCw" size="13" class="text-white animate-spin" />
              } @else {
                <ng-icon name="lucideArrowUp" size="13" class="text-white" />
              }
            </button>
          </div>
        </div>

        <p class="text-[10px] text-text-muted text-center mt-1.5">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  `,
})
export class ChatDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollEl!: ElementRef<HTMLDivElement>;
  @ViewChild('msgInput') private msgInput!: ElementRef<HTMLTextAreaElement>;

  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private chatService = inject(ChatService);
  private store       = inject(Store);
  private appRef      = inject(ApplicationRef);
  private destroy$    = new Subject<void>();

  currentUserId = signal<string | null>(null);
  isSeller      = signal(false);
  convId        = signal('');
  conversation  = signal<ConversationResponse | null>(null);
  messages      = signal<MessageResponse[]>([]);
  loading       = signal(true);
  sending       = signal(false);
  polling       = signal(true);
  draft         = '';

  searchOpen    = signal(false);
  searchQuery   = '';
  emojiOpen     = signal(false);
  menuOpen      = signal(false);
  infoOpen      = signal(false);
  deleteConfirm = signal(false);
  deleting      = signal(false);
  imagePreview  = signal<string | null>(null);
  imageFileName = signal('');

  readonly emojis = EMOJIS;
  private shouldScroll = false;

  isOwn   = (msg: MessageResponse) => msg.senderId === this.currentUserId();
  isImage = (content: string) => content.startsWith('data:image');

  filteredMessages = () => {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.messages();
    return this.messages().filter(m => m.content.toLowerCase().includes(q));
  };

  highlight(content: string): string {
    const q = this.searchQuery.trim();
    if (!q) return content;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return content.replace(new RegExp(escaped, 'gi'),
      m => `<mark class="bg-yellow-400/40 rounded px-0.5">${m}</mark>`);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.deleteConfirm()) { this.deleteConfirm.set(false); return; }
    this.menuOpen.set(false);
    this.infoOpen.set(false);
    this.emojiOpen.set(false);
    if (this.searchOpen()) { this.searchOpen.set(false); this.searchQuery = ''; }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-menu]')) this.menuOpen.set(false);
  }

  ngOnInit(): void {
    this.store.select(selectUserId).pipe(takeUntil(this.destroy$)).subscribe(id => this.currentUserId.set(id));
    this.store.select(selectRole).pipe(takeUntil(this.destroy$)).subscribe(r => this.isSeller.set(r === 'SELLER'));

    const id = this.route.snapshot.paramMap.get('id')!;
    this.convId.set(id);
    this.load();

    interval(5000).pipe(takeUntil(this.destroy$)).subscribe(() => this.poll());
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) { this.scrollToBottom(); this.shouldScroll = false; }
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  goBack(): void {
    const base = this.isSeller() ? '/seller/messages' : '/messages';
    this.router.navigate([base]);
  }

  openInfo(): void {
    this.menuOpen.set(false);
    const conv = this.conversation();
    if (!this.isSeller() && conv?.storeSlug) {
      this.router.navigate(['/store', conv.storeSlug]);
      return;
    }
    this.infoOpen.set(true);
  }

  confirmDelete(): void {
    this.menuOpen.set(false);
    this.deleteConfirm.set(true);
  }

  deleteChat(): void {
    this.deleting.set(true);
    this.chatService.deleteConversation(this.convId()).subscribe({
      next: () => {
        const base = this.isSeller() ? '/seller/messages' : '/messages';
        this.router.navigate([base]);
      },
      error: () => this.deleting.set(false),
    });
  }

  toggleSearch(): void {
    this.searchOpen.update(v => !v);
    if (!this.searchOpen()) this.searchQuery = '';
  }

  toggleEmoji(): void { this.emojiOpen.update(v => !v); }

  insertEmoji(emoji: string): void {
    this.draft += emoji;
    this.emojiOpen.set(false);
    this.msgInput?.nativeElement.focus();
  }

  onFileSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imageFileName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagePreview.set(null);
    this.imageFileName.set('');
  }

  onEnter(e: Event): void {
    const ke = e as KeyboardEvent;
    if (!ke.shiftKey) { ke.preventDefault(); this.send(); }
  }

  autoGrow(e: Event): void {
    const el = e.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  send(): void {
    const content = this.imagePreview() ?? this.draft.trim();
    if (!content || this.sending()) return;
    this.sending.set(true);
    this.draft = '';
    this.removeImage();
    this.chatService.sendMessage(this.convId(), { content }).subscribe({
      next: (res) => {
        this.messages.update(msgs => [...msgs, res.data]);
        this.shouldScroll = true;
        this.sending.set(false);
        this.appRef.tick();
      },
      error: () => this.sending.set(false),
    });
  }

  private load(): void {
    this.chatService.getConversation(this.convId()).subscribe({
      next: (res) => this.conversation.set(res.data),
      error: () => {},
    });
    this.chatService.getMessages(this.convId()).subscribe({
      next: (res) => {
        this.messages.set(res.data);
        this.loading.set(false);
        this.shouldScroll = true;
        this.appRef.tick();
      },
      error: () => this.loading.set(false),
    });
  }

  private poll(): void {
    this.chatService.getMessages(this.convId()).subscribe({
      next: (res) => {
        if (res.data.length !== this.messages().length) {
          this.messages.set(res.data);
          this.shouldScroll = true;
        }
        this.polling.set(true);
        this.appRef.tick();
      },
      error: () => this.polling.set(false),
    });
  }

  private scrollToBottom(): void {
    try {
      const el = this.scrollEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
