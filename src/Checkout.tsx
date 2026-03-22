import React, { useState } from 'react';
import { Check, CreditCard, Truck, ShieldCheck, ChevronRight, ChevronLeft, Moon, Sun, X, ShoppingBag, Loader2, ArrowLeft, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { ShinyButton } from './components/ShinyButton';
import { createOrder } from './api';


const steps = [
  { id: 'cart', label: 'Sepet', icon: <ShoppingBag size={18} /> },
  { id: 'shipping', label: 'Teslimat', icon: <Truck size={18} /> },
  { id: 'payment', label: 'Ödeme', icon: <CreditCard size={18} /> },
  { id: 'confirm', label: 'Onay', icon: <ShieldCheck size={18} /> }
];

export const Checkout = ({ theme, toggleTheme }: { theme: 'light' | 'dark'; toggleTheme: () => void }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pay_later'>('pay_later');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const { total, subtotal, discount, cart, clearCart, activeCampaignIds, appliedDiscounts, incentives, refreshCampaigns } = useCart();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = async () => {
    if (currentStep === 3) {
      setIsSubmitting(true);
      const newOrderId = `MP-${Math.floor(100000 + Math.random() * 900000)}`;
      try {
        await createOrder({
          id: newOrderId,
          userId: user?.id,
          customerName: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          items: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            productBrand: item.product.brand,
            quantity: item.quantity,
            price: item.product.basePrice,
          })),
          total,
          appliedCampaigns: activeCampaignIds,
          paymentMethod,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
        setOrderId(newOrderId);
        setCurrentStep(4);
        clearCart();
        refreshCampaigns();
      } catch (error) {
        console.error('Order creation error:', error);
        alert('Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  if (currentStep === 4) {
    return (
      <div className="min-h-screen bg-white dark:bg-surface-950 flex items-center justify-center p-4 transition-colors duration-500">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-24 h-24 bg-brand-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-500/20">
            <Check size={48} strokeWidth={3} />
          </div>
          <h2 className="text-4xl font-black text-surface-900 dark:text-white mb-4 tracking-tight">Siparişiniz Alındı!</h2>
          <p className="text-surface-500 dark:text-surface-400 mb-10 leading-relaxed">Sipariş numaranız: <span className="text-surface-900 dark:text-white font-bold">#{orderId}</span>. Detaylar e-posta adresinize gönderildi.</p>
          <ShinyButton 
            onClick={() => navigate('/')}
            className="w-full justify-center py-5"
          >
            Alışverişe Devam Et
          </ShinyButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-500">
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 pt-6 sm:pt-10 pb-12 sm:pb-20">
        <div className="flex items-center justify-between gap-4 mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-surface-400 hover:text-brand-500 transition-colors uppercase tracking-widest group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Geri Dön
          </button>
          
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 bg-white dark:bg-surface-900 rounded-xl flex items-center justify-center shadow-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-all"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-20">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[9px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest">
              <Link to="/" className="hover:text-brand-500 transition-colors">Ana Sayfa</Link>
              <span className="text-surface-200 dark:text-surface-800">/</span>
              <span className="text-brand-600 dark:text-brand-400">Ödeme & Onay</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-surface-900 dark:text-white tracking-tighter leading-tight">Kasa</h1>
            <p className="text-surface-500 dark:text-surface-400 text-sm font-medium mt-1">Siparişinizi tamamlamak için bilgilerinizi girin.</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-12 sm:mb-20 relative max-w-3xl mx-auto px-2">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-200 dark:bg-surface-800 -translate-y-1/2 z-0" />
          {steps.map((step, i) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 sm:gap-4">
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center transition-all duration-700 ${i <= currentStep ? 'bg-surface-900 dark:bg-white text-white dark:text-surface-900 shadow-2xl shadow-surface-900/20 dark:shadow-white/10 scale-110' : 'bg-white dark:bg-surface-900 text-surface-300 dark:text-surface-700 border border-surface-200 dark:border-surface-800'}`}>
                {i < currentStep ? <Check size={18} strokeWidth={3} className="sm:w-6 sm:h-6" /> : React.cloneElement(step.icon as React.ReactElement, { size: 16, className: "sm:w-[18px] sm:h-[18px]" })}
              </div>
              <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-[0.2em] ${i <= currentStep ? 'text-surface-900 dark:text-white' : 'text-surface-300 dark:text-surface-700'}`}>{step.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div 
                  key="shipping"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-surface-900 p-6 sm:p-10 md:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-sm border border-surface-100 dark:border-surface-800 transition-colors duration-500"
                >
                  <div className="flex items-center gap-4 mb-8 sm:mb-10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-100 dark:bg-surface-800 rounded-xl sm:rounded-2xl flex items-center justify-center text-surface-900 dark:text-white">
                      <Truck size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white tracking-tight">Teslimat Bilgileri</h3>
                  </div>
                  
                    <div className="grid grid-cols-2 gap-6 sm:gap-8">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-3 sm:mb-4">Ad Soyad</label>
                        <input name="name" value={formData.name} onChange={handleInputChange} type="text" className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-sm focus:ring-2 focus:ring-surface-400 dark:text-white transition-all" placeholder="John Doe" required />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-3 sm:mb-4">E-posta</label>
                        <input name="email" value={formData.email} onChange={handleInputChange} type="email" className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-sm focus:ring-2 focus:ring-surface-400 dark:text-white transition-all" placeholder="john@example.com" required />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-3 sm:mb-4">Telefon Numarası</label>
                        <input name="phone" value={formData.phone} onChange={handleInputChange} type="tel" className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-sm focus:ring-2 focus:ring-surface-400 dark:text-white transition-all" placeholder="05XX XXX XX XX" required />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-3 sm:mb-4">Adres</label>
                        <textarea name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-sm focus:ring-2 focus:ring-surface-400 dark:text-white transition-all h-32 sm:h-40 resize-none" placeholder="Adres detayları..." required></textarea>
                      </div>
                    </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div 
                  key="payment"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-surface-900 p-6 sm:p-10 md:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-sm border border-surface-100 dark:border-surface-800 transition-colors duration-500"
                >
                  <div className="flex items-center gap-4 mb-8 sm:mb-10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-100 dark:bg-surface-800 rounded-xl sm:rounded-2xl flex items-center justify-center text-surface-900 dark:text-white">
                      <CreditCard size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white tracking-tight">Ödeme Yöntemi</h3>
                  </div>

                  <div className="space-y-4 sm:space-y-6 mb-10 sm:mb-12">
                    <div 
                      onClick={() => setPaymentMethod('pay_later')}
                      className={`p-6 sm:p-8 border-2 rounded-2xl sm:rounded-[2rem] flex items-center justify-between transition-all group cursor-pointer ${paymentMethod === 'pay_later' ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/5' : 'border-surface-100 dark:border-surface-800 hover:border-surface-200 dark:hover:border-surface-700'}`}
                    >
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-all ${paymentMethod === 'pay_later' ? 'bg-brand-500 text-white shadow-brand-500/20' : 'bg-surface-100 dark:bg-surface-800 text-surface-400'}`}>
                          <Truck size={24} className="sm:w-7 sm:h-7" />
                        </div>
                        <div>
                          <p className={`text-base sm:text-lg font-bold ${paymentMethod === 'pay_later' ? 'text-surface-900 dark:text-white' : 'text-surface-400'}`}>Sipariş Kaydı Oluştur</p>
                          <p className="text-[10px] sm:text-xs text-surface-500 dark:text-surface-400 font-medium">Kapıda Ödeme / Havale Seçeneğiyle</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 flex items-center justify-center transition-all ${paymentMethod === 'pay_later' ? 'border-brand-500 bg-white dark:bg-surface-900' : 'border-surface-200 dark:border-surface-800'}`}>
                        {paymentMethod === 'pay_later' && <div className="w-2 h-2 sm:w-3 sm:h-3 bg-brand-500 rounded-full" />}
                      </div>
                    </div>

                    <div 
                      onClick={() => setPaymentMethod('card')}
                      className={`p-6 sm:p-8 border-2 rounded-2xl sm:rounded-[2rem] flex items-center justify-between transition-all group cursor-pointer ${paymentMethod === 'card' ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/5' : 'border-surface-100 dark:border-surface-800 hover:border-surface-200 dark:hover:border-surface-700'}`}
                    >
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-all ${paymentMethod === 'card' ? 'bg-brand-500 text-white shadow-brand-500/20' : 'bg-surface-100 dark:bg-surface-800 text-surface-400'}`}>
                          <CreditCard size={24} className="sm:w-7 sm:h-7" />
                        </div>
                        <div>
                          <p className={`text-base sm:text-lg font-bold ${paymentMethod === 'card' ? 'text-surface-900 dark:text-white' : 'text-surface-400'}`}>Kredi Kartı</p>
                          <p className="text-[10px] sm:text-xs text-surface-500 dark:text-surface-400 font-medium">Iyzico / 3D Secure Güvencesiyle</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 flex items-center justify-center transition-all ${paymentMethod === 'card' ? 'border-brand-500 bg-white dark:bg-surface-900' : 'border-surface-200 dark:border-surface-800'}`}>
                        {paymentMethod === 'card' && <div className="w-2 h-2 sm:w-3 sm:h-3 bg-brand-500 rounded-full" />}
                      </div>
                    </div>
                  </div>
                  
                  {paymentMethod === 'card' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6 sm:space-y-8"
                    >
                      <div>
                        <label className="block text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-3 sm:mb-4">Kart Numarası</label>
                        <input type="text" className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-sm focus:ring-2 focus:ring-surface-400 dark:text-white transition-all" placeholder="0000 0000 0000 0000" />
                      </div>
                      <div className="grid grid-cols-2 gap-6 sm:gap-8">
                        <div>
                          <label className="block text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-3 sm:mb-4">Son Kullanma</label>
                          <input type="text" className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-sm focus:ring-2 focus:ring-surface-400 dark:text-white transition-all" placeholder="AA / YY" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-3 sm:mb-4">CVV</label>
                          <input type="text" className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-sm focus:ring-2 focus:ring-surface-400 dark:text-white transition-all" placeholder="000" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {paymentMethod === 'pay_later' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-6 sm:p-8 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700"
                    >
                      <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                        Siparişiniz <span className="text-surface-900 dark:text-white font-bold">Ön Ödemesiz</span> olarak kaydedilecektir. Müşteri temsilcimiz onay için sizinle iletişime geçecektir. Ödemenizi kapıda veya havale ile yapabilirsiniz.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div 
                  key="confirm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-surface-900 p-6 sm:p-10 md:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-sm border border-surface-100 dark:border-surface-800 transition-colors duration-500"
                >
                  <div className="flex items-center gap-4 mb-8 sm:mb-10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-100 dark:bg-surface-800 rounded-xl sm:rounded-2xl flex items-center justify-center text-surface-900 dark:text-white">
                      <ShieldCheck size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white tracking-tight">Sipariş Onayı</h3>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Teslimat Adresi</h4>
                        <div className="p-5 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-800">
                          <p className="font-bold text-sm text-surface-900 dark:text-white mb-1">{formData.name}</p>
                          <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">{formData.address}</p>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">{formData.phone} | {formData.email}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Ödeme Yöntemi</h4>
                        <div className="p-5 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-800">
                          <p className="font-bold text-sm text-surface-900 dark:text-white flex items-center gap-2">
                            {paymentMethod === 'card' ? <CreditCard size={16} /> : <Truck size={16} />}
                            {paymentMethod === 'card' ? 'Kredi Kartı' : 'Kapıda Ödeme / Havale'}
                          </p>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                            {paymentMethod === 'card' ? 'Iyzico Güvenli Ödeme' : 'Onay sonrası hazırlık başlar'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-surface-100 dark:border-surface-800">
                      <p className="text-xs text-surface-500 dark:text-surface-400 text-center italic">
                        "Siparişi Tamamla" butonuna basarak Mesopro Sipariş Koşullarını kabul etmiş olursunuz.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 pt-4">
              <button 
                onClick={prevStep}
                disabled={currentStep === 1}
                className="w-full sm:w-auto px-10 py-5 text-surface-400 dark:text-surface-500 font-black text-xs uppercase tracking-widest hover:text-surface-900 dark:hover:text-white disabled:opacity-0 transition-all"
              >
                GERİ DÖN
              </button>
              <ShinyButton 
                onClick={nextStep}
                disabled={isSubmitting || (currentStep === 1 && (!formData.name || !formData.email || !formData.phone || !formData.address))}
                className="w-full sm:w-auto px-14 py-6 justify-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    {currentStep === 3 
                      ? (paymentMethod === 'pay_later' ? 'Siparişi Tamamla & Onayla' : 'Ödemeyi Yap & Tamamla') 
                      : 'Sonraki Adım'} <ChevronRight size={18} strokeWidth={3} />
                  </>
                )}
              </ShinyButton>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-12">
            <div className="bg-white dark:bg-surface-900 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-surface-100 dark:border-surface-800 shadow-sm transition-colors duration-500">
              <h4 className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-6 sm:mb-8">Sipariş Özeti</h4>

              {(appliedDiscounts.length > 0 || incentives.length > 0) && (
                <div className="mb-6 space-y-3">
                  <p className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest flex items-center gap-2">
                    Kampanya Fırsatları <Zap size={10} className="text-orange-500" />
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {appliedDiscounts.map(ad => (
                      <div key={ad.id} className="px-2 py-1.5 rounded-lg border flex items-center justify-center gap-1 shadow-sm text-center transition-colors duration-500 bg-brand-500/10 border-brand-500/30 text-brand-700 dark:text-brand-400">
                        <div className="flex flex-col items-center justify-center leading-none py-0.5">
                          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tight mb-0.5">Kazanıldı</span>
                          <span className="text-[7px] sm:text-[8px] font-bold opacity-80 uppercase tracking-tighter">{ad.name}</span>
                        </div>
                      </div>
                    ))}
                    {incentives.map(inc => (
                      <div key={inc.campaignId} className="px-2 py-1.5 rounded-lg border flex items-center justify-center gap-1 shadow-sm text-center transition-colors duration-500 bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400">
                        <div className="flex flex-col items-center justify-center leading-none py-0.5">
                          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tight mb-0.5">
                            {inc.unit === 'currency' ? `+₺${inc.neededValue.toLocaleString()}` : `+${inc.neededValue} Adet`}
                          </span>
                          <span className="text-[7px] sm:text-[8px] font-bold opacity-80 uppercase tracking-tighter">{inc.benefit} İndirim</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10 max-h-60 sm:max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm items-start group">
                    <div className="flex-1">
                      <span className="text-surface-900 dark:text-white font-bold block line-clamp-1 mb-1 group-hover:text-brand-500 transition-colors">{item.product.name}</span>
                      <span className="text-surface-500 dark:text-surface-400 text-[10px] font-black uppercase tracking-wider">{item.quantity} ADET × ₺{item.product.basePrice.toLocaleString()}</span>
                    </div>
                    <span className="font-black text-surface-900 dark:text-white ml-4 tracking-tighter">₺{(item.product.basePrice * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-4 pt-8 border-t border-surface-100 dark:border-surface-800">
                <div className="flex justify-between text-xs font-bold text-surface-500 dark:text-surface-400">
                  <span>Ara Toplam</span>
                  <span className="text-surface-900 dark:text-white">₺{subtotal.toLocaleString()}</span>
                </div>
                {appliedDiscounts.length > 0 && (
                  <div className="space-y-2">
                    {appliedDiscounts.map((ad) => (
                      <div key={ad.id} className="flex justify-between text-xs text-brand-600 dark:text-brand-400 font-black">
                        <span>{ad.name}</span>
                        <span>-₺{ad.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between text-2xl font-black text-surface-900 dark:text-white pt-6 border-t border-surface-100 dark:border-surface-800">
                  <span>Toplam</span>
                  <span className="tracking-tighter">₺{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-surface-900 dark:bg-brand-500 text-white p-10 rounded-[3rem] shadow-2xl shadow-surface-900/10 dark:shadow-brand-500/10 transition-colors duration-500 group">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-12 h-12 bg-white/10 dark:bg-surface-900/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="text-brand-400 dark:text-surface-900" size={24} />
                </div>
                <h5 className="font-bold tracking-tight text-lg">Güvenli Ödeme</h5>
              </div>
              <p className="text-xs text-surface-400 dark:text-surface-900/70 leading-relaxed font-medium">
                Ödemeleriniz 256-bit SSL sertifikası ile şifrelenmektedir. Kart bilgileriniz sistemimizde saklanmaz.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
