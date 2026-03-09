import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Mail, Printer, ExternalLink, Send, Sparkles, 
  History, Clock, CheckCircle2, Eye, Download, Loader2,
  Copy, Check, Layout, PenTool, UserCheck, ShieldCheck,
  Edit2, FileCheck, Wallet, FileText
} from 'lucide-react';
import { Client, BusinessSettings, ActivityLog, EstimateStatus } from '../types';
import { generateEmailDraft } from '../services/gemini';
import SignaturePad from './SignaturePad';
import { formatSafeDate } from '../utils/date';
import { exportToWord } from '../utils/export';
import { downloadPDF, generatePDF } from '../utils/pdf';

interface PreviewModalProps {
  doc: any;
  type: 'invoice' | 'estimate';
  client?: Client;
  business: BusinessSettings;
  onClose: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onConvert?: () => void;
  onUpdate: (doc: any) => void;
  onAddActivity: (action: ActivityLog['action'], note?: string) => void;
}

import { DocumentTemplateRenderer } from './DocumentTemplates';

const PreviewModal: React.FC<PreviewModalProps> = ({ doc, type, client, business, onClose, onEdit, onDuplicate, onConvert, onUpdate, onAddActivity }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'send' | 'activity' | 'client-portal'>('preview');
  const [emailConfig, setEmailConfig] = useState({ subject: '', body: '' });
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [includePDFAttachment, setIncludePDFAttachment] = useState(true);

  const docTitle = doc.title || (type === 'invoice' ? 'Invoice' : 'Estimate');
  const template = doc.template || 'classic';

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: business.currency }).format(val);

  const calculated = useMemo(() => {
    const subtotal = doc.items.reduce((acc: number, item: any) => acc + (item.quantity * item.rate), 0);
    let taxAmount = 0;
    
    if (business.discountAfterTax) {
      taxAmount = subtotal * (business.taxRate / 100);
    } else {
      taxAmount = Math.max(0, subtotal - (doc.discount || 0)) * (business.taxRate / 100);
    }
    
    const totalPaid = (doc.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
    const balanceDue = Math.max(0, doc.total - totalPaid);
    
    return { subtotal, taxAmount, totalPaid, balanceDue };
  }, [doc, business]);

  useEffect(() => {
    if (client) {
      const isFullyPaid = calculated.balanceDue === 0;
      const hasPartialPayment = calculated.totalPaid > 0 && !isFullyPaid;

      let subject = business.defaultEmailSubject || `${docTitle.toUpperCase()} #${doc.invoiceNumber || doc.estimateNumber} from ${business.name}`;
      
      let paymentText = '';
      if (isFullyPaid) {
        paymentText = `This ${docTitle.toLowerCase()} is now fully paid. Thank you!`;
      } else if (hasPartialPayment) {
        paymentText = `Payment of ${formatCurrency(calculated.totalPaid)} has been received. Remaining balance due: ${formatCurrency(calculated.balanceDue)}.`;
      } else {
        paymentText = `Total amount due: ${formatCurrency(doc.total)}.`;
      }

      let body = business.defaultEmailBody || `Hi ${client.name},\n\nPlease find your ${docTitle.toLowerCase()} attached.\n\n${paymentText}\n\nYou can review and approve it securely here: ${doc.publicUrl}\n\nBest regards,\n${business.name}`;

      subject = subject.replace(/\{\{business_name\}\}/g, business.name).replace(/\{\{doc_number\}\}/g, doc.invoiceNumber || doc.estimateNumber);
      body = body.replace(/\{\{client_name\}\}/g, client.name).replace(/\{\{business_name\}\}/g, business.name).replace(/\{\{doc_total\}\}/g, formatCurrency(doc.total)).replace(/\{\{public_url\}\}/g, doc.publicUrl);

      setEmailConfig({ subject, body });
    }
  }, [doc, client, docTitle, business, calculated]);

  const handleAIDraft = async () => {
    if (!client) return;
    setIsDrafting(true);
    const amountStr = calculated.balanceDue < doc.total && calculated.balanceDue > 0 
      ? `${formatCurrency(calculated.balanceDue)} (Balance Due)` 
      : formatCurrency(doc.total);
      
    const draft = await generateEmailDraft(docTitle, doc.invoiceNumber || doc.estimateNumber, client.name, amountStr, business.name);
    setEmailConfig(draft);
    setIsDrafting(false);
  };

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      const attachmentNote = includePDFAttachment ? ' (with PDF attachment)' : '';
      onAddActivity('Sent', `Emailed to ${client?.email}${attachmentNote}`);
      setIsSending(false);
      setActiveTab('activity');
      alert(`Email sent successfully!${includePDFAttachment ? ' PDF document was attached.' : ''}`);
    }, 1500);
  };

  const handleClientSign = (signatureB64: string) => {
    const now = new Date().toISOString();
    const updatedDoc = {
      ...doc,
      signatureClient: signatureB64,
      signatureClientDate: now,
      status: type === 'estimate' ? EstimateStatus.APPROVED : doc.status
    };
    onUpdate(updatedDoc);
    onAddActivity('Signed', `Client signed via portal`);
    alert(type === 'estimate' ? "Proposal Approved!" : "Document Signed!");
    setIsSigning(false);
  };

  const handleWordExport = async () => {
    setIsExportingWord(true);
    try {
      await exportToWord(doc, type, client, business);
      onAddActivity('Downloaded', 'Exported to Word Document');
    } catch (err) {
      console.error(err);
      alert("Failed to export Word document.");
    }
    setIsExportingWord(false);
  };

  const handlePDFExport = async () => {
    setIsExportingPDF(true);
    try {
      const filename = `${docTitle}_${doc.invoiceNumber || doc.estimateNumber}`;
      const success = await downloadPDF('printable-area', filename);
      if (success) {
        onAddActivity('Downloaded', 'Exported to PDF Document');
      } else {
        alert("Failed to generate PDF. Please try 'Print PDF' instead.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while generating the PDF.");
    }
    setIsExportingPDF(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(doc.publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const EditableField = (value: string, onSave: (val: string) => void, className?: string, placeholder?: string) => {
    return <span className={className}>{value || placeholder}</span>;
  };

  const SignatureSection = (label: string, signature?: string, name?: string, date?: string) => (
    <div className="flex flex-col">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{label}</p>
      {signature ? (
        <div className="w-full max-w-[180px] h-16 bg-slate-50/30 rounded-xl flex flex-col items-center justify-center p-2 border border-slate-100 relative">
           <img src={signature} alt={label} className="max-h-full mix-blend-multiply" />
           {date && <p className="absolute -bottom-5 right-0 text-[8px] font-bold text-slate-300 uppercase">{formatSafeDate(date)}</p>}
        </div>
      ) : (
        <div className="h-16 border-b border-slate-100 flex items-end pb-2">
           <span className="text-[10px] text-slate-300 italic">Pending signature</span>
        </div>
      )}
      <p className="mt-2 text-[10px] font-bold text-slate-800 uppercase tracking-tight">{name}</p>
    </div>
  );

  const renderDocument = (isClientView = false) => {
    return (
      <DocumentTemplateRenderer 
        templateName={template}
        doc={doc}
        type={type}
        client={client}
        business={business}
        isClientView={isClientView}
        editableField={EditableField}
        onUpdate={onUpdate}
        formatCurrency={formatCurrency}
        calculated={calculated}
        signatureSection={SignatureSection}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md no-print animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-[90vh] flex bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white/10">
        {/* Navigation Sidebar */}
        <div className="w-20 border-r border-slate-100 flex flex-col items-center py-8 gap-6 bg-slate-50/50">
          <button onClick={() => setActiveTab('preview')} className={`p-3 rounded-2xl transition-all ${activeTab === 'preview' ? 'bg-brand text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`} title="Issuer Preview">
            <Eye size={24} />
          </button>
          <button onClick={() => setActiveTab('client-portal')} className={`p-3 rounded-2xl transition-all ${activeTab === 'client-portal' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`} title="Client Portal Simulator">
            <UserCheck size={24} />
          </button>
          <button onClick={() => setActiveTab('send')} className={`p-3 rounded-2xl transition-all ${activeTab === 'send' ? 'bg-brand text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`} title="Email Composer">
            <Send size={24} />
          </button>
          <button onClick={() => setActiveTab('activity')} className={`p-3 rounded-2xl transition-all ${activeTab === 'activity' ? 'bg-brand text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`} title="Activity History">
            <History size={24} />
          </button>
          
          <div className="h-px bg-slate-200 w-10 mx-auto my-2"></div>
          
          {onEdit && (
            <button onClick={onEdit} className="p-3 rounded-2xl text-slate-400 hover:bg-blue-50 hover:text-brand transition-all" title="Edit Content">
              <Edit2 size={24} />
            </button>
          )}
          {onDuplicate && (
            <button onClick={onDuplicate} className="p-3 rounded-2xl text-slate-400 hover:bg-blue-50 hover:text-brand transition-all" title="Save as Duplicate">
              <Copy size={24} />
            </button>
          )}
          {type === 'estimate' && doc.status !== EstimateStatus.APPROVED && onConvert && (
            <button onClick={onConvert} className="p-3 rounded-2xl text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Convert to Invoice">
              <FileCheck size={24} />
            </button>
          )}

          <div className="mt-auto">
             <button onClick={onClose} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'preview' && (
            <div className="flex-1 p-12 overflow-y-auto bg-slate-100 flex flex-col items-center gap-8">
              <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                 <button onClick={() => onUpdate({ ...doc, template: 'classic' })} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${template === 'classic' ? 'bg-brand text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Classic</button>
                 <button onClick={() => onUpdate({ ...doc, template: 'modern' })} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${template === 'modern' ? 'bg-brand text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Modern</button>
                 <button onClick={() => onUpdate({ ...doc, template: 'minimal' })} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${template === 'minimal' ? 'bg-brand text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Minimal</button>
              </div>
              
              {renderDocument()}
              
              <div className="flex gap-4">
                <button onClick={() => window.print()} className="bg-white text-slate-900 border border-slate-200 px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                  <Printer size={20}/> Print
                </button>
                <button 
                  onClick={handlePDFExport} 
                  disabled={isExportingPDF}
                  className="bg-slate-100 text-slate-900 px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-200 transition-all shadow-sm"
                >
                  {isExportingPDF ? <Loader2 size={20} className="animate-spin"/> : <Download size={20}/>}
                  Download PDF
                </button>
                <button 
                  onClick={handleWordExport} 
                  disabled={isExportingWord}
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-slate-200"
                >
                  {isExportingWord ? <Loader2 size={20} className="animate-spin"/> : <FileText size={20}/>}
                  Download Word
                </button>
                <button onClick={() => setActiveTab('send')} className="bg-brand text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-brand/20">
                  <Send size={20}/> Send via Email
                </button>
              </div>
            </div>
          )}

          {activeTab === 'client-portal' && (
             <div className="flex-1 overflow-hidden flex bg-slate-50">
               <div className="flex-1 p-12 overflow-y-auto flex flex-col items-center gap-8">
                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
                    <ShieldCheck size={16}/>
                    <span className="text-[10px] font-black uppercase tracking-widest">Secure Client View Simulator</span>
                  </div>
                  {renderDocument(true)}
               </div>
               <div className="w-80 border-l border-slate-100 p-8 flex flex-col gap-6 bg-white shadow-xl">
                 <h3 className="font-black text-xl text-slate-800 tracking-tighter">Client Actions</h3>
                 <p className="text-xs text-slate-500 leading-relaxed">This sidebar simulates the controls your client will see in their web browser.</p>
                 
                 <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Actions</p>
                   {doc.signatureClient ? (
                     <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center">
                       <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={24}/></div>
                       <p className="font-bold text-emerald-700">Document Signed</p>
                       <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Status: {type === 'estimate' ? 'Approved' : 'Acknowledged'}</p>
                     </div>
                   ) : (
                     <button 
                      onClick={() => setIsSigning(true)}
                      className="w-full bg-slate-900 text-white p-5 rounded-3xl font-black flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-slate-200"
                    >
                      <PenTool size={20}/> Sign to Approve
                    </button>
                   )}
                   <button className="w-full bg-slate-100 text-slate-600 p-4 rounded-3xl text-sm font-bold flex items-center justify-center gap-2">
                     <Download size={18}/> Save PDF Copy
                   </button>
                 </div>

                 {isSigning && (
                   <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                     <div className="bg-white p-8 rounded-[40px] w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-8">
                          <h4 className="text-xl font-black tracking-tighter">Review & Sign</h4>
                          <button onClick={() => setIsSigning(false)} className="p-2 hover:bg-slate-50 rounded-full"><X/></button>
                        </div>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">Please draw your signature below to {type === 'estimate' ? 'approve this proposal' : 'acknowledge receipt'} for {formatCurrency(doc.total)}.</p>
                        <SignaturePad 
                          label="Your Signature"
                          onSave={handleClientSign}
                          onClear={() => {}}
                        />
                        <p className="text-[10px] text-slate-300 mt-6 text-center font-bold uppercase tracking-widest">Digitally verified via Ocon Invoice Pro</p>
                     </div>
                   </div>
                 )}
               </div>
             </div>
          )}

          {activeTab === 'send' && (
            <div className="flex-1 p-12 flex flex-col max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Email Composer</h3>
                  <p className="text-slate-500 font-medium">Recipient: {client?.email}</p>
                </div>
                <button 
                  onClick={handleAIDraft}
                  disabled={isDrafting}
                  className="flex items-center gap-2 bg-blue-50 text-brand px-6 py-3 rounded-2xl font-bold border border-brand/10 hover:bg-blue-100 transition-all"
                >
                  {isDrafting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  AI Smart Draft
                </button>
              </div>

              <div className="space-y-6 flex-1 flex flex-col">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Subject Line</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 ring-brand/10 transition-all"
                    value={emailConfig.subject}
                    onChange={e => setEmailConfig({...emailConfig, subject: e.target.value})}
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Message Body</label>
                  <textarea 
                    className="flex-1 w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl text-slate-600 outline-none focus:ring-2 ring-brand/10 transition-all resize-none leading-relaxed"
                    value={emailConfig.body}
                    onChange={e => setEmailConfig({...emailConfig, body: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Interactive Secure Link</p>
                    <p className="text-xs text-brand font-bold truncate max-w-xs">{doc.publicUrl}</p>
                  </div>
                  <button onClick={copyLink} className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-brand transition-colors">
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
                
                <div className="h-px bg-slate-200 w-full"></div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-rose-500 shadow-sm">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{docTitle}_{doc.invoiceNumber || doc.estimateNumber}.pdf</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase">PDF Attachment</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={includePDFAttachment}
                      onChange={e => setIncludePDFAttachment(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleSend}
                  disabled={isSending}
                  className="bg-brand text-white px-12 py-5 rounded-[24px] font-black text-lg flex items-center gap-3 shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
                >
                  {isSending ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                  Send Secure Link
                </button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="flex-1 p-12 max-w-3xl mx-auto w-full">
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter mb-12">Tracking & Activity</h3>
              <div className="space-y-8 relative">
                <div className="absolute left-6 top-2 bottom-2 w-px bg-slate-100"></div>
                {doc.activity?.map((act: any, idx: number) => (
                  <div key={act.id} className="relative flex gap-8 group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 shadow-sm border ${
                      act.action === 'Sent' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      act.action === 'Viewed' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      act.action === 'Signed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      act.action === 'Paid' || act.action === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {act.action === 'Created' && <Clock size={20} />}
                      {act.action === 'Sent' && <Send size={20} />}
                      {act.action === 'Viewed' && <Eye size={20} />}
                      {act.action === 'Signed' && <ShieldCheck size={20} />}
                      {act.action === 'Paid' && <CheckCircle2 size={20} />}
                      {act.action === 'Downloaded' && <Download size={20} />}
                    </div>
                    <div className="pt-1">
                      <p className="font-black text-slate-800">{act.action}</p>
                      <p className="text-sm text-slate-500 font-medium">{act.note || 'No additional details'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {new Date(act.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
