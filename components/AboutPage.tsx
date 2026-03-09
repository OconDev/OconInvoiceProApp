
import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  MessageCircle, 
  PlayCircle, 
  CheckCircle2, 
  Database, 
  FileText, 
  Users, 
  Settings as SettingsIcon, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Mail,
  LifeBuoy
} from 'lucide-react';

const AboutPage: React.FC = () => {
  const [activeTutorial, setActiveTutorial] = useState<number | null>(null);

  const tutorials = [
    {
      title: "Getting Started",
      icon: <Zap className="text-amber-500" />,
      description: "Learn the basics of setting up your business profile and creating your first invoice.",
      steps: [
        "Go to Settings to configure your business name, logo, and brand color.",
        "Add your first client in the Clients tab.",
        "Create a New Invoice from the Dashboard or Invoices tab.",
        "Preview and send the secure link to your client."
      ]
    },
    {
      title: "Cloud Sync & Security",
      icon: <Database className="text-blue-500" />,
      description: "How to connect Google Drive and ensure your data is always backed up.",
      steps: [
        "Navigate to Settings > Cloud Storage.",
        "Click 'Connect Google Drive' and authorize the app.",
        "Your data will now automatically sync to a file named 'ocon_invoice_pro_data.json'.",
        "You can access this file directly from your Drive at any time."
      ]
    },
    {
      title: "Estimates to Invoices",
      icon: <FileText className="text-emerald-500" />,
      description: "Streamline your workflow by converting approved proposals into billable invoices.",
      steps: [
        "Create an Estimate for a potential project.",
        "Send the proposal to your client for digital signature.",
        "Once approved, open the estimate and click 'Convert to Invoice'.",
        "All line items and client details are transferred automatically."
      ]
    },
    {
      title: "Item Library",
      icon: <BookOpen className="text-purple-500" />,
      description: "Save time by building a catalog of your most common products and services.",
      steps: [
        "Go to the Library tab.",
        "Add items with default rates, descriptions, and units.",
        "When creating an invoice, use the 'Library' button to quickly insert items.",
        "This ensures consistent pricing and professional descriptions."
      ]
    }
  ];

  const faqs = [
    {
      q: "Is my data private?",
      a: "Yes. OconPro uses a 'Bring Your Own Storage' model. Your data lives exclusively in your browser's local storage or your personal Google Drive. We do not host your data on our servers."
    },
    {
      q: "Can I use my own brand colors?",
      a: "Absolutely. In the Settings tab, you can choose from a preset palette or use the custom color picker to match your exact brand identity."
    },
    {
      q: "How do clients pay me?",
      a: "OconPro generates professional documents and secure links. You can include your payment terms or a direct payment link (like Stripe or PayPal) in your Business Settings."
    },
    {
      q: "What happens if I lose my internet connection?",
      a: "The app works offline! Your changes are saved locally and will sync to Google Drive once you're back online."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[48px] p-12 md:p-20 mb-16 text-white shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand/20 to-transparent opacity-50"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-brand/20 text-brand px-4 py-2 rounded-full border border-brand/20 mb-6">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Version 2.5 Pro</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-none">
            Master Your <span className="text-brand">Billing</span> Workflow.
          </h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10">
            OconPro is designed for professionals who value speed, design, and data ownership. 
            Everything you need to manage clients, proposals, and payments in one secure place.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setActiveTutorial(0)}
              className="bg-brand text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-brand/20"
            >
              <PlayCircle size={20} /> Start Tutorial
            </button>
            <a 
              href="mailto:support@oconpro.io"
              className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-white/20 transition-all border border-white/10"
            >
              <Mail size={20} /> Contact Support
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Tutorials Section */}
      <section className="mb-24">
        <div className="flex items-center justify-between mb-10 px-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Interactive Guides</h2>
            <p className="text-slate-500 font-medium">Step-by-step instructions for every feature.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-brand font-bold text-sm">
            <BookOpen size={18} />
            <span>4 Modules Available</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorials.map((tutorial, idx) => (
            <div 
              key={idx}
              className={`group bg-white rounded-[40px] border transition-all duration-500 overflow-hidden ${
                activeTutorial === idx 
                  ? 'border-brand shadow-2xl shadow-brand/5 ring-4 ring-brand/5' 
                  : 'border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200'
              }`}
            >
              <div className="p-8 md:p-10">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    activeTutorial === idx ? 'bg-brand text-white' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {tutorial.icon}
                  </div>
                  <button 
                    onClick={() => setActiveTutorial(activeTutorial === idx ? null : idx)}
                    className={`p-2 rounded-full transition-all ${
                      activeTutorial === idx ? 'bg-brand text-white rotate-90' : 'text-slate-300 hover:text-brand hover:bg-slate-50'
                    }`}
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">{tutorial.title}</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                  {tutorial.description}
                </p>

                {activeTutorial === idx && (
                  <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="h-px bg-slate-100 w-full my-6"></div>
                    {tutorial.steps.map((step, sIdx) => (
                      <div key={sIdx} className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0 text-[10px] font-black">
                          {sIdx + 1}
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ & Support Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight flex items-center gap-3">
              <HelpCircle className="text-brand" /> Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {faqs.map((faq, idx) => (
                <div key={idx} className="space-y-3">
                  <h4 className="font-bold text-slate-800 flex items-start gap-2">
                    <span className="text-brand">Q:</span> {faq.q}
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl">
            <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center mb-6">
              <LifeBuoy size={24} />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tighter">Need Direct Help?</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
              Our support team is available for technical assistance, feature requests, or bug reports.
            </p>
            <div className="space-y-3">
              <a 
                href="mailto:support@oconpro.io"
                className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
              >
                <Mail size={18} /> Email Support
              </a>
              <button className="w-full bg-white/10 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/10">
                <MessageCircle size={18} /> Live Chat
              </button>
            </div>
          </div>

          <div className="bg-brand/5 border border-brand/10 p-8 rounded-[40px]">
            <h4 className="font-bold text-brand mb-2 flex items-center gap-2">
              <Zap size={16} /> Pro Tip
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Use the <code className="bg-white px-1 rounded border border-slate-200">Migration Center</code> to import your existing clients from CSV files in seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-24 text-center">
        <div className="inline-flex items-center gap-3 mb-4 opacity-50">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center font-black text-slate-400">O</div>
          <span className="font-black text-slate-400 tracking-tighter">OconPro Invoicing</span>
        </div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Crafted for the modern professional • © 2026
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
