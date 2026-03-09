
import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  ArrowRight,
  FileText,
  FileCheck,
  Sparkles,
  Eye,
  ChevronDown,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Invoice, Client, BusinessSettings, InvoiceStatus, Estimate, EstimateStatus } from '../types';
import { formatSafeTime, safeDate } from '../utils/date';

interface DashboardProps {
  invoices: Invoice[];
  estimates: Estimate[];
  clients: Client[];
  businessSettings: BusinessSettings;
  onNewAction: (type: 'invoice' | 'estimate') => void;
  onPreview: (type: 'invoice' | 'estimate', data: any) => void;
  onEdit: (type: 'invoice' | 'estimate', id: string) => void;
  onDuplicate: (type: 'invoice' | 'estimate', data: any) => void;
  onDelete: (type: 'invoice' | 'estimate', id: string) => void;
  onConvert: (est: Estimate) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  invoices, 
  estimates, 
  clients, 
  businessSettings, 
  onNewAction, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onConvert,
  onPreview
}) => {
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    else if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);
    else if (timeRange === '90d') cutoff.setDate(now.getDate() - 90);
    else cutoff.setFullYear(2000); // All time

    const filteredInvoices = invoices.filter(inv => safeDate(inv.date) >= cutoff);
    const filteredEstimates = estimates.filter(est => safeDate(est.date) >= cutoff);

    return { filteredInvoices, filteredEstimates };
  }, [invoices, estimates, timeRange]);

  const stats = useMemo(() => {
    const { filteredInvoices, filteredEstimates } = filteredData;
    const invTotal = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const estTotal = filteredEstimates.filter(e => e.status === EstimateStatus.APPROVED).reduce((sum, est) => sum + est.total, 0);
    const overdue = filteredInvoices.filter(i => i.status === InvoiceStatus.OVERDUE).reduce((sum, inv) => sum + inv.total, 0);
    const activeEst = filteredEstimates.filter(e => e.status === EstimateStatus.SENT).length;
    
    // Calculate growth (mocked for now based on simple split of filtered data)
    const growth = 12.5; 

    return { invTotal, estTotal, overdue, activeEst, growth };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const { filteredInvoices } = filteredData;
    const groups: Record<string, number> = {};
    
    // Group by date
    filteredInvoices.forEach(inv => {
      const dateStr = safeDate(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      groups[dateStr] = (groups[dateStr] || 0) + inv.total;
    });

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => safeDate(a.name).getTime() - safeDate(b.name).getTime());
  }, [filteredData]);

  const statusData = useMemo(() => {
    const { filteredInvoices } = filteredData;
    const statuses = {
      [InvoiceStatus.PAID]: 0,
      [InvoiceStatus.SENT]: 0,
      [InvoiceStatus.OVERDUE]: 0,
      [InvoiceStatus.DRAFT]: 0,
      [InvoiceStatus.PARTIAL]: 0,
    };

    filteredInvoices.forEach(inv => {
      statuses[inv.status] = (statuses[inv.status] || 0) + 1;
    });

    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const recentActivity = useMemo(() => {
    const activityItems = [
      ...invoices.map(i => ({ doc: i, docType: 'invoice' as const, docNumber: i.invoiceNumber })),
      ...estimates.map(e => ({ doc: e, docType: 'estimate' as const, docNumber: e.estimateNumber }))
    ].flatMap(item => (item.doc.activity || []).map(act => ({ 
      ...act, 
      doc: item.doc,
      docType: item.docType,
      docNumber: item.docNumber, 
      clientName: clients.find(c => c.id === item.doc.clientId)?.name 
    })));
    
    return activityItems.sort((a, b) => {
      const timeA = safeDate(a.timestamp).getTime();
      const timeB = safeDate(b.timestamp).getTime();
      return timeB - timeA;
    }).slice(0, 5);
  }, [invoices, estimates, clients]);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: businessSettings.currency }).format(amount);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">Overview</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-500 dark:text-slate-400 font-medium">Monitoring your business health.</p>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {(['7d', '30d', '90d', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    timeRange === range 
                    ? 'bg-white dark:bg-slate-700 text-brand shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowCreateDropdown(!showCreateDropdown)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand hover:scale-105 active:scale-95 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-black transition-all shadow-xl shadow-brand/20 group"
          >
            <Plus size={20} /> Create New <ChevronDown size={16} className={`transition-transform ${showCreateDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showCreateDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowCreateDropdown(false)}></div>
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-2 z-20 animate-in zoom-in-95 duration-200">
                <button 
                  onClick={() => { onNewAction('invoice'); setShowCreateDropdown(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center"><FileText size={18}/></div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">New Invoice</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Bill your clients</p>
                  </div>
                </button>
                <button 
                  onClick={() => { onNewAction('estimate'); setShowCreateDropdown(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center"><FileCheck size={18}/></div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">New Estimate</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Send a proposal</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} />
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-brand/10 text-brand rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"><TrendingUp size={20}/></div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Revenue</p>
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={10} /> {stats.growth}%
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(stats.invTotal)}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"><CheckCircle size={20}/></div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Approved</p>
          <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(stats.estTotal)}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"><FileCheck size={20}/></div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Estimates</p>
          <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.activeEst} Pending</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"><AlertCircle size={20}/></div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Overdue</p>
          <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(stats.overdue)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Revenue Trends</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500">
              <div className="w-2 h-2 rounded-full bg-brand"></div>
              <span>Gross Revenue</span>
            </div>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc'
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--brand-primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter mb-8">Status Distribution</h3>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', opacity: 0.1 }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc'
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.name === 'Paid' ? '#10b981' : 
                        entry.name === 'Overdue' ? '#f43f5e' : 
                        entry.name === 'Sent' ? 'var(--brand-primary)' : 
                        '#94a3b8'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter mb-6 md:mb-8">Pulse Activity</h3>
          <div className="space-y-4 md:space-y-6">
            {recentActivity.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium italic">No recent activity.</div>
            ) : recentActivity.map((act, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 md:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[20px] md:rounded-3xl group hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border ${
                    act.action === 'Viewed' ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600' :
                    act.action === 'Sent' ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600' :
                    act.action === 'Signed' || act.action === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600' :
                    'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                  }`}>
                    {act.action === 'Viewed' ? <Eye size={18} /> : 
                     act.action === 'Sent' ? <FileText size={18} /> : 
                     act.action === 'Signed' || act.action === 'Approved' ? <CheckCircle size={18} /> :
                     <Clock size={18} />}
                  </div>
                  <div className="truncate">
                    <p className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base truncate">{act.clientName || 'General System'}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{act.action} #{act.docNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                   <div className="text-right mr-2 hidden md:block">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{formatSafeTime(act.timestamp)}</p>
                   </div>
                   <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onPreview(act.docType, act.doc)} className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-brand hover:bg-brand/5 rounded-lg transition-all"><Eye size={14} /></button>
                      <button onClick={() => onEdit(act.docType, act.doc.id)} className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-brand hover:bg-brand/5 rounded-lg transition-all"><Edit2 size={14} /></button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-900 dark:bg-slate-900 p-8 md:p-10 rounded-[32px] md:rounded-[40px] text-white flex flex-col justify-between shadow-2xl shadow-slate-200 dark:shadow-none border border-transparent dark:border-slate-800">
           <div>
             <div className="w-14 h-14 md:w-16 md:h-16 bg-white/10 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-8">
               <Sparkles className="text-brand" size={28} />
             </div>
             <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-4">AI Insights</h3>
             <p className="text-slate-400 text-sm leading-relaxed mb-8">You have {stats.activeEst} pending estimates. Converting these could secure {formatCurrency(stats.activeEst * 1200)} in new revenue.</p>
           </div>
           <button className="w-full bg-brand py-4 md:py-5 rounded-2xl md:rounded-3xl font-black text-base md:text-lg shadow-xl shadow-brand/20 transition-all hover:scale-105 active:scale-95">
             Full Analysis
           </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
