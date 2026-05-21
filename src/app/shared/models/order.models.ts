import { OrderGroupStatus, OrderStatus } from './enums';

export interface OrderItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderGroup {
  id: string;
  sellerId: string;
  status: OrderGroupStatus;
  subtotal: number;
  trackingNumber: string | null;
  items: OrderItem[];
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  totalItems: number;
  total: number;
  createdAt: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  groups: OrderGroup[];
  shippingAddress: Record<string, unknown>;
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}
