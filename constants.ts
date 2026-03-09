
import { InvoiceStatus, EstimateStatus } from './types';

export const COLORS = {
  PRIMARY: '#6366f1', // Indigo 500
  SUCCESS: '#22c55e',
  DANGER: '#ef4444',
  WARNING: '#f59e0b',
  SLATE_900: '#0f172a',
  SLATE_800: '#1e293b',
  SLATE_700: '#334155',
};

// Map status colors using individual enums as keys to avoid type property access errors
export const STATUS_COLORS: Record<string, string> = {
  [InvoiceStatus.DRAFT]: 'bg-slate-500',
  [InvoiceStatus.SENT]: 'bg-blue-500',
  [EstimateStatus.APPROVED]: 'bg-indigo-500',
  [InvoiceStatus.PAID]: 'bg-emerald-500',
  [InvoiceStatus.OVERDUE]: 'bg-rose-500',
  [EstimateStatus.DECLINED]: 'bg-amber-700',
};

export const DEFAULT_SETTINGS = {
  name: 'Ocon Tech Solutions',
  email: 'hello@ocontech.com',
  address: '123 Innovation Drive, Tech Valley, CA 94043',
  currency: 'USD',
  taxRate: 10,
  defaultDiscount: 0,
  discountAfterTax: false,
  defaultUnit: 'unit',
  paymentTerms: 'Net 30',
  brandColor: '#6366f1',
  dateFormat: 'MM/DD/YYYY' as const,
  overdueReminderDays: 7,
  defaultReminderMessage: 'Gentle reminder: Your invoice is past due.'
};
