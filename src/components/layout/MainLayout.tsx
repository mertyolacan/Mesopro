import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { CartDrawer } from './CartDrawer';
import { FavoritesDrawer } from './FavoritesDrawer';
import { useCart } from '../../CartContext';
import { getProducts, getCategories } from '../../api';
import { CampaignsModal } from './CampaignsModal';
import { Product, Category } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const MainLayout = ({ children, theme, toggleTheme }: MainLayoutProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCampaignsModalOpen, setIsCampaignsModalOpen] = useState(false);
  const { cart, campaigns, activeCampaignIds } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return !searchQuery || 
      p.name.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
  });

  const isCheckoutPage = location.pathname === '/checkout';
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 transition-colors duration-500">
      {!isCheckoutPage && !isAdminPage && (
        <Navbar 
          onOpenCart={() => setIsCartOpen(true)}
          onOpenFavorites={() => setIsFavoritesOpen(true)}
          onOpenCampaigns={() => setIsCampaignsModalOpen(true)}
          theme={theme}
          toggleTheme={toggleTheme}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={filteredProducts}
        />
      )}

      <main className={!isCheckoutPage ? "pt-16 sm:pt-20" : ""}>
        {children}
      </main>

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => navigate('/checkout')}
        products={products}
        categories={categories}
      />

      <FavoritesDrawer 
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
      />

      <CampaignsModal 
        isOpen={isCampaignsModalOpen}
        onClose={() => setIsCampaignsModalOpen(false)}
        campaigns={campaigns}
        activeCampaignIds={activeCampaignIds}
        products={products}
        categories={categories}
      />

      <AnimatePresence>
        {cart.length > 0 && !isCheckoutPage && !isAdminPage && (
          <motion.button 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => navigate('/checkout')}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-brand-600 text-white rounded-xl shadow-2xl flex items-center gap-3 z-[50] hover:scale-105 active:scale-95 transition-all group"
          >
            <div className="relative">
              <ShoppingCart size={16} />
              <span className="absolute -top-1.5 -right-1.5 bg-white text-brand-600 text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            </div>
            <span className="font-bold text-xs">Siparişi Tamamla</span>
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping hidden md:block" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
