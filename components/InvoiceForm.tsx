
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, Sparkles, Save, UserPlus, Loader2, Search, BrainCircuit, Wand2, Package, X, FolderOpen, PenTool, Layout, Calculator, Copy, Eye, FileText } from 'lucide-react';
import { Invoice, Client, InvoiceItem, InvoiceStatus, BusinessSettings, LibraryItem, InvoiceGroup, DocumentTemplate } from '../types';
import { generateProfessionalDescription, brainstormProjectItems } from '../services/gemini';
import SignaturePad from './SignaturePad';

interface InvoiceFormProps {
  initialInvoice?: Invoice;
  clients: Client[];
  library: LibraryItem[];
  groups: InvoiceGroup[];
  businessSettings: BusinessSettings;
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
  onPreview: (invoice: Invoice) => void;
  onAddClient: (client: Client) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialInvoice, clients, library, groups, onSave, onCancel, onPreview, onAddClient, businessSettings }) => {
  const isEditing = !!initialInvoice?.id;
  
  const [title, setTitle] = useState(initialInvoice?.title || 'Invoice');
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoice?.invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [issueDate, setIssueDate] = useState(initialInvoice?.date || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(initialInvoice?.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [selectedClientId, setSelectedClientId] = useState(initialInvoice?.clientId || '');
  const [groupId, setGroupId] = useState(initialInvoice?.groupId || (groups.length > 0 ? groups[0].id : ''));
  const [items, setItems] = useState<InvoiceItem[]>(initialInvoice?.items || [{ id: '1', title: '', description: '', quantity: 1, rate: 0, unit: businessSettings.defaultUnit || '' }]);
  const [notes, setNotes] = useState(initialInvoice?.notes || (isEditing ? '' : (businessSettings.defaultNotesInvoice || '')));
  const [discount, setDiscount] = useState(initialInvoice?.discount || 0);
  const [template, setTemplate] = useState<DocumentTemplate>(initialInvoice?.template || 'classic');
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [brainstormText, setBrainstormText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  
  const [signatureMe, setSignatureMe] = useState(initialInvoice?.signatureMe || (isEditing ? '' : businessSettings.defaultSignature || ''));
  const [signatureClient, setSignatureClient] = useState(initialInvoice?.signatureClient || '');

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    let taxAmount = 0;
    let finalTotal = 0;

    if (businessSettings.discountAfterTax) {
      taxAmount = subtotal * (businessSettings.taxRate / 100);
      finalTotal = subtotal + taxAmount - discount;
    } else {
      const taxableAmount = Math.max(0, subtotal - discount);
      taxAmount = taxableAmount * (businessSettings.taxRate / 100);
      finalTotal = taxableAmount + taxAmount;
    }

    const totalPaid = (initialInvoice?.payments || []).reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, finalTotal - totalPaid);

    return { subtotal, taxAmount, total: finalTotal, totalPaid, balanceDue };
  }, [items, discount, businessSettings.taxRate, businessSettings.discountAfterTax, initialInvoice?.payments]);

  const getCurrentDoc = (): Invoice => ({
    id: initialInvoice?.id || Date.now().toString(), 
    title, invoiceNumber, date: issueDate, dueDate, clientId: selectedClientId, groupId,
    items, status: initialInvoice?.status || InvoiceStatus.DRAFT, 
    notes, discount, tax: businessSettings.taxRate, total: totals.total, template,
    payments: initialInvoice?.payments || [], activity: initialInvoice?.activity || [], 
    publicUrl: initialInvoice?.publicUrl || '',
    signatureMe, signatureClient
  });

  const handleBrainstorm = async () => {
    if (!brainstormText) return;
    setIsBrainstorming(true);
    const suggested = await brainstormProjectItems(brainstormText);
    if (suggested.length > 0) {
      const mapped = suggested.map((s: any) => ({ 
        id: Math.random().toString(36).substr(2, 9), 
        title: s.title || s.description || 'New Item',
        description: s.description || '',
        quantity: s.quantity || 1,
        rate: s.rate || 0,
        unit: businessSettings.defaultUnit || '' 
      }));
      setItems(items[0].title === '' && items[0].description === '' ? mapped : [...items, ...mapped]);
    }
    setIsBrainstorming(false);
    setBrainstormText('');
  };

  const handleEnhance = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item?.description) return;
    setIsEnhancing(id);
    const polished = await generateProfessionalDescription(item.description);
    setItems(items.map(i => i.id === id ? { ...i, description: polished } : i));
    setIsEnhancing(null);
  };

  const handleDuplicateItem = (item: InvoiceItem) => {
    const newItem = { ...item, id: Date.now().toString() + Math.random() };
    setItems([...items, newItem]);
  };

  const addFromLibrary = (libItem: LibraryItem) => {
    const newItem: InvoiceItem = {
      id: Date.now().toString() + Math.random(),
      title: libItem.name,
      description: libItem.description,
      quantity: 1,
      rate: libItem.defaultRate,
      unit: libItem.unit
    };
    if (items.length === 1 && items[0].title === '' && items[0].description === '') {
      setItems([newItem]);
    } else {
      setItems([...items, newItem]);
    }
    setIsLibraryOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in slide-in-from-right-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 text-slate-500 hover:bg-white rounded-xl shadow-sm border border-slate-100"><ArrowLeft size={20} /></button>
          <div>
            <input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter bg-transparent border-none outline-none focus:ring-2 ring-brand/10 rounded-lg w-full max-w-xs"
              placeholder="Document Title"
            />
            <p className="text-slate-500 font-medium text-xs md:text-sm">Drafting {invoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => onPreview(getCurrentDoc())}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95 text-sm"
          >
            <FileText size={18} /> Visual Editor (Word Mode)
          </button>
          <button 
            onClick={() => onSave(getCurrentDoc())}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-brand/20 transition-all hover:scale-105 active:scale-95 text-sm"
          >
            <Save size={18} /> Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight"><Search size={18} className="text-brand"/> Project Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
               <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Workspace</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 md:px-5 py-3 md:py-4">
                   <FolderOpen size={16} className="text-brand"/>
                   <select value={groupId} onChange={e => setGroupId(e.target.value)} className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700">
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                   </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Recipient</label>
                <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 md:px-5 py-3 md:py-4 outline-none focus:ring-2 ring-brand/20 transition-all font-bold text-slate-700">
                  <option value="">Select a client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Issue Date</label>
                <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 md:px-5 py-3 md:py-4 outline-none font-bold text-slate-700" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 md:px-5 py-3 md:py-4 outline-none font-bold text-slate-700" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight mb-6"><Layout size={18} className="text-brand"/> Template Design</h3>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {['classic', 'modern', 'minimal'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t as DocumentTemplate)}
                  className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all text-center ${template === t ? 'border-brand bg-blue-50 text-brand' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">{t}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h3 className="font-bold text-slate-800 tracking-tight">Line Items</h3>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => setIsLibraryOpen(true)}
                  className="w-full sm:w-auto bg-slate-50 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  <Package size={14}/> Library
                </button>
                <button onClick={() => setItems([...items, {id: Date.now().toString(), title: '', description: '', quantity: 1, rate: 0, unit: businessSettings.defaultUnit || ''}])} className="w-full sm:w-auto bg-brand text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5"><Plus size={14}/> Add New</button>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">
              {items.map(item => (
                <div key={item.id} className="flex flex-col gap-4 p-4 md:p-0 bg-slate-50 md:bg-transparent rounded-2xl md:rounded-none group">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Details</label>
                      <div className="flex md:hidden gap-2">
                         <button onClick={() => handleDuplicateItem(item)} className="p-1.5 text-slate-400 bg-white rounded-lg border border-slate-100"><Copy size={12}/></button>
                         <button onClick={() => setItems(items.length > 1 ? items.filter(i => i.id !== item.id) : items)} className="p-1.5 text-rose-400 bg-white rounded-lg border border-slate-100"><Trash2 size={12}/></button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <input 
                        value={item.title} 
                        onChange={e => setItems(items.map(i => i.id === item.id ? {...i, title: e.target.value} : i))}
                        placeholder="Item Title (e.g. Logo Design)" 
                        className="w-full bg-white md:bg-slate-50 border md:border-none border-slate-100 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 outline-none focus:ring-2 ring-brand/10 transition-all font-bold text-sm"
                      />
                      <div className="relative">
                        <textarea 
                          value={item.description} 
                          onChange={e => setItems(items.map(i => i.id === item.id ? {...i, description: e.target.value} : i))}
                          placeholder="Detailed description of the service or product..." 
                          className="w-full bg-white md:bg-slate-50 border md:border-none border-slate-100 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 outline-none focus:ring-2 ring-brand/10 transition-all h-24 resize-none text-sm"
                        />
                        <div className="absolute right-3 top-3 hidden md:flex flex-col gap-2">
                          <button 
                            onClick={() => handleEnhance(item.id)} 
                            className="p-1.5 bg-white shadow-sm border border-slate-100 text-brand rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                          >
                            {isEnhancing === item.id ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center block mb-2">Qty</label>
                      <input 
                        type="number" 
                        step="any" 
                        value={item.quantity} 
                        onFocus={e => e.target.select()}
                        onChange={e => setItems(items.map(i => i.id === item.id ? {...i, quantity: +e.target.value} : i))} 
                        className="w-full bg-white md:bg-slate-50 border md:border-none border-slate-100 p-2.5 md:p-3 rounded-xl md:rounded-2xl outline-none text-center font-bold text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right block mb-2">Price/Rate</label>
                      <input 
                        type="number" 
                        step="any" 
                        value={item.rate} 
                        onFocus={e => e.target.select()}
                        onChange={e => setItems(items.map(i => i.id === item.id ? {...i, rate: +e.target.value} : i))} 
                        className="w-full bg-white md:bg-slate-50 border md:border-none border-slate-100 p-2.5 md:p-3 rounded-xl md:rounded-2xl outline-none text-right font-bold text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center block mb-2">Unit</label>
                      <input type="text" placeholder="hr, pc..." value={item.unit} onChange={e => setItems(items.map(i => i.id === item.id ? {...i, unit: e.target.value} : i))} className="w-full bg-white md:bg-slate-50 border md:border-none border-slate-100 p-2.5 md:p-3 rounded-xl md:rounded-2xl outline-none text-center font-bold text-sm" />
                    </div>
                  </div>
                  <div className="hidden md:flex justify-end gap-3 pt-2">
                    <button onClick={() => handleDuplicateItem(item)} className="text-slate-300 hover:text-brand transition-colors p-1" title="Duplicate"><Copy size={16}/></button>
                    <button onClick={() => setItems(items.length > 1 ? items.filter(i => i.id !== item.id) : items)} className="text-slate-300 hover:text-rose-500 transition-colors p-1" title="Remove"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-2xl shadow-blue-500/10 md:sticky md:top-24">
            <h3 className="text-lg font-bold mb-6 md:mb-8 flex items-center gap-2 tracking-tight"><Calculator size={20} className="text-brand"/> Financial Summary</h3>
            <div className="space-y-4 text-slate-400 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="text-white font-bold">{totals.subtotal.toLocaleString('en-US', {style:'currency', currency: businessSettings.currency})}</span></div>
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-xs">Discount</span>
                <input 
                  type="number" 
                  step="any" 
                  value={discount} 
                  onFocus={e => e.target.select()}
                  onChange={e => setDiscount(+e.target.value)} 
                  className="w-24 bg-slate-800 border-none rounded-lg p-1.5 text-right text-white focus:ring-1 ring-brand font-bold text-sm" 
                />
              </div>
              <div className="flex justify-between">
                <span>Tax ({businessSettings.taxRate}%)</span>
                <span className="text-white font-bold">{totals.taxAmount.toLocaleString('en-US', {style:'currency', currency: businessSettings.currency})}</span>
              </div>
            </div>

            <div className="h-px bg-white/10 my-6 md:my-8"></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total to Bill</p>
              <p className="text-3xl md:text-4xl font-black text-brand">{totals.total.toLocaleString('en-US', {style:'currency', currency: businessSettings.currency})}</p>
            </div>

            {totals.totalPaid > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-xs text-emerald-400 font-bold">
                  <span>Payments Received</span>
                  <span>-{totals.totalPaid.toLocaleString('en-US', {style:'currency', currency: businessSettings.currency})}</span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance Due</p>
                  <p className="text-2xl font-black text-white">{totals.balanceDue.toLocaleString('en-US', {style:'currency', currency: businessSettings.currency})}</p>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => onSave(getCurrentDoc())} 
              className="w-full bg-brand py-4 rounded-2xl font-black text-lg mt-8 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-brand/20"
            >
              Save Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
