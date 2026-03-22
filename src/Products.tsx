import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from './CartContext';
import { Product, Category } from './types';
import { getProducts, getCategories, getBrands, Brand } from './api';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

export default function Products({ theme, toggleTheme }: { theme: 'light' | 'dark'; toggleTheme: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const { cart } = useCart();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<string>('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [absMinMax, setAbsMinMax] = useState({ min: 0, max: 10000 });
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, c, b] = await Promise.all([getProducts(), getCategories(), getBrands()]);
        setProducts(p);
        setCategories(c);
        setBrands(b);
        
        if (p.length > 0) {
          const prices = p.map(product => product.basePrice);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          setAbsMinMax({ min, max });
          // We keep priceRange empty initially for "no limit" behavior or set to min/max
          // The user said "sadece rakam yazarak arama sağlasın"
        }
      } catch (err) {
        console.error('Data loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && cat !== selectedCategory) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const availableBadges = useMemo(() => {
    const badges = new Set<string>();
    products.forEach(p => {
      if (p.featuredBadge) {
        badges.add(p.featuredBadge);
      }
    });
    return Array.from(badges).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Brand
    if (selectedBrand !== 'all') {
      result = result.filter(p => p.brand === selectedBrand);
    }

    // Badge
    if (selectedBadge !== 'all') {
      result = result.filter(p => p.featuredBadge === selectedBadge);
    }

    // Price Range
    if (priceRange.min !== '') {
      result = result.filter(p => p.basePrice >= Number(priceRange.min));
    }
    if (priceRange.max !== '') {
      result = result.filter(p => p.basePrice <= Number(priceRange.max));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.basePrice - b.basePrice;
        case 'price-desc': return b.basePrice - a.basePrice;
        case 'name-asc': return a.name.localeCompare(b.name);
        default: return 0; // preserve original order (creation order from DB)
      }
    });

    return result;
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedBadge, priceRange, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedBadge('all');
    setPriceRange({ min: '', max: '' });
    setSearchParams({}); // Clear URL params
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-950">
        <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filtersSection = (
    <div className="space-y-8">
      {/* Category Filter */}
      <div>
        <h4 className="text-xs font-black text-surface-400 dark:text-surface-500 uppercase tracking-[0.2em] mb-4">Kategoriler</h4>
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => { setSelectedCategory('all'); setSearchParams({}); }}
            className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedCategory === 'all' ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-900'}`}
          >
            Tüm Ürünler
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.name); setSearchParams({ category: cat.name }); }}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat.name ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-900'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Filter */}
      <div>
        <h4 className="text-xs font-black text-surface-400 dark:text-surface-500 uppercase tracking-[0.2em] mb-4">Markalar</h4>
        <div className="grid grid-cols-1 gap-1">
           <button 
            onClick={() => setSelectedBrand('all')}
            className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedBrand === 'all' ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-900'}`}
          >
            Tüm Markalar
          </button>
          {brands.map(brand => (
            <button 
              key={brand.id}
              onClick={() => setSelectedBrand(brand.name)}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedBrand === brand.name ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-900'}`}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      {/* Badge Filter */}
      {availableBadges.length > 0 && (
        <div>
          <h4 className="text-xs font-black text-surface-400 dark:text-surface-500 uppercase tracking-[0.2em] mb-4">Etiketler</h4>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => setSelectedBadge('all')}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedBadge === 'all' ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-900'}`}
            >
              Tüm Ürünler
            </button>
            {availableBadges.map(badge => (
              <button 
                key={badge}
                onClick={() => setSelectedBadge(badge)}
                className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${selectedBadge === badge ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-900'}`}
              >
                {badge}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h4 className="text-xs font-black text-surface-400 dark:text-surface-500 uppercase tracking-[0.2em] mb-4">Fiyat Aralığı</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-surface-400">min</span>
            <input 
              type="number" 
              placeholder="0"
              value={priceRange.min}
              onChange={e => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all appearance-none"
            />
          </div>
          <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-surface-400">max</span>
            <input 
              type="number" 
              placeholder="10000"
              value={priceRange.max}
              onChange={e => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all appearance-none"
            />
          </div>
        </div>
      </div>

      <button 
        onClick={resetFilters}
        className="w-full py-3 bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
      >
        Filtreleri Sıfırla
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 font-sans selection:bg-brand-500/30 transition-colors duration-500">
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 pt-6 sm:pt-10 pb-12 sm:pb-20">
        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-surface-400 hover:text-brand-500 transition-colors uppercase tracking-widest group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Geri Dön
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[9px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest">
              <Link to="/" className="hover:text-brand-500 transition-colors">Ana Sayfa</Link>
              <span className="text-surface-200 dark:text-surface-800">/</span>
              <span className="text-brand-600 dark:text-brand-400">Katalog</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-surface-900 dark:text-white tracking-tighter leading-tight">Katalog</h1>
            <p className="text-surface-500 dark:text-surface-400 max-w-xl text-sm sm:text-base leading-relaxed mt-2">Bilimle desteklenen profesyonel mezoterapi ürünlerimizi keşfedin.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
              <input 
                type="text" 
                placeholder="Hızlı ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all"
              />
            </div>
            <button 
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden p-3 bg-surface-100 dark:bg-surface-900 rounded-2xl text-surface-900 dark:text-white"
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 h-fit sticky top-24">
            {filtersSection}
          </aside>

          {/* Content Area */}
          <div className="flex-1">
            {/* Sorting Bar */}
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-surface-100 dark:border-surface-900">
               <div className="text-sm font-bold text-surface-500">
                <span className="text-surface-900 dark:text-white">{filteredProducts.length}</span> ürün bulundu
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-surface-400 uppercase tracking-widest hidden sm:block">Sıralama</span>
                <select 
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-2 text-xs font-bold text-surface-700 dark:text-surface-300 focus:outline-none appearance-none cursor-pointer pr-10 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=')] bg-[length:1.25em] bg-[position:right_0.5em_center] bg-no-repeat"
                >
                  <option value="newest">En Yeniler</option>
                  <option value="price-asc">Fiyat: Artan</option>
                  <option value="price-desc">Fiyat: Azalan</option>
                  <option value="name-asc">İsim: A-Z</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="py-32 text-center bg-surface-50 dark:bg-surface-900/30 rounded-[3rem] border-2 border-dashed border-surface-100 dark:border-surface-800">
                <div className="w-20 h-20 bg-white dark:bg-surface-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <SlidersHorizontal size={32} className="text-surface-300" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Eşleşen Ürün Bulunamadı</h3>
                <p className="text-surface-500 dark:text-surface-400">Kriterleri temizleyerek tekrar deneyebilirsiniz.</p>
                <button 
                  onClick={resetFilters}
                  className="mt-6 px-8 py-3 bg-brand-500 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-500/20"
                >
                  Tüm Filtreleri Sıfırla
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 pt-8">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map(product => (
                    <ProductCard 
                      key={product.id}
                      product={product} 
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-surface-950 z-[101] shadow-2xl p-8 overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-surface-900 dark:text-white">Filtrele</h3>
                <button onClick={() => setShowMobileFilters(false)} className="p-2 text-surface-400 hover:text-surface-900 dark:hover:text-white">
                  <X size={24} />
                </button>
              </div>
              {filtersSection}
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-sm mt-8 shadow-xl shadow-brand-600/20"
              >
                Sonuçları Gör
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 w-12 h-12 bg-white dark:bg-surface-900 shadow-xl border border-surface-100 dark:border-surface-800 rounded-full flex items-center justify-center text-surface-500 hover:text-brand-500 transition-colors z-[60]"
      >
        <ChevronDown size={20} className="rotate-180" />
      </button>
    </div>
  );
}
