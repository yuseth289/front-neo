import { ProductStatus } from './enums';

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

export interface ProductImageResponse {
  id: string;
  url: string;
  primary: boolean;
  displayOrder: number;
}

export interface ProductSummaryResponse {
  id: string;
  sellerId: string;
  categoryId: string;
  name: string;
  slug: string;
  brand: string;
  basePrice: number;
  finalPrice: number;
  status: ProductStatus;
  availableStock?: number | null;
  primaryImageUrl?: string;
}

export interface ProductResponse {
  id: string;
  sellerId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  sku: string;
  basePrice: number;
  ivaPercent: number;
  finalPrice: number;
  condition?: string;
  status: ProductStatus;
  availableStock?: number | null;
  images: ProductImageResponse[];
  specifications?: Record<string, string>;
  createdAt: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  brand: string;
  sku: string;
  categoryId: string;
  basePrice: number;
  ivaPercent: number;
  condition?: string;
  specifications?: Record<string, string>;
}

export interface OfferResponse {
  id: string;
  productId: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface CreateOfferRequest {
  discountPercent: number;
  startDate: string;
  endDate: string;
}

export interface InventoryResponse {
  productId: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
}

export interface StockMovementResponse {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  notes?: string;
  createdAt: string;
}
