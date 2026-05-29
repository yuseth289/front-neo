import { ProductStatus, ReviewStatus } from './enums';

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  primary: boolean;
}

export interface ProductSummary {
  id: string;
  sellerId: string;
  categoryId: string;
  name: string;
  slug: string;
  brand: string;
  basePrice: number;
  finalPrice: number;
  status: ProductStatus;
  primaryImageUrl: string | null;
  averageRating?: number | null;
  totalReviews?: number | null;
}

export interface ProductDetail {
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
  status: ProductStatus;
  availableStock?: number | null;
  images: ProductImage[];
  specifications?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  children: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  active: boolean;
}

export interface Review {
  id: string;
  productId: string | null;
  userId: string;
  buyerName: string | null;
  rating: number | null;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  rejectReason: string | null;
  createdAt: string;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
}

export interface PublicSeller {
  id: string;
  storeName: string;
  storeSlug: string;
  storeDescription: string | null;
  storeLogoUrl: string | null;
  storeBannerUrl: string | null;
  city: string;
  department: string;
}

export interface ProductFilters {
  q?: string;
  categoryId?: string;
  page?: number;
  size?: number;
  sort?: string;
}
