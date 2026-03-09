
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, Sparkles, Save, UserPlus, Calendar, DollarSign, Loader2, Package, X, FolderOpen, PenTool, Layout, Calculator, Copy, Eye, ChevronDown, FileText } from 'lucide-react';
import { Estimate, Client, InvoiceItem, EstimateStatus, BusinessSettings, LibraryItem, EstimateGroup, DocumentTemplate } from '../types';
import { generateProfessionalDescription, generateSalesPitch } from '../services/gemini';
import SignaturePad from './SignaturePad';

interface EstimateFormProps {
  initialEstimate?: Estimate;
  clients: Client[];
  library: LibraryItem[];
  groups: EstimateGroup[];
  businessSettings: BusinessSettings;
  onSave: (est: Estimate) => void;
  onCancel: () => void;
  onPreview: (est: Estimate) => void;
  onAddClient: (client: Client) => void;
}

const EstimateForm: React.FC<EstimateFormProps> = ({ initialEstimate, clients, library, groups, onSave, onCancel, onPreview, onAddClient, businessSettings }) => {
  const isEditing = !!initialEstimate?.id;

  const [title, setTitle] = useState(initialEstimate?.title || 'Estimate');
  const [estimateNumber, setEstimateNumber] = useState(initialEstimate?.estimateNumber || `EST-${Math.floor(1000 + Math.random() * 9000)}`);
  const [date, setDate] = useState(initialEstimate?.date || new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(initialEstimate?.expiryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [selectedClientId, setSelectedClientId] = useState(initialEstimate?.clientId || '');
  const [groupId, setGroupId] = useState(initialEstimate?.groupId || (groups.length > 0 ? groups[0].id : ''));
  const [items, setItems] = useState<InvoiceItem[]>(initialEstimate?.items || [{ id: '1', title: '', description: '', quantity: 1, rate: 0, unit: businessSettings.defaultUnit || '' }]);
  const [notes, setNotes] = useState(initialEstimate?.notes || (isEditing ? '' : (businessSettings.defaultNotesEstimate || '')));
  const [discount, setDiscount] = useState(initialEstimate?.discount || 0);
  const [template, setTemplate] = useState<DocumentTemplate>(initialEstimate?.template || 'classic');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  
  const [signatureMe, setSignatureMe] = useState(initialEstimate?.signatureMe || (isEditing ? '' : businessSettings.defaultSignature || ''));
  const [signatureClient, setSignatureClient] = useState(initialEstimate?.signatureClient || '');

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

    return { subtotal, taxAmount, total: finalTotal };
  }, [items, discount, businessSettings.taxRate, businessSettings.discountAfterTax]);

  const getCurrentDoc = (): Estimate => ({
    id: initialEstimate?.id || Math.random().toString(36).substr(2, 9),
    title,
    estimateNumber, date, expiryDate, clientId: selectedClientId, groupId,
    items, status: initialEstimate?.status || EstimateStatus.DRAFT,
    notes, discount, tax: businessSettings.taxRate, total: totals.total, template,
    activity: initialEstimate?.activity || [], publicUrl: initialEstimate?.publicUrl || '',
    signatureMe, signatureClient
  });

  const handlePitch = async () => {
    setIsGeneratingPitch(true);
    const pitch = await generateSalesPitch(items, businessSettings.name);
    setNotes(prev => pitch + "\n\n" + prev);
    setIsGeneratingPitch(false);
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

  const handleSave = () => {
    if (!selectedClientId) return alert("Please select a client before saving.");
    onSave(getCurrentDoc());
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-in slide-in-from-right-10 duration-500">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6 px-1">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-3 text-slate-500 hover:bg-white rounded-2xl transition-all shadow-sm border border-slate-100">
            <ArrowLeft size={24} />
          </button>
          <div>
            <input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter bg-transparent border-none outline-none focus:ring-2 ring-brand/10 rounded-xl px-2 -ml-2 w-full max-w-xs"
              placeholder="Document Title"
            />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] ml-1">{estimateNumber}</p>
          </div>
        </div>
        <div className="hidden md:flex gap-3">
          <button 
            onClick={() => onPreview(getCurrentDoc())}
            className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
          >
            <FileText size={20} /> Visual Editor (Word Mode)
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-brand text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-brand/20 transition-all hover:scale-105 active:scale-95"
          >
            <Save size={20} /> Save Proposal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8">
        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Workspace</label>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:ring-2 ring-brand/10 transition-all">
             <FolderOpen size={18} className="text-brand"/>
             <select value={groupId} onChange={e => setGroupId(e.target.value)} className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700 appearance-none">
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
             </select>
             <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Client</label>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:ring-2 ring-brand/10 transition-all">
            <UserPlus size={18} className="text-brand"/>
            <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full bg-transparent border-none outline-none font-bold text-slate-700 appearance-none text-sm">
              <option value="">Select a client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Expiry Date</label>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:ring-2 ring-brand/10 transition-all">
            <Calendar size={18} className="text-brand"/>
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full bg-transparent border-none outline-none font-bold text-slate-700 text-sm" />
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm mb-8">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight mb-6"><Layout size={18} className="text-brand"/> Template Design</h3>
        <div className="grid grid-cols-3 gap-3">
          {['classic', 'modern', 'minimal'].map((t) => (
            <button
              key={t}
              onClick={() => setTemplate(t as DocumentTemplate)}
              className={`py-3.5 md:py-4 rounded-2xl border-2 transition-all text-center ${template === t ? 'border-brand bg-blue-50 text-brand' : 'border-slate-100 text-slate-400 hover:border-slate-200 bg-slate-50/30'}`}
            >
              <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">{t}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Line Items */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h3 className="font-bold tracking-tight text-lg">Project Scope</h3>
          <div className="flex gap-2 w-full sm:w-auto">
             <button 
              onClick={() => setIsLibraryOpen(true)}
              className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-2xl text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-sm"
            >
              <Package size={16}/> Library
            </button>
            <button 
              onClick={() => setItems([...items, {id: Date.now().toString(), title: '', description: '', quantity: 1, rate: 0, unit: businessSettings.defaultUnit || ''}])} 
              className="flex-1 sm:flex-none bg-brand text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand/10 transition-all"
            >
              <Plus size={16}/> Add Line
            </button>
          </div>
        </div>
        
        <div className="space-y-6 md:space-y-4">
          {items.map((item, idx) => (
            <div key={item.id} className="relative group bg-slate-50/50 md:bg-transparent p-4 md:p-6 rounded-[32px] border border-slate-100 md:border-slate-50 mb-4">
              <div className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-12 md:col-span-6 space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Item Details</label>
                  <input 
                    value={item.title} 
                    onChange={e => setItems(items.map(i => i.id === item.id ? {...i, title: e.target.value} : i))} 
                    className="w-full bg-white md:bg-slate-50 border border-slate-200 md:border-none rounded-xl md:rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-brand/10 transition-all text-sm font-bold shadow-sm md:shadow-none" 
                    placeholder="Item Title (e.g. Consultation)" 
                  />
                  <textarea 
                    value={item.description} 
                    onChange={e => setItems(items.map(i => i.id === item.id ? {...i, description: e.target.value} : i))} 
                    className="w-full bg-white md:bg-slate-50 border border-slate-200 md:border-none rounded-xl md:rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-brand/10 transition-all text-sm font-medium shadow-sm md:shadow-none h-20 resize-none" 
                    placeholder="Detailed description..." 
                  />
                </div>
                
                <div className="col-span-4 md:col-span-1 pt-6">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center block mb-2">Qty</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={item.quantity} 
                    onFocus={e => e.target.select()}
                    onChange={e => setItems(items.map(i => i.id === item.id ? {...i, quantity: +e.target.value} : i))} 
                    className="w-full bg-white md:bg-slate-50 border border-slate-200 md:border-none rounded-xl md:rounded-2xl px-2 py-3 outline-none text-center font-black text-sm shadow-sm md:shadow-none" 
                  />
                </div>
                
                <div className="col-span-5 md:col-span-2 pt-6">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right block mb-2">Rate ({businessSettings.currency})</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={item.rate} 
                    onFocus={e => e.target.select()}
                    onChange={e => setItems(items.map(i => i.id === item.id ? {...i, rate: +e.target.value} : i))} 
                    className={`w-full bg-white md:bg-slate-50 border border-slate-200 md:border-none rounded-xl md:rounded-2xl px-3 py-3 outline-none text-right font-black text-sm shadow-sm md:shadow-none ${item.rate < 0 ? 'text-rose-600' : 'text-slate-800'}`} 
                    placeholder="0.00" 
                  />
                </div>
                
                <div className="col-span-3 md:col-span-2 pt-6">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center block mb-2">Unit</label>
                  <input 
                    type="text" 
                    placeholder="Unit" 
                    value={item.unit} 
                    onChange={e => setItems(items.map(i => i.id === item.id ? {...i, unit: e.target.value} : i))} 
                    className="w-full bg-white md:bg-slate-50 border border-slate-200 md:border-none rounded-xl md:rounded-2xl px-2 py-3 outline-none text-center font-bold text-sm shadow-sm md:shadow-none text-slate-500" 
                  />
                </div>
                
                <div className="col-span-12 md:col-span-1 flex md:flex-col items-center justify-end md:justify-center gap-4 md:gap-2 pt-2 md:pt-6">
                  <button onClick={() => handleDuplicateItem(item)} className="text-slate-300 hover:text-brand transition-colors p-2 md:p-1" title="Duplicate"><Copy size={18}/></button>
                  <button onClick={() => setItems(items.length > 1 ? items.filter(i => i.id !== item.id) : items)} className="text-slate-300 hover:text-rose-500 transition-colors p-2 md:p-1" title="Remove"><Trash2 size={18}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6">
          {/* Notes & AI Note */}
          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Message / Proposal Notes</label>
              <button 
                onClick={handlePitch} 
                disabled={isGeneratingPitch} 
                className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1.5 hover:text-brand transition-all disabled:opacity-50"
              >
                {isGeneratingPitch ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>} AI Magic
              </button>
            </div>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              className="w-full h-40 bg-slate-50 border border-slate-200 rounded-3xl p-5 outline-none focus:ring-2 focus:ring-brand/10 shadow-sm resize-none text-sm font-medium leading-relaxed" 
              placeholder="Enter special terms or a personal note to the client..." 
            />
          </div>

          {/* Signatures */}
          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
              <h3 className="font-bold tracking-tight flex items-center gap-2 px-1"><PenTool size={18} className="text-brand"/> Approval Signatures</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <SignaturePad 
                  label="Our Authorized Signatory" 
                  initialValue={signatureMe} 
                  onSave={setSignatureMe} 
                  onClear={() => setSignatureMe('')}
                />
                <SignaturePad 
                  label="Client Approval Pad" 
                  initialValue={signatureClient} 
                  onSave={setSignatureClient} 
                  onClear={() => setSignatureClient('')}
                />
              </div>
          </div>
        </div>

        {/* Financial Summary - Floating on Mobile */}
        <div className="bg-slate-900 p-8 md:p-10 rounded-[40px] text-white flex flex-col justify-between shadow-2xl shadow-slate-200">
          <div className="space-y-8">
            <h3 className="text-xl font-black flex items-center gap-2 tracking-tighter"><Calculator size={22} className="text-brand"/> Financial Overview</h3>
            <div className="space-y-5 text-slate-400 text-sm font-medium">
              <div className="flex justify-between items-center">
                <span>Total Items Value</span>
                <span className="text-white font-black text-base">{totals.subtotal.toLocaleString('en-US', {style:'currency', currency: businessSettings.currency})}</span>
              </div>
              
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Add Discount</span>
                  <span className="text-xs">Flat amount deduction</span>
                </div>
                <input 
                  type="number" 
                  step="any" 
                  value={discount} 
                  onFocus={e => e.target.select()}
                  onChange={e => setDiscount(+e.target.value)} 
                  className="w-24 bg-slate-800 border-none rounded-xl p-2.5 text-right text-white focus:ring-2 ring-brand font-black text-sm" 
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span>Sales Tax Applied</span>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-600">Fixed at {businessSettings.taxRate}%</span>
                </div>
                <span className="text-white font-black text-base">{totals.taxAmount.toLocaleString('en-US', {style:'currency', currency: businessSettings.currency})}</span>
              </div>
            </div>

            <div className="h-px bg-white/10 my-8"></div>
            
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Proposal Value</p>
              <p className="text-4xl font-black text-brand tracking-tighter">
                {totals.total.toLocaleString('en-US', {style:'currency', currency: businessSettings.currency})}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleSave} 
            className="hidden md:flex w-full bg-brand hover:scale-[1.02] py-5 rounded-3xl font-black text-xl items-center justify-center gap-3 transition-all shadow-xl shadow-brand/20 mt-12"
          >
            <Save size={24}/> Save Proposal
          </button>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed md:hidden bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex gap-3 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => onPreview(getCurrentDoc())}
          className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
        >
          <FileText size={18} /> Visual Editor
        </button>
        <button 
          onClick={handleSave}
          className="flex-[2] bg-brand text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
        >
          <Save size={18} /> Save & Close
        </button>
      </div>

      {/* Item Library Modal */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Select from Library</h3>
                <p className="text-slate-400 text-sm font-medium">Quickly add saved products & services</p>
              </div>
              <button onClick={() => setIsLibraryOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400"><X size={24}/></button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto space-y-4">
              {library.length === 0 ? (
                <div className="text-center py-20 text-slate-300 font-medium italic">
                  Your product library is currently empty.<br/>Add items in the Library tab.
                </div>
              ) : (
                library.map(lib => (
                  <button 
                    key={lib.id} 
                    onClick={() => addFromLibrary(lib)}
                    className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-blue-50 hover:border-brand/20 border border-transparent rounded-[24px] transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-brand transition-colors">
                        <Package size={24} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{lib.name}</p>
                        <p className="text-xs text-slate-400 line-clamp-1 font-medium">{lib.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-brand text-lg">{lib.defaultRate.toLocaleString('en-US', {style:'currency', currency: businessSettings.currency})}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">per {lib.unit || 'unit'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Selected items will be appended to your list</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstimateForm;
