export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  priceChanged: boolean;
  currentPrice: number;
  availableStock: number;
  productSlug: string | null;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
  totalItems: number;
  hasPriceChanges: boolean;
}

export interface AddCartItemRequest {
  productId: string;
  quantity: number;
}
