
import React, { useState } from 'react';
import { Search, UserPlus, Mail, Phone, MapPin, MoreVertical, Trash2, Edit2, X, FileText, FileCheck, History, Save, CreditCard } from 'lucide-react';
import { Client, Invoice, Estimate } from '../types';

interface ClientListProps {
  clients: Client[];
  invoices: Invoice[];
  estimates: Estimate[];
  currency: string;
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onViewPaid?: (client: Client) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, invoices, estimates, currency, onAddClient, onUpdateClient, onDeleteClient, onViewPaid }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '',
    street: '',
    city: '',
    state: '',
    zip: ''
  });
  const [viewingHistoryClient, setViewingHistoryClient] = useState<Client | null>(null);
  const [filterPaidOnly, setFilterPaidOnly] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      address: '',
      street: '',
      city: '',
      state: '',
      zip: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      address: client.address,
      street: client.street || '',
      city: client.city || '',
      state: client.state || '',
      zip: client.zip || ''
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      // Construct full address for backward compatibility
      const fullAddress = formData.street 
        ? `${formData.street}${formData.city ? `, ${formData.city}` : ''}${formData.state ? `, ${formData.state}` : ''}${formData.zip ? ` ${formData.zip}` : ''}`
        : formData.address;

      const clientData = {
        ...formData,
        address: fullAddress
      };

      if (editingClient) {
        onUpdateClient({
          ...editingClient,
          ...clientData
        });
      } else {
        onAddClient({
          id: Math.random().toString(36).substr(2, 9),
          ...clientData
        });
      }
      setIsFormOpen(false);
      setEditingClient(null);
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        address: '',
        street: '',
        city: '',
        state: '',
        zip: ''
      });
    }
  };

  const clientInvoices = viewingHistoryClient 
    ? invoices.filter(inv => inv.clientId === viewingHistoryClient.id && (!filterPaidOnly || inv.status === 'Paid'))
    : [];
  
  const clientEstimates = viewingHistoryClient && !filterPaidOnly
    ? estimates.filter(est => est.clientId === viewingHistoryClient.id)
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Clients</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your customer relationships and contact details.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-brand/10 transition-all hover:scale-105 active:scale-95"
        >
          <UserPlus size={20} />
          Add Client
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <Search size={20} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          className="bg-transparent border-none outline-none text-sm w-full dark:text-slate-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isFormOpen && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-dashed border-blue-200 dark:border-slate-700 flex flex-col items-center justify-center min-h-[400px] animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{editingClient ? 'Edit Client' : 'New Client Details'}</h3>
            <form onSubmit={handleSubmit} className="w-full space-y-3">
              <input 
                type="text" placeholder="Full Name" required 
                className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="email" placeholder="Email Address" required 
                  className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                />
                <input 
                  type="tel" placeholder="Phone (Optional)" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Address Details</label>
                <input 
                  type="text" placeholder="Street Address" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
                  value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})}
                />
                <div className="grid grid-cols-3 gap-3">
                  <input 
                    type="text" placeholder="City" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
                    value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                  />
                  <input 
                    type="text" placeholder="State" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
                    value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}
                  />
                  <input 
                    type="text" placeholder="ZIP" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
                    value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  type="button" onClick={() => { setIsFormOpen(false); setEditingClient(null); }}
                  className="flex-1 py-2.5 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 font-bold bg-brand text-white rounded-xl shadow-lg shadow-brand/10 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                  {editingClient ? <><Save size={18}/> Update</> : <><UserPlus size={18}/> Create</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {filteredClients.length === 0 && !isFormOpen ? (
          <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <UserPlus size={64} className="opacity-10 mb-4" />
            <p className="text-lg">No clients found</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative flex flex-col h-full">
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenEdit(client)}
                  className="p-2 text-slate-300 dark:text-slate-500 hover:text-brand hover:bg-brand/5 rounded-lg transition-all"
                  title="Edit Client"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => onDeleteClient(client.id)}
                  className="p-2 text-slate-300 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                  title="Delete Client"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="w-16 h-16 rounded-[24px] bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center text-2xl font-black mb-6 border border-slate-100 dark:border-slate-700 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                {client.name.charAt(0)}
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{client.name}</h3>
              
              <div className="mt-6 space-y-4 flex-1">
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <Mail size={16} className="text-brand" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <Phone size={16} className="text-emerald-500" />
                    <span>{client.phone}</span>
                  </div>
                )}
                <div className="flex items-start gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    {client.street ? (
                      <>
                        <span>{client.street}</span>
                        <span>{client.city}{client.city && client.state ? ', ' : ''}{client.state} {client.zip}</span>
                      </>
                    ) : (
                      <span className="line-clamp-2">{client.address}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                   <button 
                    onClick={() => { setViewingHistoryClient(client); setFilterPaidOnly(false); }}
                    className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <History size={12} /> History
                  </button>
                  <button 
                    onClick={() => { setViewingHistoryClient(client); setFilterPaidOnly(true); }}
                    className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center gap-1.5"
                  >
                    <CreditCard size={12} /> Payments
                  </button>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* History Modal */}
      {viewingHistoryClient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[24px] bg-brand text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-brand/20">
                  {viewingHistoryClient.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">
                    {filterPaidOnly ? 'Payment History' : 'Full History'}: {viewingHistoryClient.name}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {filterPaidOnly ? 'Review all successfully paid invoices and deposits.' : 'Review all past transactions and proposals.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewingHistoryClient(null)}
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2">
              <section>
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                    {filterPaidOnly ? <CreditCard className="text-emerald-600 dark:text-emerald-400" size={20} /> : <FileText className="text-brand" size={20} />}
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                      {filterPaidOnly ? 'Paid Invoices' : 'Past Invoices'}
                    </h4>
                  </div>
                  <button onClick={() => setFilterPaidOnly(!filterPaidOnly)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-brand transition-colors underline">
                    {filterPaidOnly ? 'Show All Invoices' : 'Filter Paid Only'}
                  </button>
                </div>
                {clientInvoices.length === 0 ? (
                  <div className="p-12 bg-slate-50 dark:bg-slate-800 rounded-[32px] text-slate-400 dark:text-slate-500 text-center font-medium italic border border-slate-100 dark:border-slate-700">
                    No matching invoices found for this client.
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <tr>
                          <th className="px-8 py-5">Invoice #</th>
                          <th className="px-8 py-5">Date</th>
                          <th className="px-8 py-5 text-right">Amount</th>
                          <th className="px-8 py-5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {clientInvoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-8 py-5 font-bold text-slate-800 dark:text-slate-100">#{inv.invoiceNumber}</td>
                            <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400 font-medium">{new Date(inv.date).toLocaleDateString()}</td>
                            <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-slate-100">{formatCurrency(inv.total)}</td>
                            <td className="px-8 py-5 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${
                                inv.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800' : 
                                inv.status === 'Overdue' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800' : 
                                'bg-brand/5 dark:bg-brand/10 text-brand border-brand/10 dark:border-brand/20'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {!filterPaidOnly && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <FileCheck className="text-emerald-600 dark:text-emerald-400" size={20} />
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Estimates & Proposals</h4>
                  </div>
                  {clientEstimates.length === 0 ? (
                    <div className="p-12 bg-slate-50 dark:bg-slate-800 rounded-[32px] text-slate-400 dark:text-slate-500 text-center font-medium italic border border-slate-100 dark:border-slate-700">
                      No estimates found for this client.
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          <tr>
                            <th className="px-8 py-5">Estimate #</th>
                            <th className="px-8 py-5">Date</th>
                            <th className="px-8 py-5 text-right">Amount</th>
                            <th className="px-8 py-5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {clientEstimates.map(est => (
                            <tr key={est.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-8 py-5 font-bold text-slate-800 dark:text-slate-100">#{est.estimateNumber}</td>
                              <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400 font-medium">{new Date(est.date).toLocaleDateString()}</td>
                              <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-slate-100">{formatCurrency(est.total)}</td>
                              <td className="px-8 py-5 text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${
                                  est.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800' : 
                                  est.status === 'Declined' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800' : 
                                  'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700'
                                }`}>
                                  {est.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setViewingHistoryClient(null)}
                className="px-8 py-4 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none transition-all hover:scale-105 active:scale-95"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;
