import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from './api';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await forgotPassword(email);
      setMsg(res.message);
    } catch (err) {
      setMsg('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center bg-surface-50 dark:bg-surface-950 transition-colors duration-500">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md premium-card p-8 sm:p-12 relative overflow-hidden">
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-2 text-surface-400 hover:text-brand-500 transition-colors">
          <ArrowLeft size={20} />
        </button>
        
        <div className="text-center mb-10 mt-4">
          <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="text-brand-600 dark:text-brand-400" size={32} />
          </div>
          <h3 className="text-3xl font-black text-surface-900 dark:text-white mb-3 tracking-tight">Şifremi Unuttum</h3>
          <p className="text-surface-500 dark:text-surface-400 text-sm font-medium">E-posta adresinizi girin, sıfırlama bağlantısı gönderelim.</p>
        </div>

        <AnimatePresence mode="wait">
          {msg ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 bg-brand-500/10 rounded-2xl border border-brand-500/20 glass">
              <CheckCircle className="text-brand-500 mx-auto mb-4" size={48} />
              <p className="text-brand-700 dark:text-brand-400 font-bold mb-6">{msg}</p>
              <button onClick={() => navigate('/')} className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm transition-all shadow-xl shadow-brand-500/20">Anasayfaya Dön</button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2 ml-1">E-posta</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-300" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 h-14 bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all shadow-inner" placeholder="ornek@email.com" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full h-14 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                {loading && <Loader2 size={18} className="animate-spin" />}
                BAĞLANTI GÖNDER
              </button>
            </form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
