
import React, { useState, useRef } from 'react';
import { 
  Search, 
  Trash2, 
  Edit2, 
  Eye, 
  FileText, 
  FileSpreadsheet,
  Upload,
  Copy,
  Plus,
  CreditCard,
  X,
  Wallet,
  Calendar,
  Banknote,
  CheckCircle2
} from 'lucide-react';
import { Invoice, Client, InvoiceStatus } from '../types';
import { exportToCSV, prepareInvoicesForExport, parseCSV } from '../utils/export';
import { formatSafeDate } from '../utils/date';

interface InvoiceListProps {
  invoices: Invoice[];
  clients: Client[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (invoice: Invoice) => void;
  onNew: () => void;
  onPreview: (inv: Invoice) => void;
  onRecordPayment: (id: string, payment: any) => void;
  onImport: (newInvoices: Invoice[], newClients: Client[]) => void;
  currency: string;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, clients, onEdit, onDelete, onDuplicate, onNew, onPreview, onRecordPayment, onImport, currency }) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModalId, setPaymentModalId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');

  const filteredInvoices = invoices.filter(inv => {
    const matchesFilter = filter === 'all' || inv.status.toLowerCase() === filter.toLowerCase();
    const client = clients.find(c => c.id === inv.clientId);
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusStyle = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case InvoiceStatus.OVERDUE: return 'bg-rose-50 text-rose-700 border-rose-100';
      case InvoiceStatus.SENT: return 'bg-brand/5 text-brand border-brand/10';
      case InvoiceStatus.PARTIAL: return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const handleRecordPayment = (inv: Invoice) => {
    const totalPaid = (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
    setPaymentAmount(inv.total - totalPaid);
    setPaymentModalId(inv.id);
  };

  const submitPayment = () => {
    if (paymentModalId) {
      onRecordPayment(paymentModalId, {
        id: Date.now().toString(),
        amount: paymentAmount,
        method: paymentMethod,
        date: new Date().toISOString()
      });
      setPaymentModalId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Invoices</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Total of {invoices.length} invoices generated.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={onNew}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand text-white px-5 py-3 rounded-xl font-bold shadow-sm transition-all hover:scale-105 active:scale-95 order-first md:order-last"
          >
            <Plus size={20}/> Create Invoice
          </button>
          <button 
            onClick={() => exportToCSV(prepareInvoicesForExport(filteredInvoices, clients), `Invoices_${Date.now()}`)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-5 py-3 rounded-xl font-semibold shadow-sm transition-all"
          >
            <FileSpreadsheet size={20} /> <span className="md:hidden">Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 w-full md:w-80 shadow-sm focus-within:ring-2 ring-brand/10 transition-all">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              className="bg-transparent border-none outline-none text-sm w-full dark:text-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {['all', 'paid', 'sent', 'overdue', 'partial', 'draft'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  filter === s 
                  ? 'bg-brand text-white shadow-md' 
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Title / #</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Status / Payment</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 dark:text-slate-500 italic">No matching invoices found.</td></tr>
              ) : filteredInvoices.map((inv) => {
                const client = clients.find(c => c.id === inv.clientId);
                const totalPaid = (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
                const paidPercentage = Math.min(100, (totalPaid / inv.total) * 100);

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tighter">{inv.title || 'Invoice'}</span>
                         <span className="font-bold text-slate-800 dark:text-slate-100">#{inv.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{client?.name || 'Unknown'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{client?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-2">
                          <span className={`inline-block w-fit px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(inv.status)}`}>
                            {inv.status}
                          </span>
                          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-500 ${inv.status === InvoiceStatus.PAID ? 'bg-emerald-500' : 'bg-brand'}`} style={{ width: `${paidPercentage}%` }} />
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex flex-col">
                          <span className="font-black text-slate-800 dark:text-slate-100">{formatCurrency(inv.total)}</span>
                          {totalPaid > 0 && totalPaid < inv.total && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold">Due: {formatCurrency(inv.total - totalPaid)}</span>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onPreview(inv)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-brand hover:bg-brand/5 rounded-lg transition-all" title="Preview"><Eye size={16} /></button>
                        {inv.status !== InvoiceStatus.PAID && (
                          <button onClick={() => handleRecordPayment(inv)} className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all" title="Record Payment">
                            <Wallet size={16} />
                          </button>
                        )}
                        <button onClick={() => onDuplicate(inv)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-brand hover:bg-brand/5 rounded-lg transition-all" title="Duplicate"><Copy size={16} /></button>
                        <button onClick={() => onEdit(inv.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-brand hover:bg-brand/5 rounded-lg transition-all" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => onDelete(inv.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: High-Touch Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredInvoices.length === 0 ? (
            <div className="py-20 text-center text-slate-400 dark:text-slate-500 font-medium italic">No invoices found.</div>
          ) : filteredInvoices.map((inv) => {
            const client = clients.find(c => c.id === inv.clientId);
            const totalPaid = (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
            const paidPercentage = Math.min(100, (totalPaid / inv.total) * 100);

            return (
              <div key={inv.id} className="p-5 space-y-5 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 leading-none">{client?.name || 'Unknown'}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 tracking-tight">#{inv.invoiceNumber}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(inv.status)}`}>
                    {inv.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-end">
                   <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest leading-none">Total Amount</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">{formatCurrency(inv.total)}</p>
                      <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div className={`h-full transition-all duration-500 ${inv.status === InvoiceStatus.PAID ? 'bg-emerald-500' : 'bg-brand'}`} style={{ width: `${paidPercentage}%` }} />
                      </div>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <button onClick={() => onPreview(inv)} className="p-3 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-brand transition-all shadow-sm"><Eye size={20} /></button>
                      {inv.status !== InvoiceStatus.PAID && (
                        <button onClick={() => handleRecordPayment(inv)} className="p-3 text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-sm">
                          <Wallet size={20} />
                        </button>
                      )}
                      <button onClick={() => onDuplicate(inv)} className="p-3 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-brand transition-all shadow-sm"><Copy size={20} /></button>
                      <button onClick={() => onEdit(inv.id)} className="p-3 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-blue-600 transition-all shadow-sm"><Edit2 size={20} /></button>
                      <button 
                        onClick={() => onDelete(inv.id)} 
                        className="p-3 text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-rose-600 transition-all shadow-sm"
                      >
                        <Trash2 size={20} />
                      </button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModalId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">Record Payment</h3>
                <button onClick={() => setPaymentModalId(null)} className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full"><X size={20}/></button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Payment Amount ({currency})</label>
                  <div className="relative">
                    <input 
                      type="number" step="0.01" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-black text-slate-800 dark:text-slate-100 outline-none focus:ring-2 ring-emerald-500/20" 
                      value={paymentAmount} 
                      onChange={e => setPaymentAmount(+e.target.value)} 
                    />
                    <Banknote size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Payment Method</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>Credit Card</option>
                    <option>Cheque</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => setPaymentModalId(null)} className="flex-1 py-4 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">Cancel</button>
                  <button 
                    onClick={submitPayment}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={20}/> Confirm
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
