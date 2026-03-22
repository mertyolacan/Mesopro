import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { Product } from './types';
import { useAuth } from './AuthContext';

export interface FavoritesContextType {
  favorites: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const prevUser = useRef(user);
  const [favorites, setFavorites] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('mesopro_favorites');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Favorites parse error:', err);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('mesopro_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (prevUser.current !== null && user === null) {
      setFavorites([]);
      localStorage.removeItem('mesopro_favorites');
    }
    prevUser.current = user;
  }, [user]);

  const toggleFavorite = (product: Product) => {
    setFavorites(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isFavorite = (productId: string) => {
    return favorites.some(p => p.id === productId);
  };

  const clearFavorites = () => setFavorites([]);

  const value = useMemo(() => ({
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites
  }), [favorites]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
};
