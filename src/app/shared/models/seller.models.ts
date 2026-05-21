import { SellerStatus, TipoDocumento, TipoRegimen, TipoCuentaPago } from './enums';

export interface PublicSellerResponse {
  id: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  city: string;
  department: string;
}

export interface SellerResponse {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  razonSocial: string;
  tipoRegimen: TipoRegimen;
  phone: string;
  address: string;
  city: string;
  department: string;
  status: SellerStatus;
  createdAt: string;
}

export interface RegisterSellerRequest {
  storeName: string;
  storeDescription?: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  razonSocial: string;
  tipoRegimen: TipoRegimen;
  phone: string;
  address: string;
  city: string;
  department: string;
}

export interface PaymentAccountResponse {
  id: string;
  bankName: string;
  accountType: TipoCuentaPago;
  accountNumberMasked: string;
  accountHolder: string;
  documentType: TipoDocumento;
  documentNumber: string;
  active: boolean;
  createdAt: string;
}

export interface PaymentAccountRequest {
  bankName: string;
  accountType: TipoCuentaPago;
  accountNumber: string;
  accountHolder: string;
  documentType: TipoDocumento;
  documentNumber: string;
}
