import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';
import { loginUser, registerUser, getUserFavorites, toggleFavoriteApi, updateUserProfile } from './api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, phone: string) => Promise<void>;
  logout: () => void;
  favorites: string[];
  toggleFavorite: (productId: string) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('mesopro_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        getUserFavorites(parsed.id).then(setFavorites).catch(console.error);
      } catch (err) {
        console.error('Invalid user session', err);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const { user: u, token } = await loginUser(email, pass);
    setUser(u);
    localStorage.setItem('mesopro_user', JSON.stringify(u));
    localStorage.setItem('mesopro_auth_token', token);
    const favs = await getUserFavorites(u.id);
    setFavorites(favs);
  };

  const register = async (name: string, email: string, pass: string, phone: string) => {
    const { user: u, token } = await registerUser({ name, email, password: pass, phone });
    setUser(u);
    localStorage.setItem('mesopro_user', JSON.stringify(u));
    localStorage.setItem('mesopro_auth_token', token);
    setFavorites([]);
  };

  const logout = () => {
    setUser(null);
    setFavorites([]);
    localStorage.removeItem('mesopro_user');
    localStorage.removeItem('mesopro_auth_token');
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) return; // User must be logged in to favorite
    const newFavs = await toggleFavoriteApi(user.id, productId);
    setFavorites(newFavs);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const res = await updateUserProfile(user.id, data);
    if (res.success) {
      setUser(res.user);
      localStorage.setItem('mesopro_user', JSON.stringify(res.user));
    }
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, favorites, toggleFavorite, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
