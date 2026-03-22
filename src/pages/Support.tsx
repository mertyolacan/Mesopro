import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, CheckCircle2, HeadphonesIcon, Clock, Shield, MessageCircle, Lock } from 'lucide-react';
import { createTicket } from '../api';
import { useAuth } from '../AuthContext';
import { SEOHead } from '../components/SEOHead';
import { AuthModal } from '../components/AuthModal';

const CATEGORIES = [
  { value: 'general', label: 'Genel Bilgi' },
  { value: 'order', label: 'Sipariş / Teslimat' },
  { value: 'product', label: 'Ürün Hakkında' },
  { value: 'technical', label: 'Teknik Destek' },
];

const PRIORITIES = [
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
];

export function SupportPage() {
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ id: number } | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const ticket = await createTicket(form);
      setSubmittedTicket(ticket);
    } catch (err: any) {
      setError(err.message || 'Gönderim sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedTicket) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center px-4">
        <SEOHead seoData={null} overrides={{ title: 'Destek Talebi Alındı — MesoPro' }} />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-3">Talebiniz Alındı!</h2>
          <p className="text-surface-500 mb-2">Ticket numaranız: <span className="font-black text-brand-600">#{submittedTicket.id}</span></p>
          <p className="text-sm text-surface-400">En kısa sürede size e-posta ile geri döneceğiz.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 pt-24 pb-16">
      <SEOHead seoData={null} overrides={{ title: 'Destek Merkezi — MesoPro', description: 'MesoPro destek ekibine ulaşın. Sorularınızı, sorunlarınızı ve geri bildirimlerinizi bizimle paylaşın.' }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <HeadphonesIcon size={32} className="text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight mb-3">Destek Merkezi</h1>
          <p className="text-surface-500 text-lg">Sorularınız için buradayız. Size en kısa sürede yanıt vereceğiz.</p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: <Clock size={20} />, title: 'Hızlı Yanıt', desc: 'Ortalama 2 saat içinde yanıt' },
            { icon: <Shield size={20} />, title: 'Güvenli', desc: 'Verileriniz güvende' },
            { icon: <MessageCircle size={20} />, title: 'Uzman Destek', desc: 'Uzman ekibimizle çözüm' },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-surface-900 rounded-3xl p-5 border border-surface-100 dark:border-surface-800 text-center shadow-sm">
              <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-brand-600 dark:text-brand-400">{f.icon}</div>
              <p className="font-bold text-surface-900 dark:text-white text-sm mb-1">{f.title}</p>
              <p className="text-xs text-surface-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Login wall */}
        {!user && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-surface-900 rounded-[2.5rem] border border-surface-100 dark:border-surface-800 shadow-sm p-10 text-center">
            <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Lock size={28} className="text-surface-400" />
            </div>
            <h2 className="text-xl font-black text-surface-900 dark:text-white mb-2">Giriş Yapmanız Gerekiyor</h2>
            <p className="text-sm text-surface-500 mb-6">Destek talebi oluşturmak için üye girişi yapmanız gerekmektedir.</p>
            <button onClick={() => setAuthModalOpen(true)} className="px-8 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-brand-500/20">
              Giriş Yap / Üye Ol
            </button>
            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
          </motion.div>
        )}

        {/* Form */}
        {user && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-surface-900 rounded-[2.5rem] border border-surface-100 dark:border-surface-800 shadow-sm p-8">
          <h2 className="text-xl font-black text-surface-900 dark:text-white mb-6">Destek Talebi Oluştur</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Ad Soyad *</label>
                <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Adınız" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">E-posta *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" placeholder="email@ornek.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Telefon</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" placeholder="+90 5XX XXX XX XX" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Kategori *</label>
                <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Konu *</label>
                <input required type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Talebinizin konusu" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Öncelik</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none">
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Mesajınız *</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none" placeholder="Sorununuzu veya talebinizi ayrıntılı olarak açıklayın..." />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl">{error}</p>}

            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20">
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
              {isSubmitting ? 'Gönderiliyor...' : 'Destek Talebi Gönder'}
            </button>
          </form>
        </motion.div>
        )}
      </div>
    </div>
  );
}
