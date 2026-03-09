
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings as SettingsIcon, 
  Plus, 
  FileCheck, 
  Package, 
  FolderOpen,
  Edit3,
  Search,
  Trash2,
  X,
  CreditCard,
  ChevronDown,
  History,
  Eye,
  Copy,
  Menu,
  Database,
  Undo2,
  Redo2,
  ArrowLeft,
  HelpCircle,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { View, Invoice, Client, BusinessSettings, InvoiceStatus, Estimate, EstimateStatus, LibraryItem, ActivityLog, EstimateGroup, InvoiceGroup } from './types';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import EstimateList from './components/EstimateList';
import EstimateForm from './components/EstimateForm';
import ClientList from './components/ClientList';
import ItemLibrary from './components/ItemLibrary';
import Settings from './components/Settings';
import PreviewModal from './components/PreviewModal';
import MigrationCenter from './components/MigrationCenter';
import AboutPage from './components/AboutPage';
import LoginPage from './components/LoginPage';

const App: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [itemLibrary, setItemLibrary] = useState<LibraryItem[]>([]);
  
  const [invoiceGroups, setInvoiceGroups] = useState<InvoiceGroup[]>([
    { id: 'general-inv', name: 'General Invoices' }
  ]);
  const [estimateGroups, setEstimateGroups] = useState<EstimateGroup[]>([
    { id: 'general-est', name: 'General Estimates' }
  ]);

  const [activeGroupId, setActiveGroupId] = useState<string>('all');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{type: 'invoice' | 'estimate', data: any} | null>(null);

  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true'; // Defaults to false (light) if null or 'false'
  });

  // User Authentication State
  const [user, setUser] = useState<{ email: string, name: string, picture?: string } | null>(null);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Google Drive Integration State
  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // History for Undo
  const [undoStack, setUndoStack] = useState<any[]>([]);
  // History for Redo
  const [redoStack, setRedoStack] = useState<any[]>([]);
  // History for Back navigation
  const [viewStack, setViewStack] = useState<View[]>([]);

  const getCurrentState = () => ({
    invoices,
    estimates,
    clients,
    itemLibrary,
    businessSettings,
    invoiceGroups,
    estimateGroups
  });

  const saveToUndoStack = () => {
    const currentState = getCurrentState();
    setUndoStack(prev => [JSON.stringify(currentState), ...prev].slice(0, 50));
    setRedoStack([]); // Clear redo stack on new action
  };

  const applyState = (state: any) => {
    setInvoices(state.invoices);
    setEstimates(state.estimates);
    setClients(state.clients);
    setItemLibrary(state.itemLibrary);
    setBusinessSettings(state.businessSettings);
    setInvoiceGroups(state.invoiceGroups);
    setEstimateGroups(state.estimateGroups);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const currentState = getCurrentState();
    setRedoStack(prev => [JSON.stringify(currentState), ...prev].slice(0, 50));

    const [lastStateStr, ...remainingStack] = undoStack;
    const lastState = JSON.parse(lastStateStr);
    
    applyState(lastState);
    setUndoStack(remainingStack);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const currentState = getCurrentState();
    setUndoStack(prev => [JSON.stringify(currentState), ...prev].slice(0, 50));

    const [nextStateStr, ...remainingStack] = redoStack;
    const nextState = JSON.parse(nextStateStr);

    applyState(nextState);
    setRedoStack(remainingStack);
  };

  const handleBack = () => {
    if (viewStack.length === 0) {
      setCurrentView('dashboard');
      return;
    }
    const [prevView, ...remainingStack] = viewStack;
    setCurrentView(prevView);
    setViewStack(remainingStack);
    setEditingId(null);
    setActiveGroupId('all');
  };
  
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    name: 'Ocon Services',
    email: 'info@oconservices.ca',
    address: 'No Address Provided',
    currency: 'CAD',
    taxRate: 13,
    defaultDiscount: 0,
    discountAfterTax: false,
    paymentTerms: 'Net 30',
    brandColor: '#2563eb',
    dateFormat: 'MM/DD/YYYY',
    overdueReminderDays: 7,
    defaultReminderMessage: 'Gentle reminder: Your invoice is past due. We would appreciate it if you could settle the balance at your earliest convenience.'
  });

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsAuthLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/status`);
        const data = await response.json();
        setIsGoogleAuthenticated(data.isAuthenticated);
        setUser(data.user);
        if (data.isAuthenticated) {
          fetchFromDrive();
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuthStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuthStatus();
      }
    };
    window.addEventListener('message', handleMessage);

    // Capacitor Back Button Handling
    let backListener: any;
    if (Capacitor.isNativePlatform()) {
      backListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (currentView !== 'dashboard') {
          handleBack();
        } else {
          CapacitorApp.exitApp();
        }
      });
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      if (backListener) {
        backListener.remove();
      }
    };
  }, [currentView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, invoices, estimates, clients, itemLibrary, businessSettings, invoiceGroups, estimateGroups]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const fetchFromDrive = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/drive/data`);
      const result = await response.json();
      if (result.data) {
        applyState(result.data);
        setDriveFileId(result.fileId);
      }
    } catch (error) {
      console.error('Error fetching from Drive:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveToDrive = async (state: any) => {
    if (!isGoogleAuthenticated) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/drive/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: state })
      });
      const result = await response.json();
      if (result.success) {
        setDriveFileId(result.fileId);
      }
    } catch (error) {
      console.error('Error saving to Drive:', error);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google/url`);
      const { url } = await response.json();
      
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url, windowName: 'google_auth' });
      } else {
        window.open(url, 'google_auth', 'width=600,height=700');
      }
    } catch (error) {
      console.error('Error getting auth URL:', error);
    }
  };

  const handleEmailLogin = async (email: string, pass: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    setIsGoogleAuthenticated(true);
    setUser(data.user);
    // Note: Password auth users don't have Google Drive sync by default
    // but we can still fetch from drive if they previously connected it
    fetchFromDrive();
  };

  const handleEmailRegister = async (email: string, pass: string, name: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, name })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    setIsGoogleAuthenticated(true);
    setUser(data.user);
  };

  const handleDisconnectGoogle = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
      setIsGoogleAuthenticated(false);
      setDriveFileId(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    const savedInv = localStorage.getItem('invoices');
    const savedEst = localStorage.getItem('estimates');
    const savedCl = localStorage.getItem('clients');
    const savedLib = localStorage.getItem('library');
    const savedSett = localStorage.getItem('settings');
    const savedEstGroups = localStorage.getItem('estimateGroups');
    const savedInvGroups = localStorage.getItem('invoiceGroups');

    if (savedInv) setInvoices(JSON.parse(savedInv));
    if (savedEst) setEstimates(JSON.parse(savedEst));
    if (savedCl) setClients(JSON.parse(savedCl));
    if (savedLib) setItemLibrary(JSON.parse(savedLib));
    if (savedSett) setBusinessSettings(prev => ({ ...prev, ...JSON.parse(savedSett) }));
    if (savedEstGroups) setEstimateGroups(JSON.parse(savedEstGroups));
    if (savedInvGroups) setInvoiceGroups(JSON.parse(savedInvGroups));
  }, []);

  useEffect(() => {
    const state = getCurrentState();
    localStorage.setItem('invoices', JSON.stringify(invoices));
    localStorage.setItem('estimates', JSON.stringify(estimates));
    localStorage.setItem('clients', JSON.stringify(clients));
    localStorage.setItem('library', JSON.stringify(itemLibrary));
    localStorage.setItem('settings', JSON.stringify(businessSettings));
    localStorage.setItem('estimateGroups', JSON.stringify(estimateGroups));
    localStorage.setItem('invoiceGroups', JSON.stringify(invoiceGroups));
    
    document.documentElement.style.setProperty('--brand-primary', businessSettings.brandColor);

    if (isGoogleAuthenticated) {
      const timeoutId = setTimeout(() => {
        saveToDrive(state);
      }, 2000); // Debounce save
      return () => clearTimeout(timeoutId);
    }
  }, [invoices, estimates, clients, itemLibrary, businessSettings, estimateGroups, invoiceGroups, isGoogleAuthenticated]);

  const addActivity = (docType: 'invoice' | 'estimate', docId: string, action: ActivityLog['action'], note?: string) => {
    saveToUndoStack();
    const newActivity: ActivityLog = { id: Date.now().toString(), timestamp: new Date().toISOString(), action, note };
    if (docType === 'invoice') {
      setInvoices(prev => prev.map(inv => inv.id === docId ? { ...inv, activity: [newActivity, ...(inv.activity || [])] } : inv));
    } else {
      setEstimates(prev => prev.map(est => est.id === docId ? { ...est, activity: [newActivity, ...(est.activity || [])] } : est));
    }
  };

  const handleDocUpdate = (type: 'invoice' | 'estimate', updatedDoc: any) => {
    saveToUndoStack();
    if (type === 'invoice') {
      setInvoices(prev => prev.map(i => i.id === updatedDoc.id ? updatedDoc : i));
    } else {
      setEstimates(prev => prev.map(e => e.id === updatedDoc.id ? updatedDoc : e));
    }
  };

  const handleDeleteDoc = (type: 'invoice' | 'estimate', id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    saveToUndoStack();
    if (type === 'invoice') {
      setInvoices(prev => prev.filter(i => i.id !== id));
    } else {
      setEstimates(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleDuplicateInvoice = (invoice: Invoice) => {
    saveToUndoStack();
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      invoiceNumber: `${invoice.invoiceNumber}-COPY`,
      date: new Date().toISOString(),
      status: InvoiceStatus.DRAFT,
      activity: [{ id: '1', timestamp: new Date().toISOString(), action: 'Created', note: 'Duplicated from ' + invoice.invoiceNumber }],
      publicUrl: `https://oconpro.io/i/${Date.now()}`
    };
    setInvoices([newInvoice, ...invoices]);
    setCurrentView('invoices');
    setEditingId(newInvoice.id);
  };

  const handleDuplicateEstimate = (estimate: Estimate) => {
    saveToUndoStack();
    const newEstimate: Estimate = {
      ...estimate,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      estimateNumber: `${estimate.estimateNumber}-COPY`,
      date: new Date().toISOString(),
      status: EstimateStatus.DRAFT,
      activity: [{ id: '1', timestamp: new Date().toISOString(), action: 'Created', note: 'Duplicated from ' + estimate.estimateNumber }],
      publicUrl: `https://oconpro.io/e/${Date.now()}`
    };
    setEstimates([newEstimate, ...estimates]);
    setCurrentView('estimates');
    setEditingId(newEstimate.id);
  };

  const handleConvertEstimate = (est: Estimate) => {
    saveToUndoStack();
    const inv: Invoice = { 
      ...est, 
      id: Date.now().toString(), 
      title: 'Invoice', 
      invoiceNumber: `INV-${est.estimateNumber.split('-')[1] || Math.floor(1000 + Math.random() * 9000)}`, 
      date: new Date().toISOString(), 
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), 
      status: InvoiceStatus.SENT, 
      payments: [], 
      activity: [{id: '1', timestamp: new Date().toISOString(), action: 'Created', note: 'Converted from estimate'}], 
      publicUrl: `https://oconpro.io/i/${Date.now()}` 
    };
    setInvoices([inv, ...invoices]);
    setEstimates(estimates.map(e => e.id === est.id ? {...e, status: EstimateStatus.APPROVED} : e));
    setCurrentView('invoices');
    setEditingId(inv.id);
  };

  const handleRenameGroup = (id: string, newName: string, type: 'inv' | 'est') => {
    if (!newName.trim()) {
      setEditingGroupId(null);
      return;
    }
    saveToUndoStack();
    if (type === 'inv') {
      setInvoiceGroups(prev => prev.map(g => g.id === id ? { ...g, name: newName } : g));
    } else {
      setEstimateGroups(prev => prev.map(g => g.id === id ? { ...g, name: newName } : g));
    }
    setEditingGroupId(null);
  };

  const handleAddGroup = (type: 'inv' | 'est') => {
    saveToUndoStack();
    const newId = Date.now().toString();
    if (type === 'inv') {
      const newGroup = { id: newId, name: `Invoice Menu ${invoiceGroups.length + 1}` };
      setInvoiceGroups([...invoiceGroups, newGroup]);
      setActiveGroupId(newId);
      setCurrentView('invoices');
    } else {
      const newGroup = { id: newId, name: `Estimate Menu ${estimateGroups.length + 1}` };
      setEstimateGroups([...estimateGroups, newGroup]);
      setActiveGroupId(newId);
      setCurrentView('estimates');
    }
    setEditingGroupId(newId);
  };

  const handleDeleteGroup = (id: string, type: 'inv' | 'est') => {
    if (!confirm('Are you sure you want to delete this workspace? Documents will be moved to the General menu.')) return;
    saveToUndoStack();
    if (type === 'inv') {
      if (invoiceGroups.length <= 1) return alert('You must have at least one invoice menu.');
      setInvoiceGroups(prev => prev.filter(g => g.id !== id));
      setInvoices(prev => prev.map(inv => inv.groupId === id ? { ...inv, groupId: invoiceGroups[0].id } : inv));
    } else {
      if (estimateGroups.length <= 1) return alert('You must have at least one estimate menu.');
      setEstimateGroups(prev => prev.filter(g => g.id !== id));
      setEstimates(prev => prev.map(est => est.groupId === id ? { ...est, groupId: estimateGroups[0].id } : est));
    }
    setActiveGroupId('all');
  };

  const filteredInvoices = activeGroupId === 'all' || currentView !== 'invoices' 
    ? invoices 
    : invoices.filter(i => i.groupId === activeGroupId);

  const filteredEstimates = activeGroupId === 'all' || currentView !== 'estimates'
    ? estimates 
    : estimates.filter(e => e.groupId === activeGroupId);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'estimates', label: 'Estimates', icon: FileCheck },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'library', label: 'Item Library', icon: Package },
    { id: 'migration', label: 'Migration', icon: Database },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'about', label: 'Help & Tutorials', icon: HelpCircle },
  ];

  const navigateTo = (id: View) => {
    if (currentView !== id) {
      setViewStack(prev => [currentView, ...prev].slice(0, 20));
    }
    setCurrentView(id);
    setEditingId(null);
    setActiveGroupId('all');
    setMobileSidebarOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard 
          invoices={invoices} 
          estimates={estimates} 
          clients={clients} 
          businessSettings={businessSettings} 
          onNewAction={(type) => setCurrentView(type === 'invoice' ? 'new-invoice' : 'new-estimate')} 
          onPreview={(type, data) => setPreviewDoc({type, data})}
          onEdit={(type, id) => {
            setEditingId(id);
            setCurrentView(type === 'invoice' ? 'new-invoice' : 'new-estimate');
          }}
          onDuplicate={(type, data) => {
            if (type === 'invoice') handleDuplicateInvoice(data);
            else handleDuplicateEstimate(data);
          }}
          onDelete={(type, id) => handleDeleteDoc(type, id)}
          onConvert={handleConvertEstimate}
        />;
      case 'invoices':
        return <InvoiceList 
          invoices={filteredInvoices} clients={clients} currency={businessSettings.currency}
          onEdit={(id) => { setEditingId(id); setCurrentView('new-invoice'); }} 
          onDelete={(id) => handleDeleteDoc('invoice', id)} 
          onDuplicate={handleDuplicateInvoice}
          onPreview={(inv) => setPreviewDoc({type: 'invoice', data: inv})}
          onNew={() => setCurrentView('new-invoice')} 
          onImport={(imported, newCl) => {
            saveToUndoStack();
            setInvoices([...imported, ...invoices]);
            setClients([...newCl, ...clients]);
          }}
          onRecordPayment={(id, p) => {
            const inv = invoices.find(i => i.id === id);
            if (inv) {
              saveToUndoStack();
              const updatedPayments = [...(inv.payments || []), p];
              const totalPaid = updatedPayments.reduce((s, pay) => s + pay.amount, 0);
              const status = totalPaid >= inv.total ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;
              const updatedInv = { ...inv, payments: updatedPayments, status };
              setInvoices(prev => prev.map(i => i.id === id ? updatedInv : i));
              addActivity('invoice', id, 'Paid', `Payment of ${p.amount} recorded via ${p.method}`);
            }
          }}
        />;
      case 'estimates':
        return <EstimateList 
          estimates={filteredEstimates} clients={clients} currency={businessSettings.currency}
          onEdit={(id) => { setEditingId(id); setCurrentView('new-estimate'); }} 
          onDelete={(id) => handleDeleteDoc('estimate', id)} 
          onDuplicate={handleDuplicateEstimate}
          onPreview={(est) => setPreviewDoc({type: 'estimate', data: est})}
          onUpdateStatus={(id, status) => {
            saveToUndoStack();
            setEstimates(prev => prev.map(e => e.id === id ? {...e, status} : e));
          }}
          onNew={() => setCurrentView('new-estimate')} 
          onImport={(imported, newCl) => {
            saveToUndoStack();
            setEstimates([...imported, ...estimates]);
            setClients([...newCl, ...clients]);
          }}
          onConvert={handleConvertEstimate}
        />;
      case 'payments':
        const paidInvoices = invoices.filter(i => i.status === InvoiceStatus.PAID);
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">Payments</h2>
              <p className="text-slate-500 font-medium">History of all successfully paid transactions.</p>
            </div>
            <div className="bg-white rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-6 md:px-8 py-6">Transaction / #</th>
                      <th className="px-6 md:px-8 py-6">Client</th>
                      <th className="px-6 md:px-8 py-6 hidden md:table-cell">Payment Date</th>
                      <th className="px-6 md:px-8 py-6 text-right">Amount Paid</th>
                      <th className="px-6 md:px-8 py-6 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paidInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-400 font-medium italic px-6">No paid transactions recorded yet.</td>
                      </tr>
                    ) : paidInvoices.map(inv => {
                      const client = clients.find(c => c.id === inv.clientId);
                      const payActivity = (inv.activity || []).find(a => a.action === 'Paid');
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 md:px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-brand font-black uppercase tracking-tighter">Paid Invoice</span>
                              <span className="font-bold text-slate-800">#{inv.invoiceNumber}</span>
                            </div>
                          </td>
                          <td className="px-6 md:px-8 py-6">
                            <p className="text-sm font-bold text-slate-700">{client?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[120px] md:max-w-none">{client?.email}</p>
                          </td>
                          <td className="px-6 md:px-8 py-6 text-sm text-slate-500 font-medium hidden md:table-cell">
                            {payActivity ? new Date(payActivity.timestamp).toLocaleDateString() : new Date(inv.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 md:px-8 py-6 text-right font-black text-emerald-600 text-base md:text-lg">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: businessSettings.currency }).format(inv.total)}
                          </td>
                          <td className="px-6 md:px-8 py-6 text-center">
                            <button 
                              onClick={() => setPreviewDoc({ type: 'invoice', data: inv })}
                              className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl hover:bg-emerald-100 transition-all shadow-sm border border-emerald-100"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'library':
        return <ItemLibrary items={itemLibrary} onUpdate={(items) => {
          saveToUndoStack();
          setItemLibrary(items);
        }} currency={businessSettings.currency} />;
      case 'clients':
        return <ClientList 
          clients={clients} 
          invoices={invoices} 
          estimates={estimates} 
          currency={businessSettings.currency} 
          onAddClient={(c) => {
            saveToUndoStack();
            setClients([...clients, c]);
          }} 
          onUpdateClient={(updated) => {
            saveToUndoStack();
            setClients(clients.map(c => c.id === updated.id ? updated : c));
          }}
          onDeleteClient={(id) => {
            saveToUndoStack();
            setClients(clients.filter(c => c.id !== id));
          }} 
          onViewPaid={(client) => {}}
        />;
      case 'migration':
        return <MigrationCenter 
          existingClients={clients}
          onImportClients={(c) => {
            saveToUndoStack();
            setClients([...clients, ...c]);
          }}
          onImportInvoices={(i) => {
            saveToUndoStack();
            setInvoices([...invoices, ...i]);
          }}
          onImportEstimates={(e) => {
            saveToUndoStack();
            setEstimates([...estimates, ...e]);
          }}
        />;
      case 'settings':
        return <Settings 
          settings={businessSettings} 
          onUpdate={(s) => {
            saveToUndoStack();
            setBusinessSettings(s);
          }} 
          isGoogleAuthenticated={isGoogleAuthenticated}
          onConnectGoogle={handleConnectGoogle}
          onDisconnectGoogle={handleDisconnectGoogle}
          driveFileId={driveFileId}
        />;
      case 'about':
        return <AboutPage />;
      case 'new-invoice':
      case 'new-estimate':
        const isInvoice = currentView === 'new-invoice';
        const defaultGroupId = activeGroupId !== 'all' ? activeGroupId : undefined;
        
        return isInvoice ? (
          <InvoiceForm 
            initialInvoice={editingId ? invoices.find(i => i.id === editingId) : (defaultGroupId ? { groupId: defaultGroupId } as any : { discount: businessSettings.defaultDiscount, tax: businessSettings.taxRate } as any)}
            clients={clients} library={itemLibrary} businessSettings={businessSettings}
            groups={invoiceGroups}
            onSave={(doc) => {
              saveToUndoStack();
              if (editingId) setInvoices(invoices.map(i => i.id === editingId ? doc : i));
              else setInvoices([{...doc, activity: [{id: '1', timestamp: new Date().toISOString(), action: 'Created'}], publicUrl: `https://oconpro.io/i/${Date.now()}`}, ...invoices]);
              setCurrentView('invoices');
              setEditingId(null);
            }}
            onCancel={() => { setCurrentView('invoices'); setEditingId(null); }}
            onPreview={(doc) => setPreviewDoc({type: 'invoice', data: doc})}
            onAddClient={(c) => {
              saveToUndoStack();
              setClients([...clients, c]);
            }}
          />
        ) : (
          <EstimateForm 
            initialEstimate={editingId ? estimates.find(e => e.id === editingId) : (defaultGroupId ? { groupId: defaultGroupId } as any : { discount: businessSettings.defaultDiscount, tax: businessSettings.taxRate } as any)}
            clients={clients} library={itemLibrary} businessSettings={businessSettings} 
            groups={estimateGroups}
            onSave={(doc) => {
              saveToUndoStack();
              if (editingId) setEstimates(estimates.map(e => e.id === editingId ? doc : e));
              else setEstimates([{...doc, activity: [{id: '1', timestamp: new Date().toISOString(), action: 'Created'}], publicUrl: `https://oconpro.io/e/${Date.now()}`}, ...estimates]);
              setCurrentView('estimates');
              setEditingId(null);
            }}
            onCancel={() => { setCurrentView('estimates'); setEditingId(null); }}
            onPreview={(doc) => setPreviewDoc({type: 'estimate', data: doc})}
            onAddClient={(c) => {
              saveToUndoStack();
              setClients([...clients, c]);
            }}
          />
        );
      default:
        return null;
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3">
        <div className="bg-brand p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
          <FileText size={24} />
        </div>
        {(sidebarOpen || mobileSidebarOpen) && <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">OconInvoicePro</h1>}
        {mobileSidebarOpen && (
          <button onClick={() => setMobileSidebarOpen(false)} className="ml-auto p-2 text-slate-400 md:hidden">
            <X size={24} />
          </button>
        )}
      </div>
      
      <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id as View)}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all ${
              currentView === item.id && activeGroupId === 'all'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-brand font-bold' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <item.icon size={20} />
            {(sidebarOpen || mobileSidebarOpen) && <span>{item.label}</span>}
          </button>
        ))}

        {(sidebarOpen || mobileSidebarOpen) && (
          <>
            <div className="pt-6 pb-2">
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Menus</p>
                <button onClick={() => handleAddGroup('inv')} className="p-1 text-slate-400 hover:text-brand hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><Plus size={14}/></button>
              </div>
              <div className="space-y-1">
                {invoiceGroups.map(group => (
                  <div key={group.id} className="group relative">
                    <button
                      onClick={() => { setCurrentView('invoices'); setActiveGroupId(group.id); setMobileSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        currentView === 'invoices' && activeGroupId === group.id 
                        ? 'bg-brand text-white font-bold' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FolderOpen size={16} />
                      {editingGroupId === group.id ? (
                        <input 
                          autoFocus
                          className="bg-transparent border-none outline-none w-full text-current font-bold"
                          defaultValue={group.name}
                          onBlur={(e) => handleRenameGroup(group.id, e.target.value, 'inv')}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameGroup(group.id, e.currentTarget.value, 'inv')}
                        />
                      ) : (
                        <span className="truncate">{group.name}</span>
                      )}
                    </button>
                    {!editingGroupId && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingGroupId(group.id); }}
                          className={`p-1.5 rounded-lg transition-colors ${currentView === 'invoices' && activeGroupId === group.id ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id, 'inv'); }}
                          className={`p-1.5 rounded-lg transition-colors ${currentView === 'invoices' && activeGroupId === group.id ? 'text-white/70 hover:text-rose-200' : 'text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500'}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 pb-2">
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimate Menus</p>
                <button onClick={() => handleAddGroup('est')} className="p-1 text-slate-400 hover:text-brand hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><Plus size={14}/></button>
              </div>
              <div className="space-y-1">
                {estimateGroups.map(group => (
                  <div key={group.id} className="group relative">
                    <button
                      onClick={() => { setCurrentView('estimates'); setActiveGroupId(group.id); setMobileSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        currentView === 'estimates' && activeGroupId === group.id 
                        ? 'bg-brand text-white font-bold' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FolderOpen size={16} />
                      {editingGroupId === group.id ? (
                        <input 
                          autoFocus
                          className="bg-transparent border-none outline-none w-full text-current font-bold"
                          defaultValue={group.name}
                          onBlur={(e) => handleRenameGroup(group.id, e.target.value, 'est')}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameGroup(group.id, e.currentTarget.value, 'est')}
                        />
                      ) : (
                        <span className="truncate">{group.name}</span>
                      )}
                    </button>
                    {!editingGroupId && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingGroupId(group.id); }}
                          className={`p-1.5 rounded-lg transition-colors ${currentView === 'estimates' && activeGroupId === group.id ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id, 'est'); }}
                          className={`p-1.5 rounded-lg transition-colors ${currentView === 'estimates' && activeGroupId === group.id ? 'text-white/70 hover:text-rose-200' : 'text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500'}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </nav>

      {user && (sidebarOpen || mobileSidebarOpen) && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleDisconnectGoogle}
            className="w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
          >
            Sign Out
          </button>
        </div>
      )}
    </>
  );

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isGoogleAuthenticated) {
    return (
      <LoginPage 
        onLogin={handleConnectGoogle} 
        onEmailLogin={handleEmailLogin}
        onEmailRegister={handleEmailRegister}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden text-slate-900 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-950">
      <style>{`
        :root { --brand-primary: ${businessSettings.brandColor}; }
        .bg-brand { background-color: var(--brand-primary); }
        .text-brand { color: var(--brand-primary); }
        .border-brand { border-color: var(--brand-primary); }
        .hover\\:bg-brand:hover { background-color: var(--brand-primary); filter: brightness(0.9); }
      `}</style>
      
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex-col z-40 ${sidebarOpen ? 'w-72' : 'w-20'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}></div>
          <aside className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col h-full overflow-y-auto relative no-print">
        <header className="h-16 md:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2 md:gap-3 flex-1">
            <button 
              onClick={() => setMobileSidebarOpen(true)} 
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0"
            >
              <Menu size={24} />
            </button>
            
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center gap-1 md:gap-2 mr-2 md:mr-4 shrink-0">
              <button 
                onClick={handleBack}
                disabled={viewStack.length === 0 && currentView === 'dashboard'}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                title="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
              <button 
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                title="Undo Last Action (Ctrl+Z)"
              >
                <Undo2 size={20} />
              </button>
              <button 
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                title="Redo Action (Ctrl+Y)"
              >
                <Redo2 size={20} />
              </button>
              {isSyncing && (
                <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-brand rounded-full animate-pulse shrink-0">
                  <Database size={12} />
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest hidden xs:inline">Syncing</span>
                </div>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-4 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full w-80 border border-slate-200 dark:border-slate-700 focus-within:border-brand transition-colors">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-full text-slate-600 dark:text-slate-300" />
            </div>
            
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all shrink-0"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
              onClick={() => {
                if (confirm('Update app and refresh UI? Any unsaved local changes will be synced before reload.')) {
                  window.location.reload();
                }
              }}
              className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all shrink-0"
              title="Update App & Refresh UI"
            >
              <RefreshCw size={20} />
            </button>

            <button 
              onClick={() => navigateTo('about')}
              className={`p-2 rounded-xl transition-all shrink-0 ${currentView === 'about' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="Help & Tutorials"
            >
              <HelpCircle size={22} />
            </button>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-2">
             <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-sm md:text-base">
              {businessSettings.name.charAt(0)}
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">{renderContent()}</div>
      </main>

      {previewDoc && (
        <PreviewModal 
          doc={previewDoc.data} type={previewDoc.type} 
          client={clients.find(c => c.id === previewDoc.data.clientId)}
          business={businessSettings} 
          onClose={() => setPreviewDoc(null)}
          onEdit={() => {
            setEditingId(previewDoc.data.id);
            setCurrentView(previewDoc.type === 'invoice' ? 'new-invoice' : 'new-estimate');
            setPreviewDoc(null);
          }}
          onDuplicate={() => {
            if (previewDoc.type === 'invoice') handleDuplicateInvoice(previewDoc.data);
            else handleDuplicateEstimate(previewDoc.data);
            setPreviewDoc(null);
          }}
          onConvert={() => {
            if (previewDoc.type === 'estimate') {
              handleConvertEstimate(previewDoc.data);
              setPreviewDoc(null);
            }
          }}
          onUpdate={(updated) => {
            handleDocUpdate(previewDoc.type, updated);
            setPreviewDoc({ ...previewDoc, data: updated });
          }}
          onAddActivity={(action, note) => addActivity(previewDoc.type, previewDoc.data.id, action, note)}
        />
      )}
    </div>
  );
};

export default App;
