import { InvoiceStatus } from './enums';

export interface InvoiceItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  buyerName: string;
  buyerEmail: string;
  buyerDocument: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  items: InvoiceItem[];
  issuedAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}
