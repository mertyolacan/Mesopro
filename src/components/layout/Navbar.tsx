import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Menu, 
  X, 
  Search, 
  Moon, 
  Sun,
  User,
  ShieldAlert,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../../CartContext';
import { useFavorites } from '../../FavoritesContext';
import { useAuth } from '../../AuthContext';
import { useUnreadTickets } from '../../hooks/useUnreadTickets';
import { Product } from '../../types';
import { AuthModal } from '../AuthModal';
import { getSettings } from '../../api';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenFavorites: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: Product[];
  onOpenCampaigns: () => void;
}

export const Navbar = ({ 
  onOpenCart, 
  onOpenFavorites,
  theme, 
  toggleTheme, 
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  onOpenCampaigns
}: NavbarProps) => {
  const { cart } = useCart();
  const { favorites } = useFavorites();
  const { user } = useAuth();
  const { unreadCount } = useUnreadTickets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const navigate = useNavigate();
  const navRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    getSettings().then(s => setLogoUrl(s.site_logo || '')).catch(() => {});
  }, []);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        if (!searchQuery) {
          setIsSearchOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl z-50 border-b border-surface-100 dark:border-surface-900 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="w-9 h-9 object-contain rounded-[10px] transition-all group-hover:scale-110 group-hover:rotate-6" />
                : <div className="w-9 h-9 bg-surface-900 dark:bg-white rounded-[10px] flex items-center justify-center text-white dark:text-surface-900 text-[10px] font-black transition-all group-hover:scale-110 group-hover:rotate-6 shadow-lg shadow-surface-900/10 dark:shadow-white/10">MP</div>
              }
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-surface-900 dark:text-white uppercase transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">MESOPRO</h1>
            </Link>
            <div className="hidden lg:flex items-center gap-8 text-[11px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest">
              <Link to="/products" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Tüm Ürünler</Link>
              <button onClick={() => { navigate('/'); setTimeout(() => document.getElementById('brands-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Markalar</button>
              <button onClick={() => { navigate('/'); setTimeout(() => document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Kategoriler</button>
              <button onClick={onOpenCampaigns} className="hover:text-brand-500 dark:hover:text-brand-400 text-brand-600 dark:text-brand-500 flex items-center gap-1 font-bold transition-colors">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                Kampanyalar
              </button>
              <Link to="/blog" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Blog</Link>
              <button onClick={() => user ? navigate('/profile?tab=support') : setIsAuthModalOpen(true)} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors relative">
                Destek
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-black">{unreadCount}</span>
                )}
              </button>
              {user?.role === 'admin' && (
                <Link to="/admin" className="px-3 py-1.5 bg-brand-600 text-white rounded-xl flex items-center gap-2 hover:bg-brand-500 transition-all font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-brand-500/20">
                  <ShieldAlert size={14} />
                  Yönetici Paneli
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
              <button 
                onClick={toggleTheme}
                className="p-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
                title="Temayı Değiştir"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <div className="relative flex items-center">
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="overflow-visible sm:mr-2 relative z-50">
                       <input 
                         type="text" 
                         autoFocus
                         placeholder="Ürün Ara..." 
                         value={searchQuery}
                         onChange={e => setSearchQuery(e.target.value)}
                         onBlur={() => setTimeout(() => { if (!searchQuery) setIsSearchOpen(false); }, 200)}
                         className="w-[200px] sm:w-[220px] bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-surface-400 dark:text-white transition-all shadow-inner relative z-20"
                       />
                       
                       <AnimatePresence>
                         {searchQuery.trim() && (
                           <motion.div 
                             initial={{ opacity: 0, y: -10 }} 
                             animate={{ opacity: 1, y: 0 }} 
                             exit={{ opacity: 0, y: -10 }} 
                             className="absolute top-full left-0 mt-3 w-[280px] sm:w-[320px] bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-2xl z-[100] max-h-80 overflow-y-auto flex flex-col py-2"
                           >
                             {searchResults.length === 0 ? (
                               <div className="p-4 text-center text-xs text-surface-500">Sonuç bulunamadı.</div>
                             ) : (
                               searchResults.map(p => (
                                 <button 
                                   key={p.id} 
                                   onClick={() => { navigate(`/product/${p.id}`); setIsSearchOpen(false); setSearchQuery(''); setIsMenuOpen(false); }}
                                   className="flex items-center gap-3 p-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors w-full text-left"
                                 >
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-100 dark:bg-surface-950 flex-shrink-0">
                                      <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-xs font-bold text-surface-900 dark:text-white truncate">{p.name}</h4>
                                      <p className="text-[10px] text-surface-500 truncate">{p.brand}</p>
                                    </div>
                                    <div className="text-xs font-black text-brand-600 dark:text-brand-400">
                                      ₺{p.basePrice.toLocaleString()}
                                    </div>
                                 </button>
                               ))
                             )}
                           </motion.div>
                         )}
                       </AnimatePresence>

                    </motion.div>
                  )}
                </AnimatePresence>
                <button 
                  onClick={() => setIsSearchOpen(!isSearchOpen)} 
                  className={`p-2 transition-colors ${isSearchOpen || searchQuery ? 'text-brand-500 hover:text-brand-600' : 'text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'}`}
                >
                  {isSearchOpen && !searchQuery ? <X size={18} /> : <Search size={18} />}
                </button>
              </div>
              <button 
                onClick={onOpenFavorites}
                className="p-2 text-surface-500 dark:text-surface-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors relative"
                title="Favorilerim"
              >
                <Heart size={18} className={favorites.length > 0 ? "fill-current text-brand-500" : ""} />
                {favorites.length > 0 && (
                  <span className="absolute top-1 right-1 bg-brand-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-in zoom-in">
                    {favorites.length}
                  </span>
                )}
              </button>
              <button 
                onClick={onOpenCart}
                className="p-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors relative"
              >
                <ShoppingCart size={18} />
                {cart.length > 0 && (
                  <span className="absolute top-1 right-1 bg-brand-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </button>
              <button 
                onClick={() => user ? navigate('/profile') : setIsAuthModalOpen(true)}
                className="p-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors hidden sm:block"
                title={user ? "Hesabım" : "Giriş Yap"}
              >
                {user ? (
                   <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold">
                     {user.name.charAt(0).toUpperCase()}
                   </div>
                ) : (
                  <User size={18} />
                )}
              </button>
              <button 
                className="lg:hidden p-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-900 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <button onClick={() => { setIsMenuOpen(false); navigate('/products'); }} className="block w-full text-left px-3 py-4 text-sm font-black text-surface-400 uppercase tracking-widest hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Tüm Ürünler</button>
              <button onClick={() => { setIsMenuOpen(false); navigate('/'); setTimeout(() => document.getElementById('brands-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="block w-full text-left px-3 py-4 text-sm font-black text-surface-400 uppercase tracking-widest hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Markalar</button>
              <button onClick={() => { setIsMenuOpen(false); navigate('/'); setTimeout(() => document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="block w-full text-left px-3 py-4 text-sm font-black text-surface-400 uppercase tracking-widest hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Kategoriler</button>
              <button onClick={() => { setIsMenuOpen(false); onOpenCampaigns(); }} className="block w-full text-left px-3 py-4 text-sm font-black text-brand-600 dark:text-brand-500 uppercase tracking-widest hover:text-brand-700 dark:hover:text-brand-400 transition-colors flex items-center justify-between">
                <span>Kampanyalar</span>
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
              </button>
              <button onClick={() => { setIsMenuOpen(false); navigate('/blog'); }} className="block w-full text-left px-3 py-4 text-sm font-black text-surface-400 uppercase tracking-widest hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Blog</button>
              <button onClick={() => { setIsMenuOpen(false); user ? navigate('/profile?tab=support') : setIsAuthModalOpen(true); }} className="flex items-center justify-between w-full text-left px-3 py-4 text-sm font-black text-surface-400 uppercase tracking-widest hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                <span>Destek</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">{unreadCount}</span>
                )}
              </button>
              <button onClick={() => { setIsMenuOpen(false); user ? navigate('/profile') : setIsAuthModalOpen(true); }} className="block w-full text-left px-3 py-4 text-sm font-black text-surface-400 uppercase tracking-widest hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                {user ? 'Hesabım' : 'Giriş Yap / Üye Ol'}
              </button>
              {user?.role === 'admin' && (
                <button 
                  onClick={() => { setIsMenuOpen(false); navigate('/admin'); }} 
                  className="block w-full text-left px-3 py-4 text-sm font-black text-brand-600 dark:text-brand-500 uppercase tracking-widest hover:text-brand-700 dark:hover:text-brand-400 transition-colors flex items-center gap-2"
                >
                  <ShieldAlert size={16} />
                  Yönetici Paneli
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
};
