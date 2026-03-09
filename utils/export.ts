
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { Invoice, Estimate, Client, InvoiceStatus, EstimateStatus, BusinessSettings } from '../types';

import { generateStandardWordTemplate } from './wordExportTemplates';

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',')
  );

  // Add UTF-8 BOM for Excel compatibility
  const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToWord = async (docData: any, type: 'invoice' | 'estimate', client: Client | undefined, business: BusinessSettings) => {
  const docTitle = docData.title || (type === 'invoice' ? 'Invoice' : 'Estimate');
  const docNumber = docData.invoiceNumber || docData.estimateNumber;
  
  const doc = generateStandardWordTemplate(docData, type, client, business);

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${docTitle}_${docNumber}.docx`);
};

export const parseCSV = (text: string): any[] => {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  let headerLine = lines[0];
  // Remove BOM if present
  if (headerLine.charCodeAt(0) === 0xFEFF) {
    headerLine = headerLine.substring(1);
  }

  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index]?.replace(/^"|"$/g, '');
    });
    return obj;
  });
};

export const prepareInvoicesForExport = (invoices: Invoice[], clients: Client[]) => {
  return invoices.map(inv => ({
    'Document Title': inv.title || 'Invoice',
    'Invoice Number': inv.invoiceNumber,
    'Client Name': clients.find(c => c.id === inv.clientId)?.name || 'Unknown',
    'Client Email': clients.find(c => c.id === inv.clientId)?.email || '',
    'Issue Date': new Date(inv.date).toLocaleDateString(),
    'Due Date': new Date(inv.dueDate).toLocaleDateString(),
    'Status': inv.status,
    'Tax %': inv.tax,
    'Discount': inv.discount,
    'Subtotal': inv.total + inv.discount - (inv.total * (inv.tax / 100)),
    'Total Amount': inv.total
  }));
};

export const prepareEstimatesForExport = (estimates: Estimate[], clients: Client[]) => {
  return estimates.map(est => ({
    'Document Title': est.title || 'Estimate',
    'Estimate Number': est.estimateNumber,
    'Client Name': clients.find(c => c.id === est.clientId)?.name || 'Unknown',
    'Client Email': clients.find(c => c.id === est.clientId)?.email || '',
    'Creation Date': new Date(est.date).toLocaleDateString(),
    'Expiry Date': new Date(est.expiryDate).toLocaleDateString(),
    'Status': est.status,
    'Tax %': est.tax,
    'Total Amount': est.total
  }));
};
