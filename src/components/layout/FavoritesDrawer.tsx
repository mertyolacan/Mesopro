import React from 'react';
import { 
  X, 
  Heart,
  ChevronRight, 
  ShoppingCart,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFavorites } from '../../FavoritesContext';
import { useCart } from '../../CartContext';
import { useNavigate } from 'react-router-dom';
import { ShinyButton } from '../ShinyButton';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FavoritesDrawer = ({ isOpen, onClose }: FavoritesDrawerProps) => {
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const navigate = useNavigate();

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
              <div className="flex items-center gap-2">
                <Heart size={20} className="text-brand-500 fill-brand-500" />
                <h2 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white tracking-tight">Favorilerim</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-900 rounded-full transition-colors text-surface-500 dark:text-surface-400">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              {favorites.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center mt-10 px-6">
                  <div className="w-20 h-20 bg-surface-50 dark:bg-surface-900 rounded-2xl flex items-center justify-center mb-6 shadow-inner relative">
                    <Heart className="text-surface-300 dark:text-surface-700 relative z-10" size={32} />
                  </div>
                  <h3 className="text-lg font-black text-surface-900 dark:text-white mb-2 uppercase tracking-tight">Henüz Favoriniz Yok</h3>
                  <p className="text-surface-500 dark:text-surface-400 font-medium text-sm mb-8 text-balance">Sevdiğiniz ürünleri daha sonra kolayca bulmak için kalp butonuna basarak favorilerinize ekleyebilirsiniz.</p>
                  <ShinyButton 
                    onClick={() => {
                      onClose();
                      navigate('/products');
                    }}
                    className="w-full justify-center"
                  >
                    Ürünleri İncele <ChevronRight size={18} />
                  </ShinyButton>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest leading-none">
                      {favorites.length} Ürün Favorilerinizde
                    </span>
                  </div>
                  {favorites.map((product) => (
                    <motion.div 
                      layout
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-surface-50 dark:bg-surface-900/50 p-4 rounded-2xl border border-surface-100 dark:border-surface-800 flex gap-4 group hover:border-brand-500/30 transition-colors"
                    >
                      <div className="w-20 h-20 bg-white dark:bg-surface-900 rounded-xl overflow-hidden shadow-sm flex-shrink-0 relative">
                        <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-surface-900 dark:text-white truncate pr-2 group-hover:text-brand-600 transition-colors">{product.name}</h4>
                          <button 
                            onClick={() => toggleFavorite(product)} 
                            className="text-surface-400 hover:text-red-500 transition-colors p-1"
                            title="Favorilerden Çıkar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-[10px] text-surface-500 dark:text-surface-400 mb-4 font-black uppercase tracking-widest">
                          {product.brand} • ₺{product.basePrice.toLocaleString()}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-surface-900 dark:text-white tracking-tighter">₺{product.basePrice.toLocaleString()}</span>
                          <button 
                            onClick={() => addToCart(product, 1)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-600 dark:hover:bg-brand-500 hover:text-white transition-all shadow-lg shadow-surface-900/10"
                          >
                            <ShoppingCart size={12} /> SEPETE EKLE
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
