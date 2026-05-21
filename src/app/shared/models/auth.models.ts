import { Role } from './enums';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: Role;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: Role;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AddressResponse {
  id: string;
  label: string;
  street: string;
  number: string;
  floor: string | null;
  apartment: string | null;
  city: string;
  department: string;
  country: string;
  postalCode: string | null;
  primary: boolean;
  createdAt: string;
}

export interface AddressRequest {
  label: string;
  street: string;
  number: string;
  floor?: string;
  apartment?: string;
  city: string;
  department: string;
  postalCode?: string;
}
