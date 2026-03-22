import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  ShieldCheck, 
  Truck, 
  PhoneCall, 
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from './CartContext';
import { Product } from './types';
import { ShinyButton } from './components/ShinyButton';
import { getProducts, getOrderById, getBrands, Brand, getCategories } from './api';
import { Category } from './types';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { Badge } from './components/shared';

// --- Components ---

const Hero = React.memo(() => {
  const navigate = useNavigate();
  return (
  <section className="relative bg-surface-50 dark:bg-surface-950 pt-16 sm:pt-24 pb-24 sm:pb-32 overflow-hidden transition-colors duration-500 bg-grid">
    <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/20 blur-[140px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-surface-500/10 blur-[140px] rounded-full" />
    </div>
    
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 relative z-10">
      <div className="max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Badge className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 mb-6 sm:mb-8 border border-brand-200/50 dark:border-brand-800/50 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
            Mezopro Güvencesi
          </Badge>
          <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-surface-900 dark:text-white mb-8 leading-[0.95] sm:leading-[0.9] text-gradient">
            %100 Orijinal <br />
            Mezoterapi <br />
            <span className="text-surface-400 dark:text-surface-600 italic font-serif font-light">Sipariş Kaydı</span>
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-surface-600 dark:text-surface-400 mb-10 leading-relaxed max-w-2xl font-medium">
            Sahte ürün riskine son. Soğuk zincir güvencesi ve hızlı sipariş kaydı imkanıyla profesyonel bakım ürünleri kapınızda.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-12 sm:mb-16">
            <div className="flex items-center gap-3 text-brand-700 dark:text-brand-400 font-bold text-xs bg-brand-50 dark:bg-brand-900/20 px-6 py-3 rounded-2xl border border-brand-100 dark:border-brand-800/50 shadow-sm glass">
              <Truck size={16} />
              <span>Saat 14:00'e Kadar Aynı Gün Kargo</span>
            </div>
            <div className="flex items-center gap-3 text-surface-700 dark:text-surface-300 font-bold text-xs bg-surface-100 dark:bg-surface-900/50 px-6 py-3 rounded-2xl border border-surface-200 dark:border-surface-800/50 shadow-sm glass">
              <ShieldCheck size={16} />
              <span>Sipariş Kaydı Oluşturma İmkanı</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <ShinyButton onClick={() => navigate('/products')} className="w-full sm:w-auto h-16 px-10 text-base font-black tracking-widest uppercase rounded-2xl shadow-xl shadow-brand-500/20">
              ALIŞVERİŞE BAŞLA <ChevronRight size={20} className="ml-2" />
            </ShinyButton>
            <ShinyButton onClick={() => document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' })} variant="outline" className="w-full sm:w-auto h-16 px-10 text-base font-black tracking-widest uppercase rounded-2xl glass">
              KATEGORİLER
            </ShinyButton>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
  );
});

const CategoryGrid = React.memo(({ categories }: { categories: Category[] }) => {
  const navigate = useNavigate();
  if (categories.length === 0) return null;

  const renderIcon = (iconStr: string) => {
    if (!iconStr) return <div className="w-16 h-16 sm:w-20 sm:h-20 bg-surface-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center opacity-30"><span className="text-2xl font-black">?</span></div>;
    if (iconStr.startsWith('material:')) {
      const iconName = iconStr.split(':')[1];
      return <span className="material-symbols-outlined text-4xl sm:text-5xl text-surface-300 dark:text-surface-700 transition-colors group-hover:text-brand-500 duration-500">{iconName}</span>;
    }
    return <img src={iconStr} className="w-16 h-16 sm:w-20 sm:h-20 object-contain grayscale dark:grayscale-0 opacity-40 dark:opacity-100 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700 ease-out mix-blend-multiply dark:mix-blend-normal" referrerPolicy="no-referrer" />;
  };

  return (
    <section id="categories-section" className="py-12 sm:py-20 bg-white dark:bg-surface-950 transition-colors duration-500 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        <div className="text-center mb-10 sm:mb-16">
          <Badge className="bg-surface-100 dark:bg-surface-900 text-surface-500 mb-4 sm:mb-6 uppercase tracking-[0.2em] px-4">Kategoriler</Badge>
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-surface-900 dark:text-white tracking-tighter">Uzmanlık Alanınızı Seçin</h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {categories.map((cat, i) => (
            <motion.div 
              key={cat.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.6 }}
              onClick={() => {
                navigate(`/products?category=${encodeURIComponent(cat.name)}`);
              }}
              className="premium-card group p-6 sm:p-10 cursor-pointer overflow-hidden flex flex-col items-center text-center relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="mb-4 sm:mb-6 relative z-10 transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-700 ease-out">
                {renderIcon(cat.image)}
              </div>
              
              <h3 className="text-sm sm:text-lg lg:text-xl font-black text-surface-800 dark:text-surface-200 uppercase tracking-tight leading-tight relative z-10 transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
                {cat.name}
              </h3>
              
              <div className="mt-4 sm:mt-6 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700 group-hover:bg-brand-500 group-hover:text-white group-hover:border-brand-500 transition-all duration-500 shadow-inner">
                <ChevronRight size={16} className="sm:w-5 sm:h-5 transform group-hover:translate-x-0.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

const TrustBadges = React.memo(() => (
  <section className="bg-surface-50 dark:bg-surface-900/30 py-8 sm:py-10 border-y border-surface-100 dark:border-surface-800 transition-colors duration-500 glass">
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
        {[
          { icon: <ShieldCheck />, title: "Orijinal Ürün", desc: "Tüm ürünler %100 orijinaldir." },
          { icon: <Truck />, title: "Soğuk Zincir", desc: "Özel paketleme ile güvenli sevkiyat." },
          { icon: <CheckCircle />, title: "Uzman Desteği", desc: "7/24 profesyonel danışmanlık." },
          { icon: <PhoneCall />, title: "Hızlı İletişim", desc: "Anında çözüm ve destek hattı." }
        ].map((item, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6 group"
          >
            <div className="w-16 h-16 bg-white dark:bg-surface-800 rounded-3xl flex items-center justify-center shadow-premium group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-surface-100 dark:border-surface-700">
              {React.cloneElement(item.icon as React.ReactElement, { size: 32, className: "text-brand-500" })}
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-surface-900 dark:text-white mb-2 uppercase tracking-[0.15em]">{item.title}</h4>
              <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 leading-relaxed font-medium">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
));

const BrandMarqueeDual = React.memo(({ brands }: { brands: Brand[] }) => {
  if (brands.length === 0) return null;
  
  const minItems = 12;
  const repeatCount = Math.ceil(minItems / Math.max(brands.length, 1));
  const baseBrands = Array(repeatCount).fill(brands).flat();

  const BrandCard = React.memo(({ brand, idx, prefix }: { brand: Brand; idx: number; prefix: string }) => (
    <div className="flex-shrink-0 mx-4">
      <div className="flex items-center justify-center w-44 sm:w-56 h-20 sm:h-24 px-6 py-4 hover:scale-110 transition-all duration-300 cursor-pointer opacity-60 hover:opacity-100">
        {brand.logo ? (
          <img
            src={brand.logo}
            alt={brand.name}
            className="max-h-10 sm:max-h-12 max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="font-black text-xl text-surface-700 dark:text-surface-300 uppercase tracking-tight">{brand.name}</span>
        )}
      </div>
    </div>
  ));

  return (
    <section id="brands-section" className="py-12 sm:py-16 bg-surface-50 dark:bg-surface-900/40 overflow-hidden relative border-y border-surface-100 dark:border-surface-800 transition-colors duration-500">
      <div className="absolute inset-y-0 left-0 w-24 sm:w-48 bg-gradient-to-r from-surface-50 dark:from-surface-950 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 sm:w-48 bg-gradient-to-l from-surface-50 dark:from-surface-950 to-transparent z-20 pointer-events-none" />

      <div className="text-center mb-8 relative z-10">
        <span className="text-xs font-black text-surface-400 dark:text-surface-600 uppercase tracking-[0.3em]">Partner Markalar</span>
      </div>

      <div className="flex flex-col gap-4 sm:gap-6 relative w-full">
        <div className="flex w-max">
          <div className="flex animate-marquee items-center">
            {baseBrands.map((brand, i) => <BrandCard key={`r1a-${i}`} brand={brand} idx={i} prefix="r1a" />)}
          </div>
          <div className="flex animate-marquee items-center" aria-hidden="true">
            {baseBrands.map((brand, i) => <BrandCard key={`r1b-${i}`} brand={brand} idx={i} prefix="r1b" />)}
          </div>
        </div>

        <div className="flex w-max">
          <div className="flex animate-marquee-reverse items-center">
            {baseBrands.map((brand, i) => <BrandCard key={`r2a-${i}`} brand={brand} idx={i} prefix="r2a" />)}
          </div>
          <div className="flex animate-marquee-reverse items-center" aria-hidden="true">
            {baseBrands.map((brand, i) => <BrandCard key={`r2b-${i}`} brand={brand} idx={i} prefix="r2b" />)}
          </div>
        </div>
      </div>
    </section>
  );
});

export function AppContent({ onCheckout, theme, toggleTheme }: { onCheckout: () => void; theme: 'light' | 'dark'; toggleTheme: () => void }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [trackingId, setTrackingId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingResult, setTrackingResult] = useState<{ status: string; id: string } | null>(null);
  const [trackingError, setTrackingError] = useState('');

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    setIsTracking(true);
    setTrackingError('');
    setTrackingResult(null);
    try {
      const order = await getOrderById(trackingId.trim());
      setTrackingResult(order);
    } catch (err) {
      setTrackingError('Sipariş bulunamadı. Lütfen numarayı kontrol edip tekrar deneyin.');
    } finally {
      setIsTracking(false);
    }
  };

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
    getBrands().then(setBrands).catch(console.error);
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => !!p.featuredBadge);
  }, [products]);

  return (
    <div className="font-sans transition-colors duration-500">
      <main>
        <Hero />
        <CategoryGrid categories={categories} />

        <section id="catalog-section" className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-16 sm:py-20 lg:py-24">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 sm:gap-12 mb-12 sm:mb-16">
            <div className="max-w-2xl">
              <Badge className="bg-surface-100 dark:bg-surface-900 text-surface-500 mb-6 uppercase tracking-[0.2em] px-4">Vitrin</Badge>
              <h3 className="text-4xl sm:text-6xl font-black text-surface-900 dark:text-white mb-6 tracking-tighter">Öne Çıkan Ürünler</h3>
              <p className="text-base sm:text-lg text-surface-500 dark:text-surface-400 leading-relaxed font-medium">İhtiyacınıza yönelik profesyonel ve hedeflenmiş popüler çözümleri inceleyin. Daha fazlası için tüm ürünlere göz atabilirsiniz.</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/products')}
                className="whitespace-nowrap px-8 py-3.5 rounded-[1.25rem] text-[12px] font-black uppercase tracking-widest transition-all border-2 bg-brand-600 border-brand-600 text-white shadow-none flex items-center gap-2"
              >
                Tüm Ürünleri Gör <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-12 sm:gap-y-16 pt-8">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
              />
            ))}
          </div>
        </section>

        <BrandMarqueeDual brands={brands} />

        <section className="bg-surface-50 dark:bg-surface-900/30 py-16 sm:py-24 transition-colors duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-brand-500/5 blur-[120px] rounded-full" />
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 text-center relative z-10">
            <Badge className="bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-400 mb-6 uppercase tracking-[0.2em] px-4 font-black">Vizyonumuz</Badge>
            <h3 className="text-4xl sm:text-5xl font-black text-surface-900 dark:text-white mb-12 sm:mb-16 tracking-tighter">Neden MesoPro?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 text-left">
              {[
                { title: "Sipariş Kaydı Oluştur", desc: "Ürünlerinizi şimdi sipariş edin, ödemeyi kapıda veya onay sonrası havale ile güvenle gerçekleştirin." },
                { title: "Profesyonel Destek", desc: "Tüm süreçlerinizde uzman ekibimizle profesyonel danışmanlık ve teknik destek sunuyoruz." },
                { title: "Güvenli Tedarik", desc: "Mezoterapi serumlarının etkinliğini korumak için soğuk zincir standartlarında, takip edilebilir lojistik desteği sağlıyoruz." }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="premium-card p-10 sm:p-12 relative overflow-hidden group"
                >
                  <div className="text-brand-500/20 group-hover:text-brand-500/40 text-8xl font-black absolute -top-4 -right-4 transition-colors">0{i+1}</div>
                  <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center mb-8">
                     <div className="text-brand-600 dark:text-brand-400 font-black text-2xl">0{i+1}</div>
                  </div>
                  <h4 className="font-black mb-4 text-surface-900 dark:text-white uppercase tracking-wider text-base sm:text-lg">{item.title}</h4>
                  <p className="text-sm sm:text-base text-surface-500 dark:text-surface-400 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        <TrustBadges />
      </main>

      <footer className="bg-white dark:bg-surface-950 border-t border-surface-100 dark:border-surface-900 py-8 sm:py-12 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8 sm:mb-10">
            <div className="sm:col-span-2">
              <h1 className="text-3xl font-black tracking-tighter text-surface-900 dark:text-white mb-6">MESOPRO</h1>
              <p className="text-lg text-surface-500 dark:text-surface-400 max-w-md leading-relaxed font-medium">
                Profesyonel estetik ve mezoterapi dünyasının güvenilir tedarikçisi. 
                En yeni teknolojiler ve bilimsel içeriklerle cildin geleceğini tasarlıyoruz.
              </p>
            </div>
            <div>
              <h5 className="font-black text-surface-900 dark:text-white mb-8 uppercase tracking-[0.2em] text-xs">Hızlı Erişim</h5>
              <ul className="text-base text-surface-500 dark:text-surface-400 space-y-4 font-medium">
                <li><Link to="/" className="hover:text-brand-500 transition-colors">Anasayfa</Link></li>
                <li><Link to="/products" className="hover:text-brand-500 transition-colors">Tüm Ürünler</Link></li>
                <li><Link to="/blog" className="hover:text-brand-500 transition-colors">Blog</Link></li>
                <li><Link to="/sss" className="hover:text-brand-500 transition-colors">Sıkça Sorulan Sorular</Link></li>
                <li><Link to="/profile?tab=support" className="hover:text-brand-500 transition-colors">Destek Talebi Oluştur</Link></li>
                <li><a href="#" className="hover:text-brand-500 transition-colors">Kargo ve İade</a></li>
                <li><a href="#" className="hover:text-brand-500 transition-colors">KVKK</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-black text-surface-900 dark:text-white mb-8 uppercase tracking-[0.2em] text-xs">Sipariş Takibi</h5>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 font-medium">Sipariş durumunuzu öğrenin.</p>
              <form onSubmit={handleTrackOrder} className="flex flex-col gap-3">
                <input type="text" value={trackingId} onChange={e => setTrackingId(e.target.value)} placeholder="Örn: MP-973450" className="flex-1 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white transition-all shadow-sm outline-none font-bold" required />
                <button type="submit" disabled={isTracking} className="px-8 py-4 bg-surface-900 dark:bg-white hover:bg-brand-600 dark:hover:bg-brand-500 hover:text-white text-white dark:text-surface-900 rounded-2xl text-xs font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all disabled:opacity-50 flex items-center justify-center shadow-xl">
                  {isTracking ? 'Sorgulanıyor...' : 'Sorgula'}
                </button>
              </form>
              
              <AnimatePresence>
                {trackingResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mt-4 p-6 bg-brand-500/10 rounded-2xl border border-brand-500/20 glass overflow-hidden">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-brand-600/70 dark:text-brand-400/70 mb-2 font-black">Durum:</div>
                    <div className="font-black text-brand-700 dark:text-brand-400 text-base">
                      {trackingResult.status === 'pending' ? 'Beklemede' : trackingResult.status === 'confirmed' ? 'Onaylandı' : trackingResult.status === 'shipped' ? 'Kargoya Verildi' : trackingResult.status === 'delivered' ? 'Teslim Edildi' : trackingResult.status === 'cancelled' ? 'İptal Edildi' : trackingResult.status}
                    </div>
                  </motion.div>
                )}
                {trackingError && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mt-4 p-6 bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-2xl border border-red-500/20 font-black overflow-hidden">
                    {trackingError}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="pt-6 border-t border-surface-100 dark:border-surface-900 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <p className="text-[11px] font-black text-surface-400 uppercase tracking-[0.25em]">© 2026 MesoPro. Tüm hakları saklıdır.</p>
            <div className="flex flex-wrap justify-center gap-10 grayscale opacity-20 dark:invert transition-all hover:opacity-100 hover:grayscale-0">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-4 sm:h-5" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-4 sm:h-5" />
              <img src="https://www.iyzico.com/assets/images/logo.svg?v=1" alt="Iyzico" className="h-4 sm:h-5" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AppContent;
