export interface Client {
  id: number;
  name: string;
  email: string;
  address: string;
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  client_name?: string;
  client_email?: string;
  client_address?: string;
  date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  tax_rate: number;
  discount: number;
  notes: string;
  items: InvoiceItem[];
}

export interface DashboardStats {
  count: number;
  paid: number;
  pending: number;
}
