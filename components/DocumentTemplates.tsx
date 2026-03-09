import React from 'react';
import { Client, BusinessSettings, DocumentTemplate } from '../types';
import { formatSafeDate } from '../utils/date';
import { Wallet } from 'lucide-react';

/**
 * SHARED COMPONENTS FOR CUSTOMIZATION
 * You can edit these sub-components to update styles across all templates.
 */

const Logo: React.FC<{ business: BusinessSettings; className?: string }> = ({ business, className = "w-16 h-16" }) => {
  if (business.logo) {
    return (
      <div className={`${className} rounded-2xl overflow-hidden mb-6 shadow-xl bg-white flex items-center justify-center border border-slate-100`}>
        <img src={business.logo} alt={business.name} className="w-full h-full object-contain p-2" />
      </div>
    );
  }
  return (
    <div className={`${className} rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-6 shadow-xl`} style={{ backgroundColor: business.brandColor }}>
      {business.name.charAt(0)}
    </div>
  );
};

interface TemplateProps {
  doc: any;
  type: 'invoice' | 'estimate';
  client?: Client;
  business: BusinessSettings;
  isClientView?: boolean;
  editableField: (value: string, onSave: (val: string) => void, className?: string, placeholder?: string) => React.ReactNode;
  onUpdate: (doc: any) => void;
  formatCurrency: (val: number) => string;
  calculated: {
    subtotal: number;
    taxAmount: number;
    totalPaid: number;
    balanceDue: number;
  };
  signatureSection: (label: string, signature?: string, name?: string, date?: string) => React.ReactNode;
}

export const ClassicTemplate: React.FC<TemplateProps> = ({ 
  doc, type, client, business, isClientView, editableField, onUpdate, formatCurrency, calculated, signatureSection 
}) => {
  const docTitle = doc.title || (type === 'invoice' ? 'Invoice' : 'Estimate');
  
  return (
    <div className={`w-full max-w-3xl bg-white shadow-2xl p-16 print-container ${isClientView ? 'border-t-8 border-brand' : ''}`} id="printable-area">
      <div className="flex justify-between items-start mb-20">
        <div>
          <Logo business={business} />
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            {editableField(business.name, (v) => {}, "")}
          </h1>
          <p className="text-slate-500 text-xs font-medium whitespace-pre-line max-w-[200px] leading-relaxed">
            {business.street ? (
              <>
                {editableField(business.street, (v) => {}, "")}
                <br />
                {editableField(`${business.city}${business.city && business.state ? ', ' : ''}${business.state} ${business.zip}`, (v) => {}, "")}
              </>
            ) : (
              editableField(business.address, (v) => {}, "")
            )}
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-5xl font-black text-slate-100 uppercase mb-4 leading-none">
            {editableField(docTitle, (v) => onUpdate({ ...doc, title: v }), "")}
          </h2>
          <div className="space-y-1 font-bold">
            <p className="text-lg" style={{ color: business.brandColor }}>
              #{editableField(doc.invoiceNumber || doc.estimateNumber, (v) => onUpdate({ ...doc, [type === 'invoice' ? 'invoiceNumber' : 'estimateNumber']: v }), "")}
            </p>
            <p className="text-slate-500 text-xs">Issued: {formatSafeDate(doc.date)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-20 mb-16">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Recipient</h4>
          <p className="text-xl font-black text-slate-800 mb-1">
            {editableField(client?.name || '', (v) => {}, "Client Name")}
          </p>
          <p className="text-slate-500 text-xs leading-relaxed font-medium">
            {client?.street ? (
              <>
                {editableField(client.street, (v) => {}, "Street")}
                <br />
                {editableField(`${client.city}${client.city && client.state ? ', ' : ''}${client.state} ${client.zip}`, (v) => {}, "City, State ZIP")}
              </>
            ) : (
              editableField(client?.address || '', (v) => {}, "Client Address")
            )}
          </p>
        </div>
      </div>

      <table className="w-full mb-16">
        <thead>
          <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
            <th className="py-4">Item Details</th>
            <th className="py-4 text-center">Qty</th>
            <th className="py-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {doc.items.map((item: any, i: number) => (
            <tr key={i} className="text-sm">
              <td className="py-6">
                <p className="font-bold text-slate-800">
                  {editableField(item.title || item.description, (v) => onUpdate({ ...doc, items: doc.items.map((it: any, idx: number) => idx === i ? { ...it, title: v } : it) }))}
                </p>
                {item.title && item.description && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {editableField(item.description, (v) => onUpdate({ ...doc, items: doc.items.map((it: any, idx: number) => idx === i ? { ...it, description: v } : it) }))}
                  </p>
                )}
                {item.unit && (
                  <p className={`text-[10px] font-bold uppercase mt-1 ${item.rate < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {formatCurrency(item.rate)} / {item.unit}
                  </p>
                )}
              </td>
              <td className="py-6 text-center text-slate-400">
                {editableField(item.quantity.toString(), (v) => onUpdate({ ...doc, items: doc.items.map((it: any, idx: number) => idx === i ? { ...it, quantity: parseFloat(v) || 0 } : it) }))}
              </td>
              <td className={`py-6 text-right font-bold ${item.quantity * item.rate < 0 ? 'text-rose-600' : 'text-slate-800'}`}>{formatCurrency(item.quantity * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col items-end mb-16">
        <div className="w-full max-w-xs space-y-3">
          <div className="flex justify-between text-slate-500 text-sm"><span>Subtotal</span><span>{formatCurrency(calculated.subtotal)}</span></div>
          <div className="flex justify-between text-slate-500 text-sm">
            <span>Tax ({business.taxRate}%)</span>
            <span>{formatCurrency(calculated.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-slate-500 text-sm">
            <span>Discount</span>
            <span className="text-rose-500">
              -{editableField(doc.discount.toString(), (v) => onUpdate({ ...doc, discount: parseFloat(v) || 0 }))}
            </span>
          </div>
          <div className="h-px bg-slate-100 my-2"></div>
          <div className="flex justify-between items-center mb-4"><span className="text-lg font-black text-slate-800">Total</span><span className="text-2xl font-black" style={{ color: business.brandColor }}>{formatCurrency(doc.total)}</span></div>
          
          {calculated.totalPaid > 0 && (
            <>
              <div className="flex justify-between text-emerald-600 text-sm font-bold">
                <span className="flex items-center gap-1"><Wallet size={12}/> Payments Received</span>
                <span>-{formatCurrency(calculated.totalPaid)}</span>
              </div>
              <div className="h-px bg-slate-100 my-2"></div>
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Balance Due</span>
                <span className="text-xl font-black text-slate-900">{formatCurrency(calculated.balanceDue)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {doc.payments && doc.payments.length > 0 && (
        <div className="mb-16">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment History</h4>
          <div className="space-y-2">
            {doc.payments.map((p: any) => (
              <div key={p.id} className="flex justify-between text-xs py-2 border-b border-slate-50 text-slate-500">
                <span>{formatSafeDate(p.date)} - {p.method}</span>
                <span className="font-bold">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-16 border-t border-slate-50 pt-8">
         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes & Terms</h4>
         <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
           {editableField(doc.notes, (v) => onUpdate({ ...doc, notes: v }), "Add notes or terms...")}
         </p>
      </div>

      <div className="grid grid-cols-2 gap-20 mt-20 border-t border-slate-50 pt-12">
        {signatureSection("Issuer Authorized", doc.signatureMe, business.name)}
        {signatureSection("Client Signature", doc.signatureClient, client?.name, doc.signatureClientDate)}
      </div>
    </div>
  );
};

export const ModernTemplate: React.FC<TemplateProps> = ({ 
  doc, type, client, business, isClientView, editableField, onUpdate, formatCurrency, calculated, signatureSection 
}) => {
  const docTitle = doc.title || (type === 'invoice' ? 'Invoice' : 'Estimate');

  return (
    <div className={`w-full max-w-4xl bg-white shadow-2xl flex print-container overflow-hidden rounded-3xl ${isClientView ? 'border-l-8 border-brand' : ''}`} id="printable-area">
      <div className="w-1/3 bg-slate-900 text-white p-12 flex flex-col">
        <div className="mb-12">
          <Logo business={business} className="w-16 h-16 bg-white" />
          <h1 className="text-xl font-black uppercase tracking-tighter mb-2">
            {editableField(business.name, (v) => {}, "text-white")}
          </h1>
          <div className="text-slate-400 text-[10px] font-medium leading-relaxed">
            {business.street ? (
              <>
                <p>{editableField(business.street, (v) => {}, "text-slate-400")}</p>
                <p>{editableField(`${business.city}${business.city && business.state ? ', ' : ''}${business.state} ${business.zip}`, (v) => {}, "text-slate-400")}</p>
              </>
            ) : (
              editableField(business.address, (v) => {}, "text-slate-400")
            )}
          </div>
        </div>

        <div className="mt-auto space-y-8">
          <div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Bill To</h4>
            <p className="text-lg font-black">{editableField(client?.name || '', (v) => {}, "text-white")}</p>
            <div className="text-slate-400 text-[10px] leading-relaxed">
              {client?.street ? (
                <>
                  <p>{editableField(client.street, (v) => {}, "text-slate-400")}</p>
                  <p>{editableField(`${client.city}${client.city && client.state ? ', ' : ''}${client.state} ${client.zip}`, (v) => {}, "text-slate-400")}</p>
                </>
              ) : (
                editableField(client?.address || '', (v) => {}, "text-slate-400")
              )}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Details</h4>
            <p className="text-xs font-bold text-brand">#{editableField(doc.invoiceNumber || doc.estimateNumber, (v) => onUpdate({ ...doc, [type === 'invoice' ? 'invoiceNumber' : 'estimateNumber']: v }), "text-brand")}</p>
            <p className="text-slate-400 text-[10px]">Date: {formatSafeDate(doc.date)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-16 flex flex-col">
        <div className="mb-12">
          <h2 className="text-6xl font-black text-slate-100 uppercase tracking-tighter mb-2">
            {editableField(docTitle, (v) => onUpdate({ ...doc, title: v }), "")}
          </h2>
        </div>

        <table className="w-full mb-12">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-900 uppercase tracking-widest text-left">
              <th className="py-4">Description</th>
              <th className="py-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doc.items.map((item: any, i: number) => (
              <tr key={i} className="text-sm">
                <td className="py-6">
                  <p className="font-bold text-slate-800">
                    {editableField(item.title || item.description, (v) => onUpdate({ ...doc, items: doc.items.map((it: any, idx: number) => idx === i ? { ...it, title: v } : it) }))}
                  </p>
                  {item.title && item.description && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {editableField(item.description, (v) => onUpdate({ ...doc, items: doc.items.map((it: any, idx: number) => idx === i ? { ...it, description: v } : it) }))}
                    </p>
                  )}
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                    {item.quantity} {item.unit} @ {formatCurrency(item.rate)}
                  </p>
                </td>
                <td className="py-6 text-right font-black text-slate-900">{formatCurrency(item.quantity * item.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-auto">
          <div className="flex flex-col items-end space-y-2 mb-12">
            <div className="flex justify-between w-48 text-slate-500 text-xs font-bold uppercase tracking-widest"><span>Subtotal</span><span>{formatCurrency(calculated.subtotal)}</span></div>
            <div className="flex justify-between w-48 text-slate-500 text-xs font-bold uppercase tracking-widest"><span>Tax</span><span>{formatCurrency(calculated.taxAmount)}</span></div>
            <div className="flex justify-between w-48 text-brand text-2xl font-black pt-4 border-t border-slate-100"><span>Total</span><span>{formatCurrency(doc.total)}</span></div>
            
            {calculated.totalPaid > 0 && (
              <>
                <div className="flex justify-between w-48 text-emerald-600 text-[10px] font-bold uppercase tracking-widest"><span>Paid</span><span>-{formatCurrency(calculated.totalPaid)}</span></div>
                <div className="flex justify-between w-48 text-slate-900 text-lg font-black pt-2 border-t border-slate-900"><span>Balance</span><span>{formatCurrency(calculated.balanceDue)}</span></div>
              </>
            )}
          </div>

          {doc.payments && doc.payments.length > 0 && (
            <div className="mb-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Payments</h4>
              <div className="space-y-1">
                {doc.payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between text-[10px] text-slate-500">
                    <span>{formatSafeDate(p.date)} ({p.method})</span>
                    <span className="font-bold">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-100">
            {signatureSection("Authorized", doc.signatureMe, business.name)}
            {signatureSection("Client", doc.signatureClient, client?.name)}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MinimalTemplate: React.FC<TemplateProps> = ({ 
  doc, type, client, business, isClientView, editableField, onUpdate, formatCurrency, calculated, signatureSection 
}) => {
  const docTitle = doc.title || (type === 'invoice' ? 'Invoice' : 'Estimate');

  return (
    <div className={`w-full max-w-3xl bg-white p-20 print-container ${isClientView ? 'border-t border-slate-200' : ''}`} id="printable-area">
      <div className="mb-12">
        <Logo business={business} className="w-12 h-12" />
      </div>
      <div className="mb-24 flex justify-between items-end">
        <h2 className="text-4xl font-light text-slate-900 tracking-tight">
          {editableField(docTitle, (v) => onUpdate({ ...doc, title: v }), "")}
        </h2>
        <div className="text-right text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          <p>#{editableField(doc.invoiceNumber || doc.estimateNumber, (v) => onUpdate({ ...doc, [type === 'invoice' ? 'invoiceNumber' : 'estimateNumber']: v }), "")}</p>
          <p>{formatSafeDate(doc.date)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-24 mb-24">
        <div>
          <h4 className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-300 mb-6">From</h4>
          <p className="text-xs font-bold text-slate-900 mb-1">{editableField(business.name, (v) => {}, "")}</p>
          <div className="text-[10px] text-slate-500 leading-relaxed">
            {business.street ? (
              <>
                <p>{editableField(business.street, (v) => {}, "")}</p>
                <p>{editableField(`${business.city}${business.city && business.state ? ', ' : ''}${business.state} ${business.zip}`, (v) => {}, "")}</p>
              </>
            ) : (
              editableField(business.address, (v) => {}, "")
            )}
          </div>
        </div>
        <div>
          <h4 className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-300 mb-6">To</h4>
          <p className="text-xs font-bold text-slate-900 mb-1">{editableField(client?.name || '', (v) => {}, "")}</p>
          <div className="text-[10px] text-slate-500 leading-relaxed">
            {client?.street ? (
              <>
                <p>{editableField(client.street, (v) => {}, "")}</p>
                <p>{editableField(`${client.city}${client.city && client.state ? ', ' : ''}${client.state} ${client.zip}`, (v) => {}, "")}</p>
              </>
            ) : (
              editableField(client?.address || '', (v) => {}, "")
            )}
          </div>
        </div>
      </div>

      <div className="space-y-12 mb-24">
        {doc.items.map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-start group">
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 mb-1">
                {editableField(item.title || item.description, (v) => onUpdate({ ...doc, items: doc.items.map((it: any, idx: number) => idx === i ? { ...it, title: v } : it) }))}
              </p>
              {item.title && item.description && (
                <p className="text-[10px] text-slate-400 mb-1">
                  {editableField(item.description, (v) => onUpdate({ ...doc, items: doc.items.map((it: any, idx: number) => idx === i ? { ...it, description: v } : it) }))}
                </p>
              )}
              <p className="text-[10px] text-slate-400">
                {item.quantity} × {formatCurrency(item.rate)}
              </p>
            </div>
            <p className="text-sm font-bold text-slate-900">{formatCurrency(item.quantity * item.rate)}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-24">
        <div className="w-48 space-y-4">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400"><span>Subtotal</span><span>{formatCurrency(calculated.subtotal)}</span></div>
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-4 border-t border-slate-100"><span>Total</span><span>{formatCurrency(doc.total)}</span></div>
          
          {calculated.totalPaid > 0 && (
            <>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium pt-2"><span>Paid</span><span>-{formatCurrency(calculated.totalPaid)}</span></div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-900"><span>Balance Due</span><span>{formatCurrency(calculated.balanceDue)}</span></div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-24 pt-12 border-t border-slate-100">
        {signatureSection("Authorized", doc.signatureMe, business.name)}
        {signatureSection("Client", doc.signatureClient, client?.name)}
      </div>
    </div>
  );
};

export const DocumentTemplateRenderer: React.FC<TemplateProps & { templateName: DocumentTemplate }> = (props) => {
  switch (props.templateName) {
    case 'modern':
      return <ModernTemplate {...props} />;
    case 'minimal':
      return <MinimalTemplate {...props} />;
    case 'classic':
    default:
      return <ClassicTemplate {...props} />;
  }
};
