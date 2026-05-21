export type Role = 'CLIENT' | 'SELLER' | 'ADMIN';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'DELETED';

export type CheckoutStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export type OrderStatus =
  | 'PENDING'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'PROCESSING'
  | 'PARTIALLY_SHIPPED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type OrderGroupStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type SellerStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export type PaymentMethod =
  | 'MP_CREDIT_CARD'
  | 'MP_DEBIT_CARD'
  | 'MP_PSE'
  | 'MP_EFECTY'
  | 'MP_NEQUI'
  | 'MP_ACCOUNT_MONEY';

export type TipoDocumento = 'CC' | 'NIT' | 'CE' | 'PASSPORT' | 'TI';

export type TipoRegimen = 'RESPONSABLE_IVA' | 'NO_RESPONSABLE_IVA';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED';

export type TipoCuentaPago = 'MERCADO_PAGO' | 'BANK_TRANSFER';
