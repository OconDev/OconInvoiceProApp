
import React, { useRef, useState, useMemo } from 'react';
import { Search, Trash2, Edit2, Eye, FileCheck, Plus, FileSpreadsheet, Upload, ChevronDown, Send, Copy, Sparkles, Clock, ArrowRight, User } from 'lucide-react';
import { Estimate, Client, EstimateStatus } from '../types';
import { exportToCSV, prepareEstimatesForExport, parseCSV } from '../utils/export';
import { formatSafeDate, safeISODate } from '../utils/date';

interface EstimateListProps {
  estimates: Estimate[];
  clients: Client[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (estimate: Estimate) => void;
  onConvert: (est: Estimate) => void;
  onPreview: (est: Estimate) => void;
  onUpdateStatus: (id: string, status: EstimateStatus) => void;
  onNew: () => void;
  onImport: (newEstimates: Estimate[], newClients: Client[]) => void;
  currency: string;
}

const EstimateList: React.FC<EstimateListProps> = ({ estimates, clients, onEdit, onDelete, onDuplicate, onConvert, onPreview, onUpdateStatus, onNew, onImport, currency }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  const activeProposals = useMemo(() => {
    return estimates
      .filter(e => e.status === EstimateStatus.SENT)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [estimates]);

  const getStatusStyle = (status: EstimateStatus) => {
    switch (status) {
      case EstimateStatus.APPROVED: return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800';
      case EstimateStatus.DECLINED: return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800';
      case EstimateStatus.SENT: return 'bg-brand/5 dark:bg-brand/10 text-brand border-brand/10 dark:border-brand/20';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700';
    }
  };

  const handleExport = () => {
    const preparedData = prepareEstimatesForExport(estimates, clients);
    exportToCSV(preparedData, `Estimates_Export_${new Date().toISOString().split('T')[0]}`);
  };

  const filteredEstimates = estimates.filter(est => {
    const client = clients.find(c => c.id === est.clientId);
    return est.estimateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           est.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Active Proposals Slider - Fully Responsive */}
      {activeProposals.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={16} className="text-brand" />
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active High-Value Proposals</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide snap-x snap-mandatory touch-pan-x">
             {activeProposals.map(est => {
                const client = clients.find(c => c.id === est.clientId);
                return (
                  <div 
                    key={est.id} 
                    className="snap-center shrink-0 w-[85%] sm:w-80 bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group" 
                    onClick={() => onPreview(est)}
                  >
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                           <FileCheck size={20} />
                        </div>
                        <span className="bg-brand/10 text-brand text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-brand/10">
                           {est.status}
                        </span>
                     </div>
                     <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 truncate">{client?.name || 'Quick Prospect'}</p>
                     <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate mb-4">{est.title}</h4>
                     <div className="flex items-end justify-between">
                        <div>
                           <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-0.5">Estimated Total</p>
                           <p className="text-xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(est.total)}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center group-hover:bg-brand transition-colors">
                           <ArrowRight size={16} />
                        </div>
                     </div>
                  </div>
                )
             })}
          </div>
        </section>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight text-balance">Estimates</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Draft, manage, and track proposals.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex gap-2 flex-1 sm:flex-none">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all"
            >
              <Upload size={18} /> <span className="sm:hidden lg:inline">Import</span>
            </button>
            <button 
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all"
            >
              <FileSpreadsheet size={18} /> <span className="sm:hidden lg:inline">Export</span>
            </button>
          </div>
          <button 
            onClick={onNew} 
            className="flex items-center justify-center gap-2 bg-brand hover:scale-[1.02] active:scale-95 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-brand/20"
          >
            <Plus size={20} /> Create New
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={() => {}} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        {/* Search Bar */}
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-3 rounded-[20px] border border-slate-200 dark:border-slate-700 w-full md:w-96 shadow-sm focus-within:ring-2 ring-brand/10 transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by client or #" 
              className="bg-transparent border-none outline-none text-sm w-full font-medium dark:text-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
              <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <th className="px-8 py-5">Document / ID</th>
                <th className="px-8 py-5">Client Name</th>
                <th className="px-8 py-5">Status / Activity</th>
                <th className="px-8 py-5 text-right">Estimated Amount</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredEstimates.length === 0 ? (
                <tr><td colSpan={5} className="py-24 text-center text-slate-400 dark:text-slate-500 italic font-medium">No results found.</td></tr>
              ) : filteredEstimates.map(est => {
                const client = clients.find(c => c.id === est.clientId);
                const sentActivity = (est.activity || []).find(a => a.action === 'Sent');
                return (
                  <tr key={est.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-tighter">{est.title || 'Estimate'}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">#{est.estimateNumber}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{client?.name || '—'}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">{client?.email}</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setOpenStatusMenu(openStatusMenu === est.id ? null : est.id)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest flex items-center gap-1.5 hover:brightness-95 transition-all ${getStatusStyle(est.status)}`}
                          >
                            {est.status} <ChevronDown size={10} />
                          </button>
                          {sentActivity && (
                            <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                              <Clock size={12} /> {formatSafeDate(sentActivity.timestamp)}
                            </div>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-slate-900 dark:text-slate-100 text-base">{formatCurrency(est.total)}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => onPreview(est)} className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-brand hover:bg-brand/5 rounded-xl transition-all" title="Preview"><Eye size={18} /></button>
                        <button onClick={() => onDuplicate(est)} className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-brand hover:bg-brand/5 rounded-xl transition-all" title="Duplicate"><Copy size={18} /></button>
                        <button onClick={() => onEdit(est.id)} className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-brand hover:bg-brand/5 rounded-xl transition-all" title="Edit"><Edit2 size={18} /></button>
                        {est.status !== EstimateStatus.APPROVED && (
                          <button onClick={() => onConvert(est)} className="p-2.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all" title="Convert to Invoice"><FileCheck size={18} /></button>
                        )}
                        <button onClick={() => onDelete(est.id)} className="p-2.5 text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all" title="Delete"><Trash2 size={18} /></button>
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
          {filteredEstimates.length === 0 ? (
            <div className="py-20 text-center text-slate-400 dark:text-slate-500 font-medium italic">No estimates found.</div>
          ) : filteredEstimates.map(est => {
            const client = clients.find(c => c.id === est.clientId);
            return (
              <div key={est.id} className="p-5 space-y-5 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700">
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 leading-none">{client?.name || 'Quick Quote'}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 tracking-tight">#{est.estimateNumber}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(est.status)}`}>
                    {est.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Estimated Value</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">{formatCurrency(est.total)}</p>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <button onClick={() => onPreview(est)} className="p-3 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-brand transition-all shadow-sm"><Eye size={20} /></button>
                      <button onClick={() => onDuplicate(est)} className="p-3 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-brand transition-all shadow-sm"><Copy size={20} /></button>
                      <button onClick={() => onEdit(est.id)} className="p-3 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-blue-600 transition-all shadow-sm"><Edit2 size={20} /></button>
                      {est.status !== EstimateStatus.APPROVED && (
                        <button onClick={() => onConvert(est)} className="p-3 text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-sm">
                          <FileCheck size={20} />
                        </button>
                      )}
                      <button 
                        onClick={() => onDelete(est.id)} 
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
    </div>
  );
};

export default EstimateList;
