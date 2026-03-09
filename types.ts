
export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  PARTIAL = 'Partial',
  OVERDUE = 'Overdue'
}

export enum EstimateStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  APPROVED = 'Approved',
  DECLINED = 'Declined'
}

export type DocumentTemplate = 'classic' | 'modern' | 'minimal';

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: 'Created' | 'Sent' | 'Viewed' | 'Downloaded' | 'Paid' | 'Approved' | 'Declined' | 'Signed';
  note?: string;
}

export interface InvoiceItem {
  id: string;
  title: string;
  description: string;
  quantity: number;
  rate: number;
  unit?: string;
}

export interface LibraryItem {
  id: string;
  name: string;
  description: string;
  defaultRate: number;
  unit: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string; // Keep for backward compatibility or full string
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
}

export interface BusinessSettings {
  name: string;
  email: string;
  address: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  logo?: string;
  currency: string;
  taxRate: number;
  defaultDiscount: number;
  discountAfterTax: boolean;
  defaultUnit?: string;
  paymentTerms: string;
  brandColor: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  website?: string;
  paymentLink?: string;
  defaultSignature?: string;
  // Default Content Settings
  defaultNotesInvoice?: string;
  defaultNotesEstimate?: string;
  defaultEmailSubject?: string;
  defaultEmailBody?: string;
  // Reminder Settings
  overdueReminderDays?: number;
  defaultReminderMessage?: string;
}

export interface EstimateGroup {
  id: string;
  name: string;
}

export interface InvoiceGroup {
  id: string;
  name: string;
}

export interface Invoice {
  id: string;
  title: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientId: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  notes: string;
  discount: number;
  tax: number;
  total: number;
  template: DocumentTemplate;
  lastReminderSent?: string;
  payments?: any[];
  activity: ActivityLog[];
  publicUrl: string;
  groupId?: string;
  signatureMe?: string;
  signatureClient?: string;
  signatureClientDate?: string;
}

export interface Estimate {
  id: string;
  title: string;
  estimateNumber: string;
  date: string;
  expiryDate: string;
  clientId: string;
  items: InvoiceItem[];
  status: EstimateStatus;
  notes: string;
  discount: number;
  tax: number;
  total: number;
  template: DocumentTemplate;
  activity: ActivityLog[];
  publicUrl: string;
  groupId?: string;
  signatureMe?: string;
  signatureClient?: string;
  signatureClientDate?: string;
}

export type View = 'dashboard' | 'invoices' | 'estimates' | 'clients' | 'payments' | 'library' | 'settings' | 'new-invoice' | 'new-estimate' | 'migration' | 'about';

export type Document = Invoice | Estimate;
export type Workspace = InvoiceGroup | EstimateGroup;
export type DocumentStatus = InvoiceStatus | EstimateStatus;
