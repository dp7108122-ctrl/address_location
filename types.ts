export interface Client {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  gender: 'male' | 'female' | 'other';
  dob: string;
  avatar?: string;
  createdAt: number;
}

export interface ClientFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  gender: 'male' | 'female' | 'other';
  dob: string;
  file?: FileList;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: keyof Client;
  direction: SortDirection;
}