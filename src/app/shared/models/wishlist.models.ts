export interface WishlistItem {
  itemId: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  finalPrice: number;
  inStock: boolean;
  addedAt: string;
  priceAtAdding: number | null;
  onSale: boolean;
}

export interface Wishlist {
  id: string;
  name: string;
  isPublic: boolean;
  items: WishlistItem[];
  createdAt: string;
}

export interface CreateWishlistRequest {
  name: string;
  isPublic: boolean;
}
