export interface ConversationResponse {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  storeName: string;
  storeSlug?: string;
  storeLogoUrl?: string;
  productId?: string;
  productName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'BUYER' | 'SELLER';
  senderName: string;
  senderAvatar?: string;
  content: string;
  readByBuyer: boolean;
  readBySeller: boolean;
  createdAt: string;
}

export interface StartConversationRequest {
  sellerId: string;
  productId?: string;
  firstMessage: string;
}

export interface SendMessageRequest {
  content: string;
}
