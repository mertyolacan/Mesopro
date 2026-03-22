import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronRight, 
  Tag, 
  ShoppingCart,
  Info,
  Check,
  Zap,
  CheckCircle2,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../CartContext';
import { useAuth } from '../../AuthContext';
import { Product, Category } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ShinyButton } from '../ShinyButton';
import { CampaignsModal } from './CampaignsModal';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  products: Product[];
  categories: Category[];
}

export const CartDrawer = ({ isOpen, onClose, onCheckout, products, categories }: CartDrawerProps) => {
  const { cart, updateQuantity, removeFromCart, subtotal, discount, total, incentives, appliedCoupon, applyCoupon, removeCoupon, couponError, activeCampaignIds, campaigns, appliedDiscounts } = useCart();
  const { user } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [isCampaignsModalOpen, setIsCampaignsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    applyCoupon(couponInput);
    setCouponInput('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-white dark:bg-surface-950 shadow-2xl z-[70] flex flex-col border-l border-surface-100 dark:border-surface-900 transition-colors duration-500"
          >
            <div className="p-4 sm:p-6 border-b border-surface-100 dark:border-surface-900 flex items-center justify-between bg-white dark:bg-surface-950 sticky top-0 z-20">
              <h2 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white tracking-tight">Sepetim</h2>
              <button onClick={onClose} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-900 rounded-full transition-colors text-surface-500 dark:text-surface-400">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              
              {/* Unified Campaigns Section */}
              <AnimatePresence mode="popLayout">
                {campaigns && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="mb-6 overflow-hidden px-1"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest flex items-center gap-2">
                        KAMPANYA FIRSATLARI <Zap size={10} className="text-orange-500" />
                      </h3>
                      <button 
                        onClick={() => setIsCampaignsModalOpen(true)}
                        className="text-[9px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors uppercase tracking-tight"
                      >
                        TÜMÜ &gt;
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       {[...campaigns
                         .filter(c => activeCampaignIds.includes(c.id) || (typeof c.id === 'number' && activeCampaignIds.includes(c.id)))
                         .map(c => ({ ...c, isActive: true })),
                         ...incentives.map(inc => {
                           const c = campaigns.find(cam => cam.id === inc.campaignId);
                           return { ...c, isActive: false, neededValue: inc.neededValue, unit: inc.unit };
                         })
                       ]
                       .sort((a, b) => {
                         // Sabit Baraj sıralaması: Küçük barajlılar (kolaylar) en solda
                         const aVal = (a.minAmount || (a.minQuantity || 0) * 1000);
                         const bVal = (b.minAmount || (b.minQuantity || 0) * 1000);
                         return aVal - bVal;
                       })
                       .map((c) => {
                         const benefitText = c.isActive ? '' : (c.type === 'bogo' ? `${c.minQuantity} Al ${c.bogoFreeQuantity || 1} Bedava` : `${c.discountType === 'percentage' ? `%${c.discountValue}` : `${c.discountValue}₺`} İndirim`);
                         return (
                           <motion.div 
                             layout
                             key={`cart-camp-${c.id}`}
                             className={`px-2 py-1.5 rounded-lg border flex flex-col items-center justify-center gap-0.5 shadow-sm text-center transition-colors duration-500 ${c.isActive ? 'bg-brand-500/10 border-brand-500/30 text-brand-700 dark:text-brand-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400'}`}
                           >
                             <span className="text-[8px] font-black uppercase tracking-tight leading-none">
                               {c.isActive ? 'Kazanıldı' : (c.unit === 'currency' ? `+₺${c.neededValue?.toLocaleString()}` : `+${c.neededValue} Adet`)}
                             </span>
                             <span className="text-[7px] font-bold opacity-80 uppercase tracking-tighter leading-none">
                               {c.isActive ? c.name : benefitText}
                             </span>
                           </motion.div>
                         );
                       })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center mt-10 px-6">
                  <div className="w-20 h-20 bg-surface-50 dark:bg-surface-900 rounded-2xl flex items-center justify-center mb-6 shadow-inner relative">
                    <ShoppingCart className="text-surface-300 dark:text-surface-700 relative z-10" size={32} />
                  </div>
                  <p className="text-surface-500 dark:text-surface-400 font-medium text-sm mb-6 text-balance">Sepetiniz şu an boş. Birbirinden kaliteli ürünlerimizi incelemek ister misiniz?</p>
                  <ShinyButton 
                    onClick={() => {
                      onClose();
                      navigate('/products');
                    }}
                    className="w-full justify-center"
                  >
                    Alışverişe Başla <ChevronRight size={18} />
                  </ShinyButton>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Cart Items */}
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <motion.div 
                        layout
                        key={item.product.id}
                        className="bg-surface-50 dark:bg-surface-900/50 p-4 rounded-2xl border border-surface-100 dark:border-surface-800 flex gap-4 group"
                      >
                        <div className="w-20 h-20 bg-white dark:bg-surface-900 rounded-xl overflow-hidden shadow-sm flex-shrink-0 relative">
                          <img src={item.product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-surface-900 dark:text-white truncate pr-2 group-hover:text-brand-600 transition-colors">{item.product.name}</h4>
                            <button onClick={() => removeFromCart(item.product.id)} className="text-surface-400 hover:text-red-500 transition-colors p-1">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-[10px] text-surface-500 dark:text-surface-400 mb-4 font-black uppercase tracking-widest">
                            {item.product.brand} • ₺{item.product.basePrice.toLocaleString()}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-1 shadow-sm">
                              <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500 transition-colors">
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-xs font-black text-surface-900 dark:text-white">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500 transition-colors">
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="text-sm font-black text-surface-900 dark:text-white tracking-tighter">₺{(item.product.basePrice * item.quantity).toLocaleString()}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 sm:p-6 border-t border-surface-100 dark:border-surface-900 bg-surface-50/50 dark:bg-surface-950/50 backdrop-blur-md">
                <div className="space-y-3 mb-6">
                  {/* Coupon Code Toggle */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsCouponOpen(!isCouponOpen)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors mb-2"
                    >
                      <Tag size={12} /> {appliedCoupon ? 'Kupon Uygulandı' : 'Kupon Kodun mu var?'}
                    </button>
                    
                    <AnimatePresence>
                      {isCouponOpen && (
                        <motion.form 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          onSubmit={handleApplyCoupon}
                          className="flex gap-2 mb-4 overflow-hidden"
                        >
                          {appliedCoupon ? (
                            <div className="flex-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 px-4 py-2.5 rounded-xl text-xs font-bold flex justify-between items-center border border-brand-500/20">
                              <span>Kupon: {appliedCoupon}</span>
                              <button type="button" onClick={removeCoupon} className="hover:text-red-500"><X size={14} /></button>
                            </div>
                          ) : (
                            <>
                              <input 
                                type="text" 
                                placeholder="Kupon Kodunu Gir..." 
                                value={couponInput}
                                onChange={e => setCouponInput(e.target.value)}
                                className="flex-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 dark:text-white transition-all shadow-inner"
                              />
                              {user ? (
                                <button type="submit" className="px-4 py-2.5 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">EKLE</button>
                              ) : (
                                <div className="group relative">
                                  <button type="button" className="px-4 py-2.5 bg-surface-200 dark:bg-surface-800 text-surface-500 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed transition-all">EKLE</button>
                                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-red-600 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-bold shadow-xl">
                                    Kupon kullanmak için lütfen önce giriş yapınız.
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </motion.form>
                      )}
                    </AnimatePresence>
                    {couponError && <p className="text-[10px] text-red-500 font-bold mb-2 ml-1">{couponError}</p>}
                  </div>

                  <div className="flex justify-between text-xs font-bold text-surface-500 dark:text-surface-400">
                    <span>Ara Toplam</span>
                    <span className="text-surface-900 dark:text-white">₺{subtotal.toLocaleString()}</span>
                  </div>
                  {appliedDiscounts.length > 0 && (
                    <div className="space-y-2">
                      {appliedDiscounts.map((ad) => (
                        <div key={ad.id} className="flex justify-between text-xs font-black text-brand-600 dark:text-brand-400">
                          <div className="flex items-center gap-1">
                            <span>{ad.name}</span>
                            <div className="w-4 h-4 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center cursor-help group relative">
                               <Info size={10} className="text-brand-600 dark:text-brand-400" />
                               <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-surface-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-medium">
                                  {ad.description || 'Bu kampanya sepetinize otomatik olarak uygulanmıştır.'}
                               </div>
                            </div>
                          </div>
                          <span>-₺{ad.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-black text-surface-900 dark:text-white pt-3 border-t border-surface-100 dark:border-surface-900">
                    <span>Toplam</span>
                    <span className="tracking-tighter">₺{total.toLocaleString()}</span>
                  </div>
                </div>

                <ShinyButton 
                  onClick={() => { onClose(); onCheckout(); }}
                  className="w-full justify-center py-5 shadow-2xl shadow-brand-500/20"
                >
                  Siparişi Tamamla <ChevronRight size={18} strokeWidth={3} />
                </ShinyButton>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Campaigns Modal */}
      <CampaignsModal 
        isOpen={isCampaignsModalOpen} 
        onClose={() => setIsCampaignsModalOpen(false)} 
        campaigns={campaigns}
        activeCampaignIds={activeCampaignIds}
        products={products}
        categories={categories}
      />
    </AnimatePresence>
  );
};
