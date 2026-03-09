
import React, { useState, useRef } from 'react';
import { 
  Save, Palette, Building, Mail, MapPin, CreditCard, 
  MessageSquare, FileText, Check, PenTool, Percent, 
  Tag, Settings as SettingsIcon, ToggleLeft, ToggleRight,
  Image as ImageIcon, Trash2, Info, BellRing, Clock, Plus,
  Database, ExternalLink, RefreshCw, Loader2, ShieldCheck
} from 'lucide-react';
import { BusinessSettings } from '../types';
import SignaturePad from './SignaturePad';

interface SettingsProps {
  settings: BusinessSettings;
  onUpdate: (settings: BusinessSettings) => void;
  isGoogleAuthenticated: boolean;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  driveFileId: string | null;
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  onUpdate, 
  isGoogleAuthenticated, 
  onConnectGoogle, 
  onDisconnectGoogle,
  driveFileId
}) => {
  const [formData, setFormData] = useState<BusinessSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'ready'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = [
    // Standard Branding
    { name: 'Blue', value: '#2563eb' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Lime', value: '#84cc16' },
    
    // Warm Tones
    { name: 'Yellow', value: '#eab308' },
    { name: 'Amber', value: '#d97706' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Wine', value: '#7f1d1d' },

    // Cool & Royal
    { name: 'Indigo', value: '#4f46e5' },
    { name: 'Violet', value: '#7c3aed' },
    { name: 'Purple', value: '#9333ea' },
    { name: 'Fuchsia', value: '#c026d3' },
    { name: 'Pink', value: '#db2777' },
    { name: 'Deep Blue', value: '#1e3a8a' },

    // Professional Neutrals
    { name: 'Slate', value: '#0f172a' },
    { name: 'Zinc', value: '#52525b' },
    { name: 'Stone', value: '#78716c' },
    { name: 'Neutral', value: '#737373' },
    { name: 'Brown', value: '#78350f' },
    { name: 'Olive', value: '#3f6212' }
  ];

  const reminderOptions = [
    { label: '3 Days', value: 3 },
    { label: '7 Days', value: 7 },
    { label: '14 Days', value: 14 },
    { label: '30 Days', value: 30 }
  ];

  const handleCheckUpdate = () => {
    setUpdateStatus('checking');
    setTimeout(() => {
      setUpdateStatus('ready');
    }, 2000);
  };

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Construct full address for backward compatibility
    const fullAddress = formData.street 
      ? `${formData.street}${formData.city ? `, ${formData.city}` : ''}${formData.state ? `, ${formData.state}` : ''}${formData.zip ? ` ${formData.zip}` : ''}`
      : formData.address;

    const updatedSettings = {
      ...formData,
      address: fullAddress
    };
    onUpdate(updatedSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData({ ...formData, logo: undefined });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">Business Console</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">Customize your brand identity and document defaults.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Cloud Storage - Google Drive */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"><Database size={18} className="text-brand"/> Cloud Storage</h3>
            
            <div className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">Google Drive Sync</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                    {isGoogleAuthenticated ? 'Connected & Syncing' : 'Not Connected'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isGoogleAuthenticated 
                  ? "Your data is securely stored in your Google Drive. All changes are automatically synced to 'ocon_invoice_pro_data.json'."
                  : "Connect your Google Drive to use it as the primary source for all your invoices, estimates, and settings."}
              </p>

              {isGoogleAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">Sync Active</span>
                  </div>
                  {driveFileId && (
                    <a 
                      href={`https://drive.google.com/file/d/${driveFileId}/view`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                    >
                      <ExternalLink size={14} /> View Data File in Drive
                    </a>
                  )}
                  <button 
                    type="button"
                    onClick={onDisconnectGoogle}
                    className="w-full py-3 text-xs font-bold text-rose-500 hover:text-rose-600 transition-all"
                  >
                    Disconnect Google Drive
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={onConnectGoogle}
                  className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
                  Connect Google Drive
                </button>
              )}
            </div>
          </div>

          {/* Brand Identity */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"><Palette size={18} className="text-brand"/> Brand Identity</h3>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Company Logo</label>
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-slate-50 dark:hover:bg-slate-800 transition-all overflow-hidden bg-slate-50 dark:bg-slate-800 group"
                >
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <>
                      <ImageIcon size={24} className="text-slate-300 dark:text-slate-600 group-hover:text-brand" />
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase">Upload</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                {formData.logo && (
                  <button type="button" onClick={removeLogo} className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1">
                    <Trash2 size={14}/> Remove Logo
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Brand Accent Color</label>
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">{colors.find(c => c.value === formData.brandColor)?.name}</span>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                {colors.map(c => (
                  <button 
                    key={c.value} type="button" 
                    onClick={() => setFormData({...formData, brandColor: c.value})}
                    title={c.name}
                    className={`aspect-square rounded-full transition-all flex items-center justify-center ${formData.brandColor === c.value ? 'scale-110 ring-4 ring-slate-100 dark:ring-slate-800 shadow-sm' : 'opacity-80 hover:opacity-100 hover:scale-105'}`}
                    style={{ backgroundColor: c.value }}
                  >
                    {formData.brandColor === c.value && <Check size={14} className="text-white" />}
                  </button>
                ))}
                <div className="relative aspect-square">
                  <input 
                    type="color" 
                    value={formData.brandColor}
                    onChange={e => setFormData({...formData, brandColor: e.target.value})}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className={`w-full h-full rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center transition-all ${!colors.some(c => c.value === formData.brandColor) ? 'scale-110 ring-4 ring-slate-100 dark:ring-slate-800 shadow-sm border-brand' : 'hover:border-brand'}`}
                    style={{ backgroundColor: !colors.some(c => c.value === formData.brandColor) ? formData.brandColor : 'transparent' }}
                  >
                    {!colors.some(c => c.value === formData.brandColor) ? (
                      <Check size={14} className="text-white" />
                    ) : (
                      <Plus size={14} className="text-slate-400 dark:text-slate-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Global Signature */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"><PenTool size={18} className="text-brand"/> Global Signature</h3>
            <SignaturePad 
              label="Official Business Signature"
              initialValue={formData.defaultSignature}
              onSave={(b64) => setFormData({...formData, defaultSignature: b64})}
              onClear={() => setFormData({...formData, defaultSignature: undefined})}
            />
          </div>

          {/* Financial Defaults */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"><CreditCard size={18} className="text-brand"/> Financial Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Default Tax Rate (%)</label>
                <div className="relative">
                  <input 
                    type="number" step="0.01"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 ring-brand/10 font-bold pr-10 dark:text-slate-100" 
                    value={formData.taxRate} 
                    onFocus={e => e.target.select()}
                    onChange={e => setFormData({...formData, taxRate: +e.target.value})} 
                  />
                  <Percent size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Default Currency</label>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 ring-brand/10 font-bold dark:text-slate-100" 
                  value={formData.currency} 
                  onChange={e => setFormData({...formData, currency: e.target.value.toUpperCase()})} 
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Discount Calculation</label>
              <div className="flex items-center gap-6">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, discountAfterTax: false})}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${!formData.discountAfterTax ? 'border-brand bg-blue-50 dark:bg-brand/10' : 'border-slate-100 dark:border-slate-800 opacity-60'}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!formData.discountAfterTax ? 'border-brand' : 'border-slate-300 dark:border-slate-600'}`}>
                    {!formData.discountAfterTax && <div className="w-2 h-2 rounded-full bg-brand" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Pre-Tax</p>
                    <p className="text-[8px] font-medium text-slate-500 dark:text-slate-400 uppercase">Discount before tax</p>
                  </div>
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, discountAfterTax: true})}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${formData.discountAfterTax ? 'border-brand bg-blue-50 dark:bg-brand/10' : 'border-slate-100 dark:border-slate-800 opacity-60'}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.discountAfterTax ? 'border-brand' : 'border-slate-300 dark:border-slate-600'}`}>
                    {formData.discountAfterTax && <div className="w-2 h-2 rounded-full bg-brand" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Post-Tax</p>
                    <p className="text-[8px] font-medium text-slate-500 dark:text-slate-400 uppercase">Subtract from final total</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Overdue Reminder Selection */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"><BellRing size={18} className="text-brand"/> Reminder Configuration</h3>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Send Reminder After</label>
              <div className="grid grid-cols-4 gap-2">
                {reminderOptions.map(opt => (
                  <button 
                    key={opt.value} type="button"
                    onClick={() => setFormData({...formData, overdueReminderDays: opt.value})}
                    className={`py-3 rounded-xl border-2 transition-all text-xs font-black uppercase tracking-widest ${formData.overdueReminderDays === opt.value ? 'border-brand bg-blue-50 dark:bg-brand/10 text-brand' : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Reminder Message Tone</label>
              <textarea 
                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 ring-brand/10 text-xs font-medium h-24 leading-relaxed dark:text-slate-100" 
                placeholder="e.g. This is a gentle reminder that your invoice is now past due..."
                value={formData.defaultReminderMessage} 
                onChange={e => setFormData({...formData, defaultReminderMessage: e.target.value})} 
              />
            </div>
          </div>
        </div>

        {/* Email Template Defaults */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"><Mail size={18} className="text-brand"/> Email Templates</h3>
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-brand/10 px-3 py-1 rounded-full border border-blue-100 dark:border-brand/20">
               <span className="text-[8px] font-black text-brand uppercase tracking-widest">Supports Placeholders: {'{{client_name}}'}, {'{{doc_number}}'}, {'{{doc_total}}'}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Default Email Subject</label>
              <input 
                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 ring-brand/10 text-sm font-bold dark:text-slate-100" 
                placeholder="Invoice #{{doc_number}} from {{business_name}}"
                value={formData.defaultEmailSubject} 
                onChange={e => setFormData({...formData, defaultEmailSubject: e.target.value})} 
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Default Email Message Body</label>
              <textarea 
                className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 ring-brand/10 text-sm h-32 leading-relaxed dark:text-slate-100" 
                placeholder="Hi {{client_name}}, please find your invoice attached..."
                value={formData.defaultEmailBody} 
                onChange={e => setFormData({...formData, defaultEmailBody: e.target.value})} 
              />
            </div>
          </div>
        </div>

        {/* Default Notes Section */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
          <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"><MessageSquare size={18} className="text-brand"/> Document Notes & Terms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Standard Invoice Notes</label>
              <textarea 
                className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 ring-brand/10 text-sm h-32 leading-relaxed dark:text-slate-100" 
                placeholder="e.g. Please pay within 14 days..."
                value={formData.defaultNotesInvoice} 
                onChange={e => setFormData({...formData, defaultNotesInvoice: e.target.value})} 
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Standard Estimate Notes</label>
              <textarea 
                className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 ring-brand/10 text-sm h-32 leading-relaxed dark:text-slate-100" 
                placeholder="e.g. This quote is valid for 30 days..."
                value={formData.defaultNotesEstimate} 
                onChange={e => setFormData({...formData, defaultNotesEstimate: e.target.value})} 
              />
            </div>
          </div>
        </div>

        {/* Organization Details */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"><Building size={18} className="text-brand"/> Organization Details</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Business Name</label>
                <input className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 ring-brand/10 font-bold dark:text-slate-100" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Official Email</label>
                <input type="email" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 ring-brand/10 font-bold dark:text-slate-100" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            
            <div className="space-y-4 pt-2 border-t border-slate-50 dark:border-slate-800">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Physical Address</label>
              <input 
                placeholder="Street Address"
                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 ring-brand/10 font-bold dark:text-slate-100" 
                value={formData.street || ''} 
                onChange={e => setFormData({...formData, street: e.target.value})} 
              />
              <div className="grid grid-cols-3 gap-4">
                <input 
                  placeholder="City"
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 ring-brand/10 font-bold dark:text-slate-100" 
                  value={formData.city || ''} 
                  onChange={e => setFormData({...formData, city: e.target.value})} 
                />
                <input 
                  placeholder="State"
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 ring-brand/10 font-bold dark:text-slate-100" 
                  value={formData.state || ''} 
                  onChange={e => setFormData({...formData, state: e.target.value})} 
                />
                <input 
                  placeholder="ZIP"
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 ring-brand/10 font-bold dark:text-slate-100" 
                  value={formData.zip || ''} 
                  onChange={e => setFormData({...formData, zip: e.target.value})} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* System & Updates */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"><ShieldCheck size={18} className="text-brand"/> System & Updates</h3>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">v2.5.0 Stable</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${updateStatus === 'ready' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'}`}>
                {updateStatus === 'checking' ? <Loader2 size={24} className="animate-spin" /> : <RefreshCw size={24} />}
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  {updateStatus === 'idle' && 'Software is up to date'}
                  {updateStatus === 'checking' && 'Checking for updates...'}
                  {updateStatus === 'ready' && 'New update available!'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {updateStatus === 'idle' && 'Last checked: Just now'}
                  {updateStatus === 'checking' && 'Connecting to OconPro servers...'}
                  {updateStatus === 'ready' && 'Version 2.5.1 includes UI enhancements and bug fixes.'}
                </p>
              </div>
            </div>
            
            {updateStatus === 'ready' ? (
              <button 
                type="button"
                onClick={handleApplyUpdate}
                disabled={isUpdating}
                className="w-full md:w-auto bg-emerald-600 text-white px-8 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all"
              >
                {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                Update App Now
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleCheckUpdate}
                disabled={updateStatus === 'checking'}
                className="w-full md:w-auto bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-8 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                {updateStatus === 'checking' ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                Check for Updates
              </button>
            )}
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-4 md:bottom-8 flex flex-col md:flex-row items-center justify-between bg-slate-900 dark:bg-slate-800 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white shadow-2xl z-10 border border-white/10 backdrop-blur-sm gap-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand">
               <Info size={20}/>
             </div>
             <p className="text-slate-400 dark:text-slate-300 font-medium text-sm">Automations and templates are saved to your local profile.</p>
           </div>
           <button type="submit" className="w-full md:w-auto bg-brand px-12 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all text-base">
             {isSaved ? <><Check size={20}/> Preferences Saved</> : <><Save size={20}/> Update Automations</>}
           </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
