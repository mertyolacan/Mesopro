import React from 'react';
import { motion } from 'motion/react';
import { Plus, Heart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { useFavorites } from '../FavoritesContext';
import { useAuth } from '../AuthContext';
import { Countdown, Badge } from './shared';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onSelect?: (p: Product | null) => void;
}

export const ProductCard = React.memo(({ product, onSelect }: ProductCardProps) => {
  const navigate = useNavigate();
  const { addToCart, campaigns } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const price = product.basePrice;
  const favorited = isFavorite(product.id);

  const campaign = campaigns?.find(c => 
    c.endDate && (
      (c.type === 'product' && c.targetValue === product.id) ||
      (c.type === 'category' && c.targetValue === product.category)
    )
  );

  const getBadgeStyle = (badge?: string | null) => {
    switch(badge) {
      case 'Popüler': return 'bg-purple-600 dark:bg-purple-500 shadow-purple-500/30 border-purple-400/30';
      case 'İndirim': return 'bg-green-600 dark:bg-green-500 shadow-green-500/30 border-green-400/30';
      case 'Yeni': return 'bg-blue-600 dark:bg-blue-500 shadow-blue-500/30 border-blue-400/30';
      case 'Çok Satan': return 'bg-orange-600 dark:bg-orange-500 shadow-orange-500/30 border-orange-400/30';
      case 'Özel Teklif': return 'bg-rose-600 dark:bg-rose-500 shadow-rose-500/30 border-rose-400/30';
      default: return 'bg-brand-600 dark:bg-brand-500 shadow-brand-500/30 border-brand-400/30';
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="premium-card group relative overflow-visible flex flex-col h-full"
    >
      <div 
        className="aspect-[4/5] overflow-hidden bg-white relative cursor-pointer rounded-t-[2rem]"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out p-4"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/60 via-surface-900/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="absolute top-4 left-4 flex flex-col gap-2 items-start z-10">
          <Badge className="bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl text-surface-900 dark:text-white shadow-lg border border-white/20 dark:border-surface-800/50 font-black px-3 py-1.5 text-[9px] uppercase tracking-widest rounded-lg">{product.brand}</Badge>
          {campaign?.endDate && <Countdown endDate={campaign.endDate} />}
        </div>
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product);
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-white/90 dark:bg-surface-950/90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-all border border-surface-100 dark:border-surface-800"
          >
            <Heart 
              size={18} 
              className={`transition-colors duration-300 ${favorited ? 'fill-red-500 text-red-500' : 'text-surface-400 dark:text-surface-500'}`} 
            />
          </button>
        </div>
      </div>

      {product.featuredBadge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl border flex items-center justify-center gap-2 backdrop-blur-md whitespace-nowrap min-w-[130px] ${getBadgeStyle(product.featuredBadge)}`}
          >
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
            {product.featuredBadge}
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
          </motion.div>
        </div>
      )}
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <div className="flex flex-wrap justify-center gap-1 mb-2.5 sm:mb-3">
          {product.problem.map(p => (
            <span key={p} className="text-[7px] sm:text-[8px] font-bold text-brand-700 dark:text-brand-400 uppercase tracking-normal whitespace-nowrap bg-brand-50 dark:bg-brand-500/10 px-1.5 py-[2px] rounded border border-brand-100 dark:border-brand-500/20">#{p}</span>
          ))}
        </div>
        <h3 
          className="text-sm sm:text-base font-black text-surface-900 dark:text-white mb-2 line-clamp-2 cursor-pointer group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight tracking-tight h-10 sm:h-12"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          {product.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-surface-500 dark:text-surface-400 mb-4 line-clamp-2 leading-relaxed flex-grow font-medium opacity-80 group-hover:opacity-100 transition-opacity">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-auto pt-4 sm:pt-5 border-t border-surface-100 dark:border-surface-800/50">
          <div className="flex flex-col">
            {product.originalPrice && (
              <span className="text-[10px] sm:text-sm text-surface-400 dark:text-surface-500 font-bold mb-0.5 whitespace-nowrap flex items-center gap-1.5">
                <span className="line-through decoration-red-500/50">₺{product.originalPrice.toLocaleString()}</span>
                <span className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest opacity-90 text-surface-500/80 dark:text-surface-400/80">yerine</span>
              </span>
            )}
            <span className="text-base sm:text-lg lg:text-2xl font-black text-surface-900 dark:text-white tracking-tight">₺{price.toLocaleString()}</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
            className="relative w-10 min-w-[40px] h-10 sm:w-12 sm:min-w-[48px] sm:h-12 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-brand-600 dark:hover:bg-brand-500 hover:text-white transition-all duration-500 shadow-xl hover:shadow-brand-500/40 hover:-translate-y-1 group/btn overflow-hidden"
          >
            <div className="absolute inset-0 bg-brand-500 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
            <Plus size={18} className="relative z-10 transition-transform duration-500 group-hover/btn:rotate-90 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});
