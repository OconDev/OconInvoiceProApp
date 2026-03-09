import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MoreVertical, 
  Download, 
  Trash2,
  LayoutDashboard,
  Users,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Invoice, DashboardStats, Client, InvoiceItem } from './types';

// --- Components ---

const StatusBadge = ({ status }: { status: Invoice['status'] }) => {
  const styles = {
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    sent: 'bg-blue-50 text-blue-600 border-blue-100',
    paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    overdue: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="glass-card p-6 rounded-2xl">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      </div>
      <div className={`p-2 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    {trend && (
      <div className="flex items-center mt-4 text-xs">
        <span className={`flex items-center ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {Math.abs(trend)}%
        </span>
        <span className="text-slate-400 ml-2">vs last month</span>
      </div>
    )}
  </div>
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'dashboard' | 'invoices' | 'clients'>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    client_id: '',
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_rate: 0,
    discount: 0,
    notes: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }] as InvoiceItem[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [invRes, statsRes, clientsRes] = await Promise.all([
      fetch('/api/invoices'),
      fetch('/api/stats'),
      fetch('/api/clients')
    ]);
    setInvoices(await invRes.json());
    setStats(await statsRes.json());
    setClients(await clientsRes.json());
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setIsModalOpen(false);
      fetchData();
      setFormData({
        client_id: '',
        invoice_number: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        due_date: '',
        tax_rate: 0,
        discount: 0,
        notes: '',
        items: [{ description: '', quantity: 1, unit_price: 0 }]
      });
    }
  };

  const deleteInvoice = async (id: number) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/invoices/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const calculateSubtotal = (items: InvoiceItem[]) => 
    items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const calculateTotal = (items: InvoiceItem[], tax: number, discount: number) => {
    const subtotal = calculateSubtotal(items);
    const taxAmount = subtotal * (tax / 100);
    return subtotal + taxAmount - discount;
  };

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const openPreview = async (id: number) => {
    const res = await fetch(`/api/invoices/${id}`);
    const data = await res.json();
    setPreviewInvoice(data);
    setIsPreviewOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SwiftInvoice</h1>
        </div>

        <nav className="space-y-1 flex-1">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setView('invoices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${view === 'invoices' ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FileText className="w-5 h-5" />
            Invoices
          </button>
          <button 
            onClick={() => setView('clients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${view === 'clients' ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users className="w-5 h-5" />
            Clients
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors">
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search invoices, clients..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {view === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Invoices" 
                  value={stats?.count || 0} 
                  icon={FileText} 
                  trend={12}
                  color="bg-brand-50 text-brand-600"
                />
                <StatCard 
                  title="Total Paid" 
                  value={`$${(stats?.paid || 0).toLocaleString()}`} 
                  icon={CheckCircle2} 
                  trend={8}
                  color="bg-emerald-50 text-emerald-600"
                />
                <StatCard 
                  title="Pending Amount" 
                  value={`$${(stats?.pending || 0).toLocaleString()}`} 
                  icon={Clock} 
                  trend={-5}
                  color="bg-amber-50 text-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg">Recent Invoices</h3>
                    <button onClick={() => setView('invoices')} className="text-sm text-brand-600 font-medium hover:underline">View all</button>
                  </div>
                  <div className="space-y-4">
                    {invoices.slice(0, 5).map(invoice => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{invoice.client_name || 'No Client'}</p>
                            <p className="text-xs text-slate-400">{invoice.invoice_number} • {invoice.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">${(invoice.tax_rate > 0 ? 0 : 0).toLocaleString()}</p>
                          <StatusBadge status={invoice.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg">Revenue Overview</h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-500"></span> Paid</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending</span>
                    </div>
                  </div>
                  <div className="h-64 flex items-end gap-4 px-4">
                    {[40, 70, 45, 90, 65, 85, 55].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col gap-1 group relative">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          ${h * 100}
                        </div>
                        <div 
                          className="w-full bg-brand-100 rounded-t-lg group-hover:bg-brand-200 transition-colors" 
                          style={{ height: `${h}%` }}
                        >
                          <div className="w-full bg-brand-500 rounded-t-lg" style={{ height: '60%' }}></div>
                        </div>
                        <span className="text-[10px] text-slate-400 text-center mt-2">M{i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'invoices' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-brand-600">{invoice.invoice_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold">{invoice.client_name || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-500">{invoice.date}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold">${((invoice as any).total || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openPreview(invoice.id)}
                            className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Preview"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => updateStatus(invoice.id, 'paid')}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Mark as Paid"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteInvoice(invoice.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoices.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-900">No invoices yet</h4>
                  <p className="text-slate-500 text-sm mt-1">Create your first invoice to get started.</p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="mt-6 text-brand-600 font-semibold text-sm hover:underline"
                  >
                    + Create Invoice
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {view === 'clients' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {clients.map(client => (
                <div key={client.id} className="glass-card p-6 rounded-2xl group relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{client.name}</h4>
                      <p className="text-xs text-slate-500">{client.email}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{client.address}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-xs font-medium text-slate-400">3 Active Invoices</span>
                    <button className="text-xs font-bold text-brand-600 hover:underline">View Details</button>
                  </div>
                  <button 
                    onClick={async () => {
                      if(confirm('Delete client?')) {
                        await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
                        fetchData();
                      }
                    }}
                    className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button 
                onClick={async () => {
                  const name = prompt('Client Name:');
                  if(!name) return;
                  const email = prompt('Client Email:');
                  const address = prompt('Client Address:');
                  await fetch('/api/clients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, address })
                  });
                  fetchData();
                }}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-brand-300 hover:text-brand-500 transition-all group"
              >
                <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-sm">Add New Client</span>
              </button>
            </motion.div>
          )}
        </div>
      </main>

      {/* New Invoice Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold">Create New Invoice</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Client</label>
                      <select 
                        required
                        value={formData.client_id}
                        onChange={e => setFormData({...formData, client_id: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      >
                        <option value="">Select a client</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      {clients.length === 0 && (
                        <p className="text-[10px] text-rose-500 mt-1">No clients found. Please add a client first.</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Invoice #</label>
                        <input 
                          type="text" 
                          value={formData.invoice_number}
                          onChange={e => setFormData({...formData, invoice_number: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date</label>
                        <input 
                          type="date" 
                          value={formData.date}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Due Date</label>
                      <input 
                        type="date" 
                        value={formData.due_date}
                        onChange={e => setFormData({...formData, due_date: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Notes</label>
                      <textarea 
                        rows={3}
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                        placeholder="Additional information..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Line Items</h3>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, items: [...formData.items, { description: '', quantity: 1, unit_price: 0 }]})}
                      className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-start animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1">
                          <input 
                            placeholder="Description"
                            value={item.description}
                            onChange={e => {
                              const newItems = [...formData.items];
                              newItems[idx].description = e.target.value;
                              setFormData({...formData, items: newItems});
                            }}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                          />
                        </div>
                        <div className="w-24">
                          <input 
                            type="number" 
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={e => {
                              const newItems = [...formData.items];
                              newItems[idx].quantity = parseFloat(e.target.value) || 0;
                              setFormData({...formData, items: newItems});
                            }}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                          />
                        </div>
                        <div className="w-32">
                          <input 
                            type="number" 
                            placeholder="Price"
                            value={item.unit_price}
                            onChange={e => {
                              const newItems = [...formData.items];
                              newItems[idx].unit_price = parseFloat(e.target.value) || 0;
                              setFormData({...formData, items: newItems});
                            }}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                          />
                        </div>
                        <div className="w-32 py-2.5 text-right font-bold text-slate-600">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            const newItems = formData.items.filter((_, i) => i !== idx);
                            setFormData({...formData, items: newItems});
                          }}
                          className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 flex justify-end">
                  <div className="w-64 space-y-3">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Subtotal</span>
                      <span>${calculateSubtotal(formData.items).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm text-slate-500">Tax (%)</span>
                      <input 
                        type="number" 
                        value={formData.tax_rate}
                        onChange={e => setFormData({...formData, tax_rate: parseFloat(e.target.value) || 0})}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right text-sm"
                      />
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm text-slate-500">Discount ($)</span>
                      <input 
                        type="number" 
                        value={formData.discount}
                        onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right text-sm"
                      />
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between font-bold text-lg text-slate-900">
                      <span>Total</span>
                      <span>${calculateTotal(formData.items, formData.tax_rate, formData.discount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </form>

              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateInvoice}
                  className="px-8 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                >
                  Create Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && previewInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                <h2 className="font-bold">Invoice Preview</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4" /> Print / PDF
                  </button>
                  <button 
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <Plus className="w-6 h-6 rotate-45 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0">
                <div id="printable-invoice" className="max-w-2xl mx-auto">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white mb-4">
                        <FileText className="w-7 h-7" />
                      </div>
                      <h1 className="text-2xl font-bold text-slate-900">SwiftInvoice</h1>
                      <p className="text-sm text-slate-500">123 Business Ave, Suite 100<br/>San Francisco, CA 94107</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-4xl font-black text-slate-200 uppercase tracking-tighter mb-4">Invoice</h2>
                      <p className="text-sm font-bold text-slate-900">#{previewInvoice.invoice_number}</p>
                      <p className="text-sm text-slate-500">Date: {previewInvoice.date}</p>
                      {previewInvoice.due_date && <p className="text-sm text-slate-500">Due: {previewInvoice.due_date}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</p>
                      <p className="font-bold text-slate-900">{previewInvoice.client_name}</p>
                      <p className="text-sm text-slate-500 whitespace-pre-line">{previewInvoice.client_address}</p>
                      <p className="text-sm text-slate-500 mt-1">{previewInvoice.client_email}</p>
                    </div>
                  </div>

                  <table className="w-full mb-12">
                    <thead>
                      <tr className="border-b-2 border-slate-900">
                        <th className="py-3 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Description</th>
                        <th className="py-3 text-center text-xs font-bold text-slate-900 uppercase tracking-wider w-20">Qty</th>
                        <th className="py-3 text-right text-xs font-bold text-slate-900 uppercase tracking-wider w-32">Price</th>
                        <th className="py-3 text-right text-xs font-bold text-slate-900 uppercase tracking-wider w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewInvoice.items.map((item, i) => (
                        <tr key={i}>
                          <td className="py-4 text-sm text-slate-700">{item.description}</td>
                          <td className="py-4 text-center text-sm text-slate-700">{item.quantity}</td>
                          <td className="py-4 text-right text-sm text-slate-700">${item.unit_price.toFixed(2)}</td>
                          <td className="py-4 text-right text-sm font-bold text-slate-900">${(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end">
                    <div className="w-64 space-y-3">
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span>${calculateSubtotal(previewInvoice.items).toFixed(2)}</span>
                      </div>
                      {previewInvoice.tax_rate > 0 && (
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>Tax ({previewInvoice.tax_rate}%)</span>
                          <span>${(calculateSubtotal(previewInvoice.items) * (previewInvoice.tax_rate / 100)).toFixed(2)}</span>
                        </div>
                      )}
                      {previewInvoice.discount > 0 && (
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>Discount</span>
                          <span>-${previewInvoice.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="pt-3 border-t-2 border-slate-900 flex justify-between font-bold text-xl text-slate-900">
                        <span>Total</span>
                        <span>${calculateTotal(previewInvoice.items, previewInvoice.tax_rate, previewInvoice.discount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {previewInvoice.notes && (
                    <div className="mt-12 pt-8 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</p>
                      <p className="text-sm text-slate-500 italic">{previewInvoice.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
