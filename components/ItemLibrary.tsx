
import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit2, Search, DollarSign, Type as TypeIcon, X, Check, Save, Copy } from 'lucide-react';
import { LibraryItem } from '../types';

interface ItemLibraryProps {
  items: LibraryItem[];
  onUpdate: (items: LibraryItem[]) => void;
  currency: string;
}

const ItemLibrary: React.FC<ItemLibraryProps> = ({ items, onUpdate, currency }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItem, setNewItem] = useState<Partial<LibraryItem>>({ name: '', description: '', defaultRate: 0, unit: 'hr' });

  const handleSave = () => {
    if (!newItem.name) return;

    if (editingId) {
      onUpdate(items.map(i => i.id === editingId ? { ...i, ...newItem } as LibraryItem : i));
    } else {
      onUpdate([{ id: Date.now().toString(), ...newItem } as LibraryItem, ...items]);
    }
    
    resetForm();
  };

  const handleStartEdit = (item: LibraryItem) => {
    setNewItem(item);
    setEditingId(item.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicate = (item: LibraryItem) => {
    const duplicated = { 
      ...item, 
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      name: `${item.name} (Copy)`
    };
    onUpdate([duplicated, ...items]);
  };

  const resetForm = () => {
    setNewItem({ name: '', description: '', defaultRate: 0, unit: 'hr' });
    setEditingId(null);
    setIsAdding(false);
  };

  const filtered = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Item Library</h2>
          <p className="text-slate-500">Store your products and services for quick invoicing.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)} 
            className="flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} /> Add New Item
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-3xl border-2 border-brand border-dashed flex flex-col gap-6 animate-in zoom-in-95 shadow-xl shadow-brand/5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-slate-800">
              {editingId ? 'Edit Library Item' : 'New Product or Service'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-rose-500 transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name</label>
              <input 
                placeholder="e.g. Graphic Design, Web Hosting" 
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:ring-2 ring-brand/10 transition-all font-bold" 
                value={newItem.name} 
                onChange={e => setNewItem({...newItem, name: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate ({currency})</label>
                <input 
                  type="number" 
                  step="any"
                  placeholder="0.00" 
                  className={`w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:ring-2 ring-brand/10 transition-all font-bold ${(newItem.defaultRate || 0) < 0 ? 'text-rose-600' : ''}`} 
                  value={newItem.defaultRate} 
                  onFocus={e => e.target.select()}
                  onChange={e => setNewItem({...newItem, defaultRate: +e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</label>
                <input 
                  placeholder="hr, box, unit..." 
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:ring-2 ring-brand/10 transition-all font-bold" 
                  value={newItem.unit} 
                  onChange={e => setNewItem({...newItem, unit: e.target.value})} 
                />
              </div>
            </div>
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Default Description</label>
              <textarea 
                placeholder="Brief summary of the service or product..." 
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none h-24 resize-none focus:ring-2 ring-brand/10 transition-all text-sm" 
                value={newItem.description} 
                onChange={e => setNewItem({...newItem, description: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={resetForm} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="flex-1 py-4 font-bold bg-brand text-white rounded-xl shadow-lg shadow-brand/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {editingId ? <><Save size={20}/> Update Library Item</> : <><Plus size={20}/> Add to Library</>}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm focus-within:ring-2 ring-brand/10 transition-all">
        <Search size={20} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Search items by name or description..." 
          className="bg-transparent border-none outline-none text-sm w-full" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 italic">
            No items found matching your search.
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-blue-50 group-hover:text-brand transition-colors">
                  <Package size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDuplicate(item)}
                    className="p-2 text-slate-300 hover:text-brand hover:bg-blue-50 rounded-lg transition-all"
                    title="Duplicate Item"
                  >
                    <Copy size={16}/>
                  </button>
                  <button 
                    onClick={() => handleStartEdit(item)}
                    className="p-2 text-slate-300 hover:text-brand hover:bg-blue-50 rounded-lg transition-all"
                    title="Edit Item"
                  >
                    <Edit2 size={16}/>
                  </button>
                  <button 
                    onClick={() => onUpdate(items.filter(i => i.id !== item.id))} 
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete Item"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
              <p className="text-sm text-slate-500 mt-2 line-clamp-3 flex-1">{item.description}</p>
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-black ${item.defaultRate < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(item.defaultRate)}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per {item.unit || 'unit'}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDuplicate(item)}
                    className="bg-slate-50 text-slate-400 p-3 rounded-2xl border border-slate-100 hover:text-brand transition-all"
                    title="Duplicate Item"
                  >
                    <Copy size={18}/>
                  </button>
                  <button 
                    onClick={() => handleStartEdit(item)}
                    className="bg-brand text-white p-3 rounded-2xl shadow-lg shadow-brand/20 hover:scale-110 active:scale-95 transition-all"
                    title="Edit Item"
                  >
                    <Edit2 size={18}/>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ItemLibrary;
