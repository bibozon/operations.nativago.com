export interface Partner {
  id: string;
  name: string;
  legalName?: string | null;
  taxId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Operator {
  id: string;
  partnerId: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
