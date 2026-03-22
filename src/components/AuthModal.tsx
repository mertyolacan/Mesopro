import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Loader2, Phone, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password, formData.phone);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

const ModalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-start sm:justify-center p-4 overflow-y-auto bg-surface-950/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-surface-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden my-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex p-2 bg-surface-50 dark:bg-surface-950/50">
              <button 
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all ${mode === 'login' ? 'bg-white dark:bg-surface-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'}`}
              >
                Giriş Yap
              </button>
              <button 
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all ${mode === 'register' ? 'bg-white dark:bg-surface-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'}`}
              >
                Kayıt Ol
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-500 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}
              
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">Ad Soyad</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 bg-surface-50 dark:bg-surface-950 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none" 
                        placeholder="Ad Soyad"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">Telefon Numarası</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                      <input 
                        type="tel" 
                        required
                        value={formData.phone}
                        onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 bg-surface-50 dark:bg-surface-950 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none" 
                        placeholder="05XX XXX XX XX"
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">E-posta</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-surface-50 dark:bg-surface-950 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none" 
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">Şifre</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={formData.password}
                      onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 bg-surface-50 dark:bg-surface-950 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none" 
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-brand-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {mode === 'login' && (
                    <div className="flex justify-end mt-1">
                      <button 
                        type="button" 
                        onClick={() => { onClose(); navigate('/forgot-password'); }}
                        className="text-[10px] font-black text-brand-500 hover:text-brand-600 uppercase tracking-widest transition-colors"
                      >
                        Şifremi Unuttum
                      </button>
                    </div>
                  )}
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">Şifre Tekrar</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        required
                        value={formData.confirmPassword}
                        onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                        className="w-full pl-10 pr-12 py-3 bg-surface-50 dark:bg-surface-950 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none" 
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-brand-500 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 mt-6 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(ModalContent, document.body);
};
