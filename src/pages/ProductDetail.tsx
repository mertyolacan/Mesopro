import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Zap, 
  CheckCircle2, 
  ShoppingBag, 
  ShieldCheck, 
  X, 
  Plus, 
  Minus, 
  ChevronRight, 
  Heart,
  Truck,
  ArrowLeft,
  Share2,
  Info,
  FileText,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';
import { useFavorites } from '../FavoritesContext';
import { useAuth } from '../AuthContext';
import { getProductById, getProducts } from '../api';
import { Product } from '../types';
import { SEOHead } from '../components/SEOHead';
import { ShinyButton } from '../components/ShinyButton';
import { Countdown, Badge } from '../components/shared';
import { ProductCard } from '../components/ProductCard';

export const ProductDetail = ({ theme, toggleTheme }: { theme: 'light' | 'dark'; toggleTheme: () => void }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'indications' | 'area' | 'warnings'>('ingredients');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { user } = useAuth();
  const { cart, addToCart, campaigns = [], appliedCoupon = '' } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (id) {
      setLoading(true);
      Promise.all([
        getProductById(id),
        getProducts()
      ]).then(([p, allProducts]) => {
        setProduct(p);
        if (p) {
          const related = allProducts
            .filter(item => item.id !== p.id && item.category === p.category)
            .slice(0, 4);
          setRelatedProducts(related);
        }
        setLoading(false);
      }).catch(err => {
        console.error('Product loading error:', err);
        setLoading(false);
      });
    }
  }, [id]);

  const favorited = product ? isFavorite(product.id) : false;

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

  const activeProductCampaigns = useMemo(() => {
    if (!product || !campaigns) return [];
    return campaigns.filter(c => {
      if (c.isUsed) return false;
      if (sim.amount < c.minAmount) return false;
      const isRelated = !c.targetValue || 
                        (c.type === 'product' && c.targetValue === product.id) || 
                        (c.type === 'category' && c.targetValue === product.category) ||
                        (c.type === 'volume' || c.type === 'cart_total' || c.type === 'bogo');
      if (!isRelated) return false;
      if (c.couponCode) {
        if (!user) return false; // Guests can't even see coupon-active deals as active
        if (c.isUsed) return false; // Already used deals aren't active
        if (c.couponCode.toUpperCase() !== appliedCoupon.toUpperCase()) return false;
      }
      
      if (c.type === 'volume') return sim.qty >= c.minQuantity;
      if (c.type === 'cart_total') return true;
      if (c.type === 'bogo') {
         const isMatch = !c.targetValue || c.targetValue === product.id || c.targetValue === product.category;
         return isMatch && sim.productQty >= c.minQuantity;
      }
      if (c.type === 'product' || c.type === 'category') {
         return quantity >= c.minQuantity; 
      }
      return false;
    });
  }, [product, campaigns, sim, quantity]);

  const previewIncentives = useMemo(() => {
    if (!product) return [];
    return campaigns
      .filter(c => {
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
        const isActive = activeProductCampaigns.some(pa => pa.id === c.id);
        
        if (!isActive) {
          if (c.isUsed) {
            benefitText = `Kullanıldı`;
          } else if (c.couponCode) {
            if (!user) {
              benefitText = `Giriş yap ve ${c.couponCode} kullan`;
            } else {
              benefitText = `${c.couponCode} Kodunu Kullan!`;
            }
          } else {
            benefitText = `${c.discountType === 'percentage' ? `%${c.discountValue}` : `${c.discountValue}₺`} İndirim`;
          }
          
          if (c.type === 'volume') {
            neededValue = Math.max(0, c.minQuantity - sim.qty);
            unit = 'items';
          } else if (c.type === 'cart_total') {
            neededValue = Math.max(0, c.minAmount - sim.amount);
            unit = 'currency';
          } else if (c.type === 'bogo') {
            const isMatch = !c.targetValue || c.targetValue === product.id || c.targetValue === product.category;
            if (isMatch) {
              const setSize = c.minQuantity || 1;
              const freeQty = c.bogoFreeQuantity || 1;
              neededValue = Math.max(0, setSize - sim.productQty);
              unit = 'items';
              benefitText = `${setSize} Al ${freeQty} Bedava`;
            }
          } else if (c.type === 'product' || c.type === 'category') {
            const isMatch = !c.targetValue || 
                           (c.type === 'product' && c.targetValue === product.id) || 
                           (c.type === 'category' && c.targetValue === product.category);
            
            if (isMatch) {
              const qtyNeeded = Math.max(0, c.minQuantity - quantity);
              const amountNeeded = Math.max(0, c.minAmount - sim.amount);
              
              if (qtyNeeded > 0) {
                neededValue = qtyNeeded;
                unit = 'items';
              } else if (amountNeeded > 0) {
                neededValue = amountNeeded;
                unit = 'currency';
              }
            }
          }
        }
        return { ...c, neededValue, unit, benefitText, isActive };
      })
      .filter(c => c.neededValue > 0 || c.isActive)
      .sort((a, b) => {
        // Tamamen SABİT sıralama: Kampanya zorluk derecesine (barajına) göre.
        // Bu sayede ürün eklendikçe soldan sağa doğru yeşil yanar ve yerler DEĞİŞMEZ.
        const aVal = a.minAmount || (a.minQuantity * 1000); // 1 adet yaklaşık 1000 TL gibi varsayalım (ağırlıklandırma)
        const bVal = b.minAmount || (b.minQuantity * 1000);
        return aVal - bVal;
      });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-950">
        <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-surface-950 p-6 text-center">
        <div className="w-20 h-20 bg-surface-100 dark:bg-surface-900 rounded-3xl flex items-center justify-center mb-6">
          <X size={40} className="text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-surface-900 dark:text-white mb-4">Ürün Bulunamadı</h2>
        <p className="text-surface-500 dark:text-surface-400 mb-8 max-w-md">Aradığınız ürün yayından kaldırılmış veya bağlantı hatalı olabilir.</p>
        <ShinyButton onClick={() => navigate('/products')}>Tüm Ürünlere Dön</ShinyButton>
      </div>
    );
  }

  const tabs = [
    { id: 'ingredients', label: 'İçerik', icon: <Zap size={14} />, content: product.ingredients },
    { id: 'indications', label: 'Endikasyon', icon: <CheckCircle2 size={14} />, content: product.indications },
    { id: 'application', label: 'Uygulama', icon: <Box size={14} />, content: product.applicationArea },
    { id: 'warnings', label: 'Uyarılar', icon: <ShieldCheck size={14} />, content: product.warnings }
  ];

  const seoTitle = product.seoTitle || `${product.name} — MesoPro`;
  const seoDescription = product.seoDescription || product.description?.slice(0, 155) || '';
  const productStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'TRY',
      price: product.basePrice,
      availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: window.location.href,
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 transition-colors duration-500">
      <SEOHead
        overrides={{ title: seoTitle, description: seoDescription, ogImage: product.image, ogType: 'product', keywords: product.keywords || undefined }}
        structuredData={productStructuredData}
      />
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 pt-6 sm:pt-10 pb-12 sm:pb-20">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-surface-400 hover:text-brand-500 transition-colors uppercase tracking-widest group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Geri Dön
          </button>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-surface-100 dark:bg-surface-900 rounded-lg text-surface-500 hover:text-brand-500 transition-colors">
              <Share2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[9px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest">
              <Link to="/" className="hover:text-brand-500 transition-colors">Ana Sayfa</Link>
              <span className="text-surface-200 dark:text-surface-800">/</span>
              <Link to="/products" className="hover:text-brand-500 transition-colors">Katalog</Link>
              <span className="text-surface-200 dark:text-surface-800">/</span>
              <span className="text-brand-600 dark:text-brand-400">{product.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-surface-900 dark:text-white tracking-tighter leading-tight">{product.name}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 lg:gap-x-20 gap-y-8">
          {/* 1. PRODUCT IMAGE */}
          <div className="order-1 lg:col-start-1 lg:row-start-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="aspect-square bg-surface-50 dark:bg-surface-900 rounded-[2.5rem] overflow-hidden relative group border border-surface-100 dark:border-surface-800/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent opacity-60 pointer-events-none" />
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-contain p-10 group-hover:scale-105 transition-transform duration-700" 
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute top-8 left-8 flex flex-col gap-3">
                <Badge className="bg-white/90 dark:bg-surface-800/90 backdrop-blur-md text-surface-900 dark:text-white shadow-xl border border-surface-100 dark:border-surface-700 font-black px-4 py-1.5 text-xs uppercase tracking-widest">{product.brand}</Badge>
                {product.featuredBadge && (
                  <div className="py-2 px-5 bg-brand-600 text-white rounded-2xl shadow-xl shadow-brand-600/20">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{product.featuredBadge}</span>
                  </div>
                )}
              </div>

              <div className="absolute top-8 right-8">
                 <button 
                  onClick={() => toggleFavorite(product)}
                  className="w-12 h-12 bg-white/90 dark:bg-surface-900/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-all border border-surface-100 dark:border-surface-800 group/fav"
                >
                  <Heart size={22} className={`transition-colors duration-300 ${favorited ? 'fill-red-500 text-red-500' : 'text-surface-400 group-hover:text-red-500'}`} />
                </button>
              </div>

              {campaign?.endDate && (
                <div className="absolute bottom-16 left-8 right-8">
                   <Countdown endDate={campaign.endDate} />
                </div>
              )}

              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap gap-1.5 sm:gap-2 justify-center w-full px-4 sm:px-6 pointer-events-none">
                {product.problem.map(p => (
                  <span key={p} className="text-[8px] sm:text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest bg-white/90 dark:bg-surface-900/90 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-brand-500/20 shadow-xl flex items-center gap-1 sm:gap-1.5 pointer-events-auto whitespace-nowrap">
                    <div className="w-1 h-1 rounded-full bg-brand-500" />
                    #{p}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* 2. PRICE SUMMARY */}
          <div className="order-2 lg:col-start-2 lg:row-start-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="bg-surface-50 dark:bg-surface-900 rounded-[1.5rem] sm:rounded-[2.5rem] border border-surface-100 dark:border-surface-800 p-6 sm:p-10 space-y-6 sm:space-y-8 shadow-sm">
                <div className="space-y-6">
                  {/* Kazanılan & Potansiyel Kampanyalar */}
                  <AnimatePresence mode="popLayout">
                    {(activeProductCampaigns.length > 0 || previewIncentives.length > 0) && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                         <div className="flex items-center justify-between mb-2">
                           <h3 className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest flex items-center gap-2">
                             Kampanya Fırsatları <Zap size={10} className="text-orange-500" />
                           </h3>
                         </div>
                         
                         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                           {previewIncentives.map((c, i) => (
                              <motion.div 
                                layout
                                key={c.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={`px-2 py-1.5 rounded-lg border flex items-center justify-center gap-1 shadow-sm text-center transition-colors duration-500 ${c.isActive ? 'bg-brand-500/10 border-brand-500/30 text-brand-700 dark:text-brand-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400'}`}
                              >
                                <div className="flex flex-col items-center justify-center leading-none py-0.5">
                                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tight mb-0.5">
                                    {c.isActive ? 'Kazanıldı' : (c.unit === 'currency' ? `+₺${c.neededValue?.toLocaleString()}` : `+${c.neededValue} Adet`)}
                                  </span>
                                  <span className="text-[7px] sm:text-[8px] font-bold opacity-80 uppercase tracking-tighter">
                                    {c.isActive ? c.name : c.benefitText}
                                  </span>
                                </div>
                              </motion.div>
                           ))}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-2">
                  <div className="flex flex-col items-center sm:items-start">
                    <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">Birim Fiyat</span>
                    <span className="text-3xl font-black text-surface-900 dark:text-white tracking-tighter">₺{product.basePrice.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-1.5 shadow-premium">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl text-surface-500 transition-colors"><Minus size={20} /></button>
                    <span className="w-16 text-center text-xl font-black text-surface-900 dark:text-white">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl text-surface-500 transition-colors"><Plus size={20} /></button>
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-surface-200 dark:border-surface-800">
                  <div className="flex justify-between items-center text-sm font-bold text-surface-500">
                    <span>Ara Toplam</span>
                    <span className="text-surface-900 dark:text-white font-black">₺{(quantity * product.basePrice).toLocaleString()}</span>
                  </div>
                  
                  {activeProductCampaigns.length > 0 && (
                    <div className="space-y-3">
                      {activeProductCampaigns.map(c => {
                        const discount = c.type === 'bogo' 
                          ? Math.floor(quantity / c.minQuantity) * ((c.bogoFreeQuantity || 1) * product.basePrice)
                          : (c.discountType === 'percentage' ? ((quantity * product.basePrice) * c.discountValue / 100) : c.discountValue);
                        
                        return (
                          <div key={c.id} className="flex justify-between items-center text-xs font-black text-brand-600 dark:text-brand-400">
                            <div className="flex items-center gap-2"><span>{c.name}</span><CheckCircle2 size={12} className="text-brand-500" /></div>
                            <span className="tabular-nums">-₺{discount.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-6 border-t border-surface-200 dark:border-surface-800">
                    <span className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight">TOPLAM</span>
                    <div className="flex flex-col items-end">
                      <span className="text-4xl sm:text-5xl font-black text-brand-600 dark:text-brand-400 tracking-tighter">
                        ₺{Math.max(0, (quantity * product.basePrice) - activeProductCampaigns.reduce((acc, c) => {
                          const discount = c.type === 'bogo' 
                            ? Math.floor(quantity / c.minQuantity) * ((c.bogoFreeQuantity || 1) * product.basePrice)
                            : (c.discountType === 'percentage' ? ((quantity * product.basePrice) * c.discountValue / 100) : c.discountValue);
                          return acc + discount;
                        }, 0)).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-1">KDV DAHİL FİYAT</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => { addToCart(product, quantity); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 2000); }}
                    className={`flex items-center justify-center gap-2 py-4 px-6 rounded-2xl border-2 text-[10px] font-black tracking-widest uppercase transition-all active:scale-95 group/btn ${showSuccess ? 'border-brand-500 bg-brand-500 text-white shadow-lg' : 'border-surface-200 dark:border-surface-800 text-surface-900 dark:text-white hover:bg-surface-100 dark:hover:bg-surface-800'}`}
                  >
                    {showSuccess ? <><CheckCircle2 size={16} className="animate-in zoom-in" /> SEPETE EKLENDİ!</> : 'SEPETE EKLE'}
                  </button>
                  <ShinyButton 
                    onClick={() => { addToCart(product, quantity); navigate('/checkout'); }}
                    className="py-5 justify-center text-[11px] font-black tracking-[0.2em] shadow-xl shadow-brand-500/20"
                  >
                    HEMEN SATIN AL <ChevronRight className="ml-2" />
                  </ShinyButton>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 3. TABS SECTION */}
          <div className="order-3 lg:col-start-1 lg:row-start-2">
            <div className="pt-2 sm:pt-4 block">
              <div className="grid grid-cols-4 gap-1.5 sm:gap-4 mb-6 sm:mb-8">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-1 sm:px-6 py-3 sm:py-5 rounded-xl sm:rounded-2xl text-[7px] sm:text-[10px] font-black transition-all uppercase tracking-tight sm:tracking-widest border-2 ${activeTab === tab.id ? 'bg-surface-900 border-surface-900 text-white dark:bg-white dark:border-white dark:text-surface-950 shadow-xl' : 'bg-transparent border-surface-100 dark:border-white/5 text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-white/5'}`}
                  >
                    <div className="flex-shrink-0 scale-90 sm:scale-100">{tab.icon}</div>
                    <span className="text-center leading-tight truncate sm:whitespace-nowrap w-full">{tab.label}</span>
                  </button>
                ))}
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-surface-50 dark:bg-surface-900/50 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-surface-100 dark:border-surface-800/50 min-h-[140px]"
                >
                  <p className="text-sm sm:text-base lg:text-lg text-surface-600 dark:text-surface-400 leading-relaxed font-medium">
                    {tabs.find(t => t.id === activeTab)?.content}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* 4. TRUST BADGES */}
          <div className="order-4 lg:col-start-2 lg:row-start-2">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
               {[
                  { icon: <ShieldCheck size={16} />, text: "%100 Orijinal Ürün" },
                  { icon: <Truck size={16} />, text: "Soğuk Zincir Kargo" },
                  { icon: <CheckCircle2 size={16} />, text: "Uzman Danışmanlık" }
                ].map((item, i) => (
                  <div key={i} className="bg-surface-50 dark:bg-surface-900/40 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-surface-100 dark:border-surface-800/50 flex flex-col items-center text-center gap-1.5 sm:gap-2 group hover:border-brand-500/30 transition-all">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white dark:bg-surface-800 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm text-brand-500 flex-shrink-0">
                      {item.icon}
                    </div>
                    <span className="text-[7px] sm:text-[9px] font-bold uppercase tracking-tight sm:tracking-wider text-surface-500 dark:text-surface-400 group-hover:text-brand-600 transition-colors leading-tight line-clamp-2">{item.text}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Description Section */}
        <section className="mt-16 sm:mt-24 border-t border-surface-100 dark:border-surface-800/50 pt-12 sm:pt-20">
          <div className="space-y-6 sm:space-y-10">
            <div className="flex items-center gap-4">
              <h2 className="text-[9px] sm:text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-[0.4em] whitespace-nowrap">ÜRÜN AÇIKLAMASI</h2>
              <div className="h-px w-full bg-surface-100 dark:bg-surface-800/50" />
            </div>
            <div className="bg-surface-50/50 dark:bg-surface-900/30 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-12 lg:p-16 border border-surface-100 dark:border-surface-800/50">
              <p className="text-sm sm:text-base lg:text-lg text-surface-600 dark:text-surface-400 leading-relaxed font-medium">{product.description}</p>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 sm:mt-32">
            <div className="flex flex-col sm:flex-row items-end justify-between gap-6 mb-12">
              <div className="max-w-xl">
                 <Badge className="bg-brand-500/5 text-brand-600 dark:text-brand-400 mb-4 px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">İlginizi Çekebilir</Badge>
                 <h3 className="text-3xl sm:text-4xl font-black text-surface-900 dark:text-white tracking-tighter">Benzer Çözümler</h3>
              </div>
              <Link to="/products" className="text-xs font-black text-surface-400 hover:text-brand-500 transition-colors uppercase tracking-widest flex items-center gap-2 group">
                Hepsini Gör <ChevronRight size={14} className="group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
               {relatedProducts.map(p => (
                 <ProductCard key={p.id} product={p} onSelect={(p) => navigate(`/product/${p?.id}`)} />
               ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
