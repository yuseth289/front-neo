import {
  Component, inject, OnInit, OnDestroy, signal,
  AfterViewChecked, ElementRef, ViewChild, HostListener,
} from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
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
  imports: [CommonModule, FormsModule, NgIcon, NgClass],
  template: `
    <!-- ── HEADER ─────────────────────────────────────────────── -->
    <div class="px-4 py-3 flex items-center gap-3 shrink-0 border-b border-border bg-bg-surface">

      <!-- Botón atrás solo en móvil -->
      <button class="md:hidden p-1.5 -ml-1 rounded-lg text-text-muted hover:text-text-primary
                     hover:bg-bg-elevated transition-colors shrink-0"
              (click)="goBack()" aria-label="Volver">
        <ng-icon name="lucideArrowLeft" size="18" />
      </button>

      @if (conversation()) {
        <div class="w-9 h-9 rounded-full overflow-hidden border border-border bg-bg-elevated
                    flex items-center justify-center font-bold text-accent text-sm shrink-0">
          @if (!isSeller() && conversation()!.storeLogoUrl) {
            <img [src]="conversation()!.storeLogoUrl" alt="" class="w-full h-full object-cover" />
          } @else {
            {{ (isSeller() ? conversation()!.buyerName : conversation()!.storeName)[0] }}
          }
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-semibold text-text-primary truncate leading-tight">
            {{ isSeller() ? conversation()!.buyerName : conversation()!.storeName }}
          </p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full shrink-0"
                  [class.bg-success]="polling()"
                  [class.bg-text-muted]="!polling()"></span>
            <span class="text-[11px]"
                  [class.text-success]="polling()"
                  [class.text-text-muted]="!polling()">
              {{ polling() ? 'En línea' : 'Desconectado' }}
            </span>
          </div>
        </div>
      } @else {
        <div class="flex-1"></div>
      }

      <button (click)="toggleSearch()"
        class="p-1.5 rounded-lg transition-colors"
        [ngClass]="searchOpen()
          ? 'text-accent bg-accent/10'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'">
        <ng-icon name="lucideSearch" size="16" />
      </button>
      <!-- More options -->
      <div class="relative" data-menu>
        <button (click)="menuOpen.set(!menuOpen())"
          class="p-1.5 rounded-lg text-text-muted hover:text-text-primary
                 hover:bg-bg-elevated transition-colors"
          [ngClass]="menuOpen() ? 'bg-bg-elevated text-text-primary' : ''">
          <ng-icon name="lucideMoreHorizontal" size="16" />
        </button>

        @if (menuOpen()) {
          <div class="absolute right-0 top-full mt-1 w-52 z-50
                      bg-bg-surface border border-border rounded-[12px]
                      shadow-[var(--shadow-card-lift)] overflow-hidden py-1">

            <!-- Info de contacto -->
            <button (click)="openInfo()"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-[13px]
                     text-text-primary hover:bg-bg-elevated transition-colors text-left">
              <ng-icon name="lucideUser" size="15" class="text-text-muted shrink-0" />
              Info de contacto
            </button>

            <div class="my-1 border-t border-border mx-2"></div>

            <!-- Borrar chat -->
            <button (click)="confirmDelete()"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-[13px]
                     text-error hover:bg-error/8 transition-colors text-left">
              <ng-icon name="lucideTrash2" size="15" class="shrink-0" />
              Borrar chat
            </button>
          </div>
        }
      </div>
    </div>

    <!-- ── INFO PANEL ──────────────────────────────────────────── -->
    @if (infoOpen() && conversation()) {
      <div class="border-b border-border bg-bg-elevated px-4 py-4 shrink-0 flex items-center gap-4">
        <div class="w-12 h-12 rounded-full overflow-hidden border border-border bg-bg-surface
                    flex items-center justify-center font-bold text-accent text-base shrink-0">
          @if (!isSeller() && conversation()!.storeLogoUrl) {
            <img [src]="conversation()!.storeLogoUrl" alt="" class="w-full h-full object-cover" />
          } @else {
            {{ (isSeller() ? conversation()!.buyerName : conversation()!.storeName)[0] }}
          }
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-semibold text-text-primary">
            {{ isSeller() ? conversation()!.buyerName : conversation()!.storeName }}
          </p>
          @if (conversation()!.productName) {
            <p class="text-[12px] text-text-muted mt-0.5 flex items-center gap-1">
              <ng-icon name="lucidePackage" size="11" />
              Sobre: {{ conversation()!.productName }}
            </p>
          }
          <p class="text-[11px] text-text-muted mt-0.5">
            Conversación iniciada {{ conversation()!.createdAt | date:'d MMM yyyy' }}
          </p>
        </div>
        <button (click)="infoOpen.set(false)"
          class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors">
          <ng-icon name="lucideX" size="15" />
        </button>
      </div>
    }

    <!-- ── CONFIRM DELETE ─────────────────────────────────────── -->
    @if (deleteConfirm()) {
      <div class="absolute inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
        <div class="bg-bg-surface border border-border rounded-[16px] p-6 max-w-sm w-full
                    shadow-[var(--shadow-card-lift)]">
          <div class="w-10 h-10 rounded-full bg-error/10 border border-error/30
                      flex items-center justify-center mb-4">
            <ng-icon name="lucideTrash2" size="18" class="text-error" />
          </div>
          <p class="text-[15px] font-semibold text-text-primary">¿Borrar este chat?</p>
          <p class="text-[13px] text-text-muted mt-1 mb-5">
            Se eliminarán todos los mensajes de forma permanente. Esta acción no se puede deshacer.
          </p>
          <div class="flex gap-2">
            <button (click)="deleteConfirm.set(false)"
              class="flex-1 py-2.5 rounded-[10px] border border-border text-[13px]
                     text-text-secondary hover:bg-bg-elevated transition-colors">
              Cancelar
            </button>
            <button (click)="deleteChat()"
              [disabled]="deleting()"
              class="flex-1 py-2.5 rounded-[10px] bg-error text-white text-[13px] font-medium
                     hover:bg-error/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              @if (deleting()) {
                <ng-icon name="lucideRefreshCw" size="13" class="animate-spin" />
              }
              Borrar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ── SEARCH BAR ─────────────────────────────────────────── -->
    @if (searchOpen()) {
      <div class="px-4 py-2 border-b border-border bg-bg-elevated flex items-center gap-2 shrink-0">
        <ng-icon name="lucideSearch" size="14" class="text-text-muted shrink-0" />
        <input #searchInput
          [(ngModel)]="searchQuery"
          placeholder="Buscar en esta conversación…"
          class="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted
                 outline-none border-none" />
        @if (searchQuery) {
          <span class="text-[11px] text-text-muted shrink-0">
            {{ filteredMessages().length }} resultado{{ filteredMessages().length !== 1 ? 's' : '' }}
          </span>
          <button (click)="searchQuery = ''" class="text-text-muted hover:text-text-primary">
            <ng-icon name="lucideX" size="14" />
          </button>
        }
      </div>
    }

    <!-- ── MESSAGES ───────────────────────────────────────────── -->
    <div #scrollContainer
         class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">

      @if (loading()) {
        <div class="flex-1 flex items-center justify-center">
          <ng-icon name="lucideRefreshCw" size="20" class="text-text-muted animate-spin" />
        </div>
      }

      @for (msg of filteredMessages(); track msg.id) {
        <div class="flex gap-2 max-w-[88%] sm:max-w-[78%]"
             [class.ml-auto]="isOwn(msg)"
             [class.flex-row-reverse]="isOwn(msg)">

          <div class="w-7 h-7 rounded-full overflow-hidden border border-border bg-bg-elevated
                      flex items-center justify-center text-[11px] font-bold shrink-0 self-end"
               [class.text-accent]="!isOwn(msg)"
               [class.text-text-muted]="isOwn(msg)">
            @if (msg.senderAvatar) {
              <img [src]="msg.senderAvatar" alt="" class="w-full h-full object-cover" />
            } @else {
              {{ msg.senderName[0] }}
            }
          </div>

          <div class="flex flex-col gap-1" [class.items-end]="isOwn(msg)">
            @if (isImage(msg.content)) {
              <div class="rounded-2xl overflow-hidden max-w-[240px]"
                   [class.rounded-br-sm]="isOwn(msg)"
                   [class.rounded-bl-sm]="!isOwn(msg)">
                <img [src]="msg.content" alt="imagen" class="w-full object-cover" />
              </div>
            } @else {
              <div class="px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                   [class.rounded-br-sm]="isOwn(msg)"
                   [class.rounded-bl-sm]="!isOwn(msg)"
                   [class.bg-accent]="isOwn(msg)"
                   [class.text-white]="isOwn(msg)"
                   [class.bg-bg-elevated]="!isOwn(msg)"
                   [class.border]="!isOwn(msg)"
                   [class.border-border]="!isOwn(msg)"
                   [class.text-text-primary]="!isOwn(msg)"
                   [innerHTML]="highlight(msg.content)">
              </div>
            }
            <span class="text-[10px] text-text-muted px-1 flex items-center gap-1">
              {{ msg.createdAt | date:'h:mm a' }}
              @if (isOwn(msg) && ((isSeller() && msg.readByBuyer) || (!isSeller() && msg.readBySeller))) {
                <ng-icon name="lucideCheck" size="10" class="text-success" />
              }
            </span>
          </div>
        </div>
      }
      <div class="h-1 shrink-0"></div>
    </div>

    <!-- ── IMAGE PREVIEW ─────────────────────────────────────── -->
    @if (imagePreview()) {
      <div class="px-4 py-2 border-t border-border bg-bg-elevated flex items-center gap-3 shrink-0">
        <div class="relative w-14 h-14 rounded-xl overflow-hidden border border-border shrink-0">
          <img [src]="imagePreview()!" alt="" class="w-full h-full object-cover" />
          <button (click)="removeImage()"
            class="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white
                   flex items-center justify-center">
            <ng-icon name="lucideX" size="10" />
          </button>
        </div>
        <span class="text-[12px] text-text-muted truncate flex-1">{{ imageFileName() }}</span>
      </div>
    }

    <!-- ── EMOJI PICKER ──────────────────────────────────────── -->
    @if (emojiOpen()) {
      <div class="border-t border-border bg-bg-elevated px-3 py-2.5 shrink-0">
        <div class="grid grid-cols-8 sm:grid-cols-10 gap-0.5">
          @for (e of emojis; track e) {
            <button (click)="insertEmoji(e)"
              class="h-8 w-full flex items-center justify-center text-[18px] rounded-lg
                     hover:bg-bg-surface transition-colors">
              {{ e }}
            </button>
          }
        </div>
      </div>
    }

    <!-- ── INPUT ─────────────────────────────────────────────── -->
    <div class="px-3 py-2.5 flex items-end gap-2 shrink-0 border-t border-border bg-bg-surface">

      <input #fileInput type="file" accept="image/*" class="hidden"
             (change)="onFileSelected($event)" />

      <button (click)="fileInput.click()"
        class="p-2 transition-colors shrink-0"
        [ngClass]="imagePreview()
          ? 'text-accent'
          : 'text-text-muted hover:text-text-primary'">
        <ng-icon name="lucidePaperclip" size="18" />
      </button>

      <textarea #msgInput
        [(ngModel)]="draft"
        (keydown.enter)="onEnter($event)"
        placeholder="Escribe un mensaje…"
        rows="1"
        class="flex-1 bg-transparent border-none outline-none resize-none
               text-[14px] text-text-primary placeholder:text-text-muted
               max-h-[120px] leading-relaxed py-1.5"
        (input)="autoGrow($event)">
      </textarea>

      <button (click)="toggleEmoji()"
        class="p-2 transition-colors shrink-0"
        [ngClass]="emojiOpen()
          ? 'text-accent'
          : 'text-text-muted hover:text-text-primary'">
        <ng-icon name="lucideSmile" size="18" />
      </button>

      <button (click)="send()" [disabled]="(!draft.trim() && !imagePreview()) || sending()"
        class="w-9 h-9 rounded-full flex items-center justify-center shrink-0
               transition-all duration-200
               disabled:cursor-not-allowed"
        [style.background]="(!draft.trim() && !imagePreview()) || sending() ? 'var(--color-bg-elevated)' : 'var(--color-accent)'"
        [style.box-shadow]="(!draft.trim() && !imagePreview()) || sending() ? 'none' : '0 0 14px var(--color-accent-glow)'">
        @if (sending()) {
          <ng-icon name="lucideRefreshCw" size="16" class="animate-spin"
            [style.color]="'var(--color-accent)'" />
        } @else {
          <ng-icon name="lucideSend" size="16"
            [style.color]="(!draft.trim() && !imagePreview()) ? 'var(--color-text-muted)' : 'white'" />
        }
      </button>
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

  isOwn     = (msg: MessageResponse) => msg.senderId === this.currentUserId();
  isImage   = (content: string) => content.startsWith('data:image');

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
