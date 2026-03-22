import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Mail, Phone, Send, X, MessageSquare, CheckCircle2 } from 'lucide-react';
import { sendMessage, getSettings } from './api';

export const ContactMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [contactSettings, setContactSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    getSettings().then(setContactSettings).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await sendMessage(formData);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        setShowForm(false);
        setFormData({ name: '', email: '', phone: '', message: '' });
      }, 2000);
    } catch (err) {
      alert("Mesaj gönderilemedi, lütfen tekrar deneyin.");
    } finally {
      setIsSending(false);
    }
  };

  const waNumber = contactSettings.whatsapp_number || '905000000000';
  const waGreeting = contactSettings.whatsapp_greeting || 'Merhaba, bilgi almak istiyorum.';
  const email = contactSettings.contact_email || 'info@mezopro.com';
  const phone = contactSettings.contact_phone || '+905000000000';

  const contactOptions = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={20} />,
      href: `https://wa.me/${waNumber}?text=${encodeURIComponent(waGreeting)}`,
      color: 'bg-green-500',
    },
    {
      name: 'E-posta',
      icon: <Mail size={20} />,
      href: `mailto:${email}`,
      color: 'bg-blue-500',
    },
    {
      name: 'Telefon',
      icon: <Phone size={20} />,
      href: `tel:${phone}`,
      color: 'bg-surface-700',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="flex flex-col gap-3 mb-2"
          >
            {contactOptions.map((option) => (
              <motion.a
                key={option.name}
                href={option.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ x: -5 }}
                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-surface-900 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-800 group transition-all"
              >
                <div className={`w-10 h-10 ${option.color} text-white rounded-xl flex items-center justify-center shadow-lg`}>
                  {option.icon}
                </div>
                <span className="text-sm font-bold text-surface-900 dark:text-white">{option.name}</span>
              </motion.a>
            ))}
            
            <motion.button
              whileHover={{ x: -5 }}
              onClick={() => setShowForm(true)}
              className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-surface-900 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-800 group transition-all"
            >
              <div className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare size={20} />
              </div>
              <span className="text-sm font-bold text-surface-900 dark:text-white">Hızlı Form</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all border ${
          isOpen 
            ? 'bg-surface-900 dark:bg-white text-white dark:text-surface-900 border-surface-800 dark:border-surface-200' 
            : 'bg-brand-600 text-white border-brand-400/20'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-white dark:bg-surface-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setShowForm(false)}
                className="absolute top-6 right-6 p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors text-surface-500"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Hızlı İletişim</h3>
              <p className="text-surface-500 dark:text-surface-400 mb-8 text-sm">Size en kısa sürede dönüş yapacağız.</p>

              {sentSuccess ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Mesajınız Alındı</h4>
                  <p className="text-surface-500 text-center text-sm">En kısa sürede e-posta adresiniz üzerinden dönüş yapacağız.</p>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-1.5 ml-1">Ad Soyad</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-4 bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-surface-900 dark:text-white"
                      placeholder="Adınız Soyadınız"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-1.5 ml-1">E-posta</label>
                      <input 
                        type="email" 
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-5 py-4 bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-surface-900 dark:text-white"
                        placeholder="ornek@mail.com"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-1.5 ml-1">Telefon</label>
                      <input 
                        type="tel" 
                        required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-5 py-4 bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-surface-900 dark:text-white"
                        placeholder="0555 555 55 55"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-1.5 ml-1">Mesajınız</label>
                    <textarea 
                      required
                      rows={4}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-5 py-4 bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-surface-900 dark:text-white resize-none"
                      placeholder="Nasıl yardımcı olabiliriz?"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSending}
                    className="w-full py-5 bg-brand-600 text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-600/20 disabled:opacity-50"
                  >
                    {isSending ? 'Gönderiliyor...' : 'Gönder'} {!isSending && <Send size={18} />}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
