import { CheckoutStatus, PaymentMethod } from './enums';

export interface CheckoutItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Checkout {
  id: string;
  status: CheckoutStatus;
  items: CheckoutItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: PaymentMethod;
  expiresAt: string;
  minutesLeft: number;
  createdAt: string;
}

export interface InitCheckoutRequest {
  addressId: string;
  paymentMethod: PaymentMethod;
}
