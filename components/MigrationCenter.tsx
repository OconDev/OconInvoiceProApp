
import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  Users, 
  FileCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Database,
  Info,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { Client, Invoice, Estimate, InvoiceStatus, EstimateStatus } from '../types';
import { parseCSV } from '../utils/export';
import { safeISODate } from '../utils/date';

interface MigrationCenterProps {
  onImportClients: (clients: Client[]) => void;
  onImportInvoices: (invoices: Invoice[]) => void;
  onImportEstimates: (estimates: Estimate[]) => void;
  existingClients: Client[];
}

const MigrationCenter: React.FC<MigrationCenterProps> = ({ 
  onImportClients, 
  onImportInvoices, 
  onImportEstimates,
  existingClients
}) => {
  const [activeStep, setActiveStep] = useState<'selection' | 'preview'>('selection');
  const [importType, setImportType] = useState<'clients' | 'invoices' | 'estimates' | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates = {
    clients: "Name,Email,Street,City,State,Zip,Phone\nJohn Doe,john@example.com,123 Main St,San Francisco,CA,94105,+123456789",
    invoices: "InvoiceNumber,ClientEmail,Title,Date,DueDate,Amount,Status,Tax\nINV-001,john@example.com,Web Design,2023-10-01,2023-10-15,1500,Sent,10",
    estimates: "EstimateNumber,ClientEmail,Title,Date,ExpiryDate,Amount,Status,Tax\nEST-001,john@example.com,Logo Design,2023-10-01,2023-10-31,500,Sent,10"
  };

  const downloadTemplate = (type: 'clients' | 'invoices' | 'estimates') => {
    const csvContent = "data:text/csv;charset=utf-8," + templates[type];
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `oconpro_${type}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>, type: 'clients' | 'invoices' | 'estimates') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportType(type);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rawRows = parseCSV(text);
      validateAndPreview(rawRows, type);
    };
    reader.readAsText(file);
  };

  const validateAndPreview = (rows: any[], type: 'clients' | 'invoices' | 'estimates') => {
    const newErrors: string[] = [];
    const validated: any[] = [];

    rows.forEach((row, idx) => {
      if (type === 'clients') {
        if (!row.Name || !row.Email) {
          newErrors.push(`Row ${idx + 2}: Missing Name or Email.`);
        } else {
          validated.push(row);
        }
      } else if (type === 'invoices') {
        if (!row.InvoiceNumber || !row.ClientEmail || !row.Amount) {
          newErrors.push(`Row ${idx + 2}: Missing InvoiceNumber, ClientEmail or Amount.`);
        } else {
          validated.push(row);
        }
      } else if (type === 'estimates') {
        if (!row.EstimateNumber || !row.ClientEmail || !row.Amount) {
          newErrors.push(`Row ${idx + 2}: Missing EstimateNumber, ClientEmail or Amount.`);
        } else {
          validated.push(row);
        }
      }
    });

    setPreviewData(validated);
    setErrors(newErrors);
    setActiveStep('preview');
  };

  const finalizeImport = () => {
    if (importType === 'clients') {
      const newClients: Client[] = previewData.map(row => {
        const street = row.Street || row.Address || '';
        const city = row.City || '';
        const state = row.State || '';
        const zip = row.Zip || '';
        
        // Construct full address for backward compatibility
        const fullAddress = street 
          ? `${street}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}${zip ? ` ${zip}` : ''}`
          : 'No Address Provided';

        return {
          id: 'c_' + Math.random().toString(36).substr(2, 9),
          name: row.Name,
          email: row.Email,
          address: fullAddress,
          street,
          city,
          state,
          zip,
          phone: row.Phone || ''
        };
      });
      onImportClients(newClients);
    } else if (importType === 'invoices' || importType === 'estimates') {
      const processedDocs = previewData.map(row => {
        // Find or create ghost client
        let client = existingClients.find(c => c.email.toLowerCase() === row.ClientEmail.toLowerCase());
        const clientId = client?.id || 'c_guest_' + Date.now();
        
        const common = {
          id: (importType === 'invoices' ? 'inv_' : 'est_') + Math.random().toString(36).substr(2, 9),
          title: row.Title || (importType === 'invoices' ? 'Invoice' : 'Estimate'),
          date: safeISODate(row.Date),
          clientId,
          items: [{
            id: 'item_1',
            title: row.Title || 'Imported Service',
            description: row.Title || 'Imported Line Item',
            quantity: 1,
            rate: parseFloat(row.Amount) || 0
          }],
          tax: parseFloat(row.Tax) || 0,
          discount: 0,
          total: parseFloat(row.Amount) || 0,
          notes: 'Imported via Migration Center',
          template: 'classic' as const,
          activity: [{ id: '1', timestamp: new Date().toISOString(), action: 'Created' as const }],
          publicUrl: `https://oconpro.io/${importType === 'invoices' ? 'i' : 'e'}/${Date.now()}`
        };

        if (importType === 'invoices') {
          return {
            ...common,
            invoiceNumber: row.InvoiceNumber,
            dueDate: safeISODate(row.DueDate),
            status: (row.Status as InvoiceStatus) || InvoiceStatus.SENT,
            payments: []
          } as Invoice;
        } else {
          return {
            ...common,
            estimateNumber: row.EstimateNumber,
            expiryDate: safeISODate(row.ExpiryDate),
            status: (row.Status as EstimateStatus) || EstimateStatus.SENT
          } as Estimate;
        }
      });

      if (importType === 'invoices') onImportInvoices(processedDocs as Invoice[]);
      else onImportEstimates(processedDocs as Estimate[]);
    }

    alert(`Successfully imported ${previewData.length} records!`);
    setActiveStep('selection');
    setImportType(null);
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">Migration Center</h2>
        <p className="text-slate-500 font-medium text-sm md:text-base">Import your legacy data into OconPro using standardized templates.</p>
      </div>

      {activeStep === 'selection' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Client Migration Card */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col hover:shadow-xl transition-all group">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-brand flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Import Clients</h3>
            <p className="text-sm text-slate-500 mb-8 flex-1">Move your customer directory. Ideal for migrating from CRM systems.</p>
            <div className="space-y-3">
              <button 
                onClick={() => downloadTemplate('clients')}
                className="w-full py-3 rounded-2xl bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
              >
                <Download size={14} /> Get Template
              </button>
              <label className="w-full py-4 rounded-2xl bg-brand text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all">
                <Upload size={18} /> Select CSV
                <input type="file" className="hidden" accept=".csv" onChange={(e) => handleFileSelection(e, 'clients')} />
              </label>
            </div>
          </div>

          {/* Invoice Migration Card */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col hover:shadow-xl transition-all group">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Import Invoices</h3>
            <p className="text-sm text-slate-500 mb-8 flex-1">Bring in historical billing data. Clients will be linked by email automatically. If Google Drive sync is active, imported data will be saved to your cloud storage.</p>
            <div className="space-y-3">
              <button 
                onClick={() => downloadTemplate('invoices')}
                className="w-full py-3 rounded-2xl bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
              >
                <Download size={14} /> Get Template
              </button>
              <label className="w-full py-4 rounded-2xl bg-brand text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all">
                <Upload size={18} /> Select CSV
                <input type="file" className="hidden" accept=".csv" onChange={(e) => handleFileSelection(e, 'invoices')} />
              </label>
            </div>
          </div>

          {/* Estimate Migration Card */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col hover:shadow-xl transition-all group">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Import Estimates</h3>
            <p className="text-sm text-slate-500 mb-8 flex-1">Migrate open proposals and quotes. Keeps your sales pipeline history intact.</p>
            <div className="space-y-3">
              <button 
                onClick={() => downloadTemplate('estimates')}
                className="w-full py-3 rounded-2xl bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
              >
                <Download size={14} /> Get Template
              </button>
              <label className="w-full py-4 rounded-2xl bg-brand text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all">
                <Upload size={18} /> Select CSV
                <input type="file" className="hidden" accept=".csv" onChange={(e) => handleFileSelection(e, 'estimates')} />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-right duration-300">
           <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-brand">
                 <FileSpreadsheet size={24} />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Review Import</h3>
                 <p className="text-slate-500 text-sm font-medium uppercase tracking-widest text-[10px]">Importing {importType} ({previewData.length} records found)</p>
               </div>
             </div>
             <button onClick={() => setActiveStep('selection')} className="p-3 hover:bg-white rounded-2xl text-slate-400 border border-transparent hover:border-slate-100 transition-all">
               <X size={20} />
             </button>
           </div>

           <div className="p-8 space-y-8">
              {errors.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                     <AlertCircle size={20} />
                   </div>
                   <div className="flex-1">
                      <p className="font-bold text-rose-800">Errors Detected</p>
                      <p className="text-xs text-rose-600 mb-3">Some rows have missing or invalid data. These rows will be skipped.</p>
                      <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {errors.map((err, i) => <li key={i} className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">• {err}</li>)}
                      </ul>
                   </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid Data Preview</h4>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{previewData.length} Ready</span>
                </div>
                <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        {previewData.length > 0 && Object.keys(previewData[0]).map(k => <th key={k} className="px-6 py-4">{k}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {previewData.slice(0, 10).map((row, i) => (
                         <tr key={i} className="text-xs text-slate-600">
                           {Object.values(row).map((v: any, j) => <td key={j} className="px-6 py-4 truncate max-w-[150px]">{v}</td>)}
                         </tr>
                       ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <div className="p-4 text-center bg-slate-50/30">
                       <p className="text-[10px] font-black text-slate-300 uppercase">...and {previewData.length - 10} more records</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4 pt-6">
                <button 
                  onClick={() => setActiveStep('selection')}
                  className="w-full md:w-auto px-8 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all text-sm"
                >
                  Cancel & Restart
                </button>
                <button 
                  onClick={finalizeImport}
                  className="w-full md:flex-1 bg-brand text-white py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Database size={24} /> Confirm Migration
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold justify-center uppercase tracking-widest">
                <Info size={12} /> Data is merged into your current browser profile.
              </div>
           </div>
        </div>
      )}

      {/* Migration FAQ Section */}
      <section className="mt-20">
         <div className="flex items-center gap-2 mb-8">
           <Database size={20} className="text-brand" />
           <h3 className="text-lg font-bold text-slate-800 tracking-tight">Data Migration Tips</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 space-y-4">
               <h4 className="font-bold text-slate-800 flex items-center gap-2">
                 <CheckCircle2 size={18} className="text-emerald-500" /> Bulk Importing Invoices
               </h4>
               <p className="text-sm text-slate-500 leading-relaxed">Ensure the <code className="bg-slate-50 px-1 rounded">ClientEmail</code> in your CSV matches an existing client's email in OconPro. If the email doesn't exist, we'll create a "Guest Client" profile for you automatically.</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 space-y-4">
               <h4 className="font-bold text-slate-800 flex items-center gap-2">
                 <ArrowRight size={18} className="text-blue-500" /> Exporting from Excel
               </h4>
               <p className="text-sm text-slate-500 leading-relaxed">Save your Excel or Google Sheet as <strong>CSV (Comma Separated Values)</strong>. Make sure headers match our templates exactly to avoid skipping rows.</p>
            </div>
         </div>
      </section>
    </div>
  );
};

export default MigrationCenter;
