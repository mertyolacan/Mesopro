import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Loader2, CheckCircle, ShieldCheck, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from './api';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Geçersiz sıfırlama bağlantısı.');
    }
  }, [token, email]);

  const strength = formData.password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strength) return setError('Şifre en az 8 karakter olmalıdır.');
    if (formData.password !== formData.confirm) return setError('Şifreler eşleşmiyor.');
    
    setLoading(true);
    setError('');
    try {
      await resetPassword({ email: email!, token: token!, newPassword: formData.password });
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center bg-surface-50 dark:bg-surface-950 transition-colors duration-500">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md premium-card p-8 sm:p-12 relative">
        <div className="text-center mb-10 mt-4">
          <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-brand-600 dark:text-brand-400" size={32} />
          </div>
          <h3 className="text-3xl font-black text-surface-900 dark:text-white mb-3 tracking-tight">Yeni Şifre Oluştur</h3>
          <p className="text-surface-500 dark:text-surface-400 text-sm font-medium">Lütfen yeni ve güçlü bir şifre belirleyin.</p>
        </div>

        {success ? (
          <div className="text-center p-6 bg-brand-500/10 rounded-2xl border border-brand-500/20 glass">
            <CheckCircle className="text-brand-500 mx-auto mb-4" size={48} />
            <p className="text-brand-700 dark:text-brand-400 font-bold mb-2">Şifreniz Güncellendi!</p>
            <p className="text-surface-500 text-sm">Giriş yapmanız için yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-500 text-red-600 dark:text-red-400 text-xs rounded-xl font-bold">{error}</div>}
            
            <div>
              <label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2 ml-1">Yeni Şifre</label>
              <div className="relative mb-2">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-300" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={formData.password} 
                  onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} 
                  className="w-full pl-12 pr-12 h-14 bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none shadow-inner" 
                  placeholder="••••••••" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-tight ${strength ? 'text-green-500' : 'text-surface-400'}`}>
                {strength ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                {strength ? 'Güçlü Şifre' : 'En az 8 karakter'}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2 ml-1">Şifre Tekrar</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-300" />
                <input 
                  type={showConfirm ? 'text' : 'password'} 
                  required 
                  value={formData.confirm} 
                  onChange={e => setFormData(p => ({ ...p, confirm: e.target.value }))} 
                  className="w-full pl-12 pr-12 h-14 bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none shadow-inner" 
                  placeholder="••••••••" 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !!error && error.includes('bağlantı')} className="w-full h-14 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {loading && <Loader2 size={18} className="animate-spin" />}
              ŞİFREYİ GÜNCELLE
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
