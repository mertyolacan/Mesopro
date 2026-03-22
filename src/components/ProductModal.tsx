import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, CheckCircle2, ShieldCheck, Zap, Store, Truck, Plus, Minus, ChevronRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { useFavorites } from '../FavoritesContext';
import { useAuth } from '../AuthContext';
import { ShinyButton } from './ShinyButton';
import { Countdown, Badge } from './shared';

export const ProductModal = ({ product, onClose }: { product: Product | null; onClose: () => void }) => {
  const navigate = useNavigate();
  const { cart, addToCart, activeCampaignIds, campaigns = [] } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ingredients' | 'indications' | 'area' | 'warnings'>('ingredients');
  const [quantity, setQuantity] = useState(1);
  const favorited = product ? isFavorite(product.id) : false;

  // Real-time Simulation Logic
  const sim = useMemo(() => {
    if (!product) return { qty: 0, amount: 0, productQty: 0 };
    const existingInCart = cart.find(item => item.product.id === product.id);
    const existingQty = existingInCart?.quantity || 0;
    const currentTotalQtyForProduct = quantity + existingQty;
    
    let otherProductsQty = 0;
    let otherProductsAmount = 0;
    cart.forEach(item => {
      if (item.product.id !== product.id) {
        otherProductsQty += item.quantity;
        otherProductsAmount += item.product.basePrice * item.quantity;
      }
    });

    return {
      qty: otherProductsQty + currentTotalQtyForProduct,
      amount: otherProductsAmount + (currentTotalQtyForProduct * product.basePrice),
      productQty: currentTotalQtyForProduct
    };
  }, [cart, quantity, product]);

  // Predictive Active Campaigns (What WILL be active)
  const activeProductCampaigns = useMemo(() => {
    if (!product || !campaigns) return [];
    return campaigns.filter(c => {
      // Bütün kampanyalar için ortak alt limit (minAmount) kontrolü (CartContext ile uyumlu)
      if (sim.amount < c.minAmount) return false;

      // Sadece bu ürünle alakalı veya genel kampanyaları kontrol et
      const isRelated = !c.targetValue || 
                        (c.type === 'product' && c.targetValue === product.id) || 
                        (c.type === 'category' && c.targetValue === product.category) ||
                        (c.type === 'volume' || c.type === 'cart_total' || c.type === 'bogo');
      if (!isRelated) return false;

      // Kampanya tipine göre özel koşul kontrolü
      if (c.type === 'volume') return sim.qty >= c.minQuantity;
      if (c.type === 'cart_total') return true; // minAmount zaten yukarıda kontrol edildi
      if (c.type === 'bogo') {
         const isMatch = !c.targetValue || c.targetValue === product.id || c.targetValue === product.category;
         return isMatch && sim.productQty >= c.minQuantity;
      }
      if (c.type === 'product' || c.type === 'category') {
         // Ürün/Kategori bazlı kampanyalar için miktar kontrolü (Genellikle 1'dir)
         return quantity >= c.minQuantity; 
      }
      return false;
    });
  }, [product, campaigns, sim, quantity]);

  // Predictive Incentives (What is NEXT)
  const previewIncentives = useMemo(() => {
    if (!product) return [];
    
    return campaigns
      .filter(c => {
        // Zaten uygulanmış (tahminen) kampanyaları ele
        const willBeActive = activeProductCampaigns.some(pa => pa.id === c.id);
        if (willBeActive && c.type !== 'volume' && c.type !== 'cart_total' && c.type !== 'bogo') {
          return false;
        }
        
        const isRelatedToProduct = !c.targetValue || 
                                   (c.type === 'product' && c.targetValue === product.id) || 
                                   (c.type === 'category' && c.targetValue === product.category) ||
                                   (c.type === 'volume' || c.type === 'cart_total' || c.type === 'bogo');
        return isRelatedToProduct;
      })
      .map(c => {
        let neededValue = 0;
        let unit: 'items' | 'currency' = 'items';
        let benefitText = '';

        if (c.type === 'volume') {
          neededValue = c.minQuantity - sim.qty;
          unit = 'items';
          benefitText = `${c.discountType === 'percentage' ? `%${c.discountValue}` : `₺${c.discountValue}`} indirim`;
        } else if (c.type === 'cart_total') {
          neededValue = c.minAmount - sim.amount;
          unit = 'currency';
          benefitText = `${c.discountType === 'percentage' ? `%${c.discountValue}` : `₺${c.discountValue}`} indirim`;
        } else if (c.type === 'bogo') {
          const isMatch = !c.targetValue || c.targetValue === product.id || c.targetValue === product.category;
          if (isMatch) {
            neededValue = c.minQuantity - sim.productQty;
            unit = 'items';
            benefitText = `${c.discountValue} adet hediye`;
          }
        } else if (c.type === 'product' || c.type === 'category') {
          neededValue = 1;
          unit = 'items';
          benefitText = `${c.discountType === 'percentage' ? `%${c.discountValue}` : `₺${c.discountValue}`} indirim`;
        }

        return { ...c, neededValue, unit, benefitText };
      })
      .filter(c => c.neededValue > 0)
      .sort((a, b) => {
        if (a.unit === b.unit) return a.neededValue - b.neededValue;
        return a.unit === 'items' ? -1 : 1;
      })
      .slice(0, 3);
  }, [sim, product, campaigns, activeProductCampaigns]);

  const campaign = useMemo(() => {
    if (!product || !campaigns) return null;
    return campaigns.find(c => 
      c.endDate && (
        (c.type === 'product' && c.targetValue === product.id) ||
        (c.type === 'category' && c.targetValue === product.category)
      )
    );
  }, [product, campaigns]);

  if (!product) return null;

  const getModalBadgeStyle = (badge?: string | null) => {
    switch(badge) {
      case 'Popüler': return 'text-purple-600 dark:text-purple-400';
      case 'İndirim': return 'text-green-600 dark:text-green-400';
      case 'Yeni': return 'text-blue-600 dark:text-blue-400';
      case 'Çok Satan': return 'text-orange-600 dark:text-orange-400';
      case 'Özel Teklif': return 'text-rose-600 dark:text-rose-400';
      default: return 'text-brand-600 dark:text-brand-400';
    }
  };

  const tabs = [
    { id: 'ingredients', label: 'İçerik', content: product.ingredients, icon: <Zap size={14} /> },
    { id: 'indications', label: 'Endikasyon', content: product.indications, icon: <CheckCircle2 size={14} /> },
    { id: 'area', label: 'Uygulama', content: product.applicationArea, icon: <ShoppingBag size={14} /> },
    { id: 'warnings', label: 'Uyarılar', content: product.warnings, icon: <ShieldCheck size={14} /> }
  ];

  return (
    <AnimatePresence mode="wait">
      {product && (
        <motion.div 
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-surface-950/80 backdrop-blur-xl z-[100] flex items-center justify-center sm:p-6"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-surface-950 w-full max-w-6xl sm:rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-full sm:h-auto sm:max-h-[85vh] border border-white/10 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button - Desktop */}
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 p-3 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-full transition-all text-surface-900 dark:text-white z-50 hidden md:flex items-center justify-center shadow-xl hover:rotate-90"
            >
              <X size={24} />
            </button>

            {/* Image Section */}
            <div className="h-[40vh] md:h-auto md:w-[45%] bg-surface-50 dark:bg-surface-900 relative flex-shrink-0 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent opacity-50" />
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover relative z-10"
                referrerPolicy="no-referrer"
              />
              {product.featuredBadge && (
                <div className="absolute top-8 left-8 py-2 px-5 bg-white/90 dark:bg-surface-800/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl z-20">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${getModalBadgeStyle(product.featuredBadge)}`}>{product.featuredBadge}</span>
                </div>
              )}
              
              {/* Close Button - Mobile */}
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2.5 bg-white/90 dark:bg-surface-900/90 backdrop-blur rounded-full shadow-lg text-surface-900 dark:text-white z-50 md:hidden"
              >
                <X size={20} />
              </button>

              <div className="absolute bottom-8 left-8 flex flex-col gap-2 z-10">
                <Badge className="bg-white/90 dark:bg-surface-900/90 backdrop-blur-md text-surface-900 dark:text-white shadow-xl border border-white/20 font-black px-4 py-1.5 text-xs uppercase tracking-widest">{product.brand}</Badge>
                {campaign?.endDate && <Countdown endDate={campaign.endDate} />}
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-8 sm:p-10 md:p-16 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="flex-1 max-w-2xl mx-auto w-full">
                <div className="flex justify-between items-start mb-6 gap-4">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-surface-900 dark:text-white tracking-tight leading-[1.1]">{product.name}</h2>
                  <button 
                    onClick={() => {
                      if (product) toggleFavorite(product);
                    }}
                    className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-surface-50 dark:bg-surface-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm hover:scale-110 transition-all border border-surface-200 dark:border-surface-800"
                  >
                    <Heart 
                      size={20} 
                      className={`transition-colors duration-300 ${favorited ? 'fill-red-500 text-red-500' : 'text-surface-400 dark:text-surface-500'}`} 
                    />
                  </button>
                </div>
                
                {/* Campaigns & Incentives Section */}
                <div className="space-y-4 mb-8">
                  <AnimatePresence mode="popLayout">
                    {previewIncentives.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2"
                      >
                         <h3 className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest flex items-center justify-center gap-2 mb-2">
                           FIRSATLARI KAÇIRMA <Zap size={10} className="text-orange-500" />
                         </h3>
                         <div className="flex flex-wrap justify-center gap-1.5">
                           {previewIncentives.map((inc) => (
                             <motion.div 
                               layout
                               key={inc.id} 
                               className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-900 dark:text-orange-100 py-1 px-2.5 rounded-lg flex items-center group relative cursor-default"
                             >
                               <div className="flex items-center gap-1.5 relative z-10">
                                 <div className="text-orange-500 dark:text-orange-400 flex-shrink-0">
                                    <Zap size={10} strokeWidth={3} />
                                 </div>
                                 <span className="text-[9px] leading-none">
                                   <span className="font-black">
                                     {inc.unit === 'currency' ? `₺${inc.neededValue.toLocaleString()}` : `${inc.neededValue} adet`}
                                   </span> ekle, <span className="font-black text-orange-600 dark:text-orange-400">{inc.benefitText}</span> kazan!
                                 </span>
                               </div>
                             </motion.div>
                           ))}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {activeProductCampaigns.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {activeProductCampaigns.map(c => (
                        <div key={c.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500/5 border border-brand-500/20 rounded-full">
                          <div className="w-1 h-1 rounded-full bg-brand-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">{c.name} Uygulandı</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-10 space-y-6">
                  {/* Cart-Style Product Preview Card */}
                  <div className="bg-surface-50 dark:bg-surface-900/50 p-4 rounded-2xl border border-surface-100 dark:border-surface-800 flex gap-4 group">
                    <div className="w-20 h-20 bg-white dark:bg-surface-900 rounded-xl overflow-hidden shadow-sm flex-shrink-0 relative">
                      <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-surface-900 dark:text-white truncate pr-2">{product.name}</h4>
                      </div>
                      <p className="text-[10px] text-surface-500 dark:text-surface-400 mb-2 font-black uppercase tracking-widest leading-none">
                        {product.brand} • ₺{product.basePrice.toLocaleString()}
                      </p>
                      <div className="flex items-center justify-between">
                        {/* Integrated Quantity Selector (Cart Style) */}
                        <div className="flex items-center bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-1 shadow-sm">
                          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500 transition-colors">
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-surface-900 dark:text-white">{quantity}</span>
                          <button onClick={() => setQuantity(quantity + 1)} className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500 transition-colors">
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                        <span className="text-sm font-black text-surface-900 dark:text-white tracking-tighter">₺{(product.basePrice * quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Section (Cart Summary Style) */}
                  <div className="space-y-3 px-1">
                    <div className="flex justify-between items-center text-xs font-bold text-surface-400">
                      <span>Ara Toplam</span>
                      <span className="text-surface-900 dark:text-white">₺{((cart.reduce((acc, item) => acc + (item.product.basePrice * item.quantity), 0)) + (quantity * product.basePrice)).toLocaleString()}</span>
                    </div>
                    
                    {activeProductCampaigns.length > 0 && (
                      <div className="space-y-2.5">
                        {activeProductCampaigns.map(c => {
                           const itemTotalForThisProduct = quantity * product.basePrice;
                           const estimatedDiscount = c.discountType === 'percentage' ? (itemTotalForThisProduct * c.discountValue / 100) : c.discountValue;
                           return (
                             <div key={c.id} className="flex justify-between items-center text-[11px] sm:text-xs font-black text-brand-600 dark:text-brand-400">
                               <div className="flex items-center gap-2">
                                 <span>{c.name}</span>
                                 <CheckCircle2 size={12} className="text-brand-500 animate-pulse" />
                               </div>
                               <span className="tabular-nums">-₺{estimatedDiscount.toLocaleString()}</span>
                             </div>
                           );
                        })}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-surface-100 dark:border-white/5">
                      <span className="text-lg font-black text-surface-900 dark:text-white uppercase tracking-tight">Toplam</span>
                      <span className="text-3xl font-black text-surface-900 dark:text-white tracking-tighter">
                        ₺{Math.max(0, ((cart.reduce((acc, item) => acc + (item.product.basePrice * item.quantity), 0)) + (quantity * product.basePrice)) - 
                          activeProductCampaigns.reduce((acc, c) => acc + (c.discountType === 'percentage' ? ((quantity * product.basePrice) * c.discountValue / 100) : c.discountValue), 0)
                        ).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                       <button 
                         onClick={() => {
                           addToCart(product, quantity);
                           onClose();
                         }}
                         className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl border-2 border-surface-100 dark:border-white/10 text-surface-900 dark:text-white text-[10px] sm:text-xs font-black tracking-widest uppercase hover:bg-surface-50 dark:hover:bg-white/5 transition-all active:scale-95 group/btn"
                       >
                         ALIŞVERİŞE DEVAM ET
                       </button>
                       <ShinyButton 
                         onClick={() => {
                           addToCart(product, quantity);
                           onClose();
                           navigate('/checkout');
                         }}
                         className="py-4 justify-center text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase rounded-2xl shadow-xl shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-95 transition-all bg-brand-600 hover:bg-brand-500"
                       >
                         SEPETİ GÖRÜNTÜLE
                       </ShinyButton>
                    </div>
                    
                    <div className="flex items-center justify-center gap-8 pt-6">
                         <div className="flex items-center gap-2 text-surface-400 dark:text-surface-500">
                           <Truck size={14} />
                           <span className="text-[9px] font-black uppercase tracking-widest">Aynı Gün Kargo</span>
                         </div>
                         <div className="flex items-center gap-2 text-surface-400 dark:text-surface-500">
                           <ShieldCheck size={14} />
                           <span className="text-[9px] font-black uppercase tracking-widest">Sigortalı Gönderim</span>
                         </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-12">
                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-brand-500/20 rounded-full" />
                    <h4 className="text-xs font-black text-surface-400 dark:text-surface-500 uppercase tracking-[0.3em] mb-4">Ürün Vizyonu</h4>
                    <p className="text-lg sm:text-xl text-surface-600 dark:text-surface-300 leading-relaxed font-medium italic">{product.description}</p>
                  </div>

                  <div>
                    <div className="flex gap-2 sm:gap-4 mb-8 overflow-x-auto no-scrollbar pb-2">
                      {tabs.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest border-2 ${activeTab === tab.id ? 'bg-brand-600 border-brand-600 text-white shadow-xl shadow-brand-500/20' : 'bg-transparent border-surface-100 dark:border-white/5 text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-white/5'}`}
                        >
                          {tab.icon}
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-surface-50 dark:bg-white/5 p-8 rounded-[2rem] border border-surface-100 dark:border-white/5 min-h-[120px]"
                      >
                        <p className="text-base sm:text-lg text-surface-600 dark:text-surface-400 leading-relaxed font-medium">
                          {tabs.find(t => t.id === activeTab)?.content}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Trust Section */}
              <div className="mt-16 pt-10 border-t border-surface-100 dark:border-white/5 grid grid-cols-3 gap-2 sm:gap-6">
                {[
                  { icon: <ShieldCheck size={20} />, text: "%100 Orijinal" },
                  { icon: <Zap size={20} />, text: "Hızlı Teslimat" },
                  { icon: <CheckCircle2 size={20} />, text: "Uzman Onaylı" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-2 group/badge">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover/badge:scale-110 transition-transform duration-300 shadow-sm border border-brand-100 dark:border-brand-500/20">
                      {item.icon}
                    </div>
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-surface-500 dark:text-surface-400 transition-colors group-hover/badge:text-brand-600 dark:group-hover/badge:text-brand-400 leading-tight">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
