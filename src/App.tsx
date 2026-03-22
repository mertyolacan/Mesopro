import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CartProvider } from './CartContext';
import { AuthProvider } from './AuthContext';
import AppContent from './AppContent';
import { ContactMenu } from './ContactMenu';
import { MainLayout } from './components/layout/MainLayout';
import { getSettings } from './api';

// Lazy loaded pages for code splitting
const Checkout = React.lazy(() => import('./Checkout').then(m => ({ default: m.Checkout })));
const Admin = React.lazy(() => import('./Admin').then(m => ({ default: m.Admin })));
const Products = React.lazy(() => import('./Products'));
const Profile = React.lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const ForgotPassword = React.lazy(() => import('./ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = React.lazy(() => import('./ResetPassword').then(m => ({ default: m.ResetPassword })));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const SupportPage = React.lazy(() => import('./pages/Support').then(m => ({ default: m.SupportPage })));
const FAQPage = React.lazy(() => import('./pages/FAQ').then(m => ({ default: m.FAQPage })));
const BlogPage = React.lazy(() => import('./pages/Blog').then(m => ({ default: m.BlogPage })));
const BlogPostPage = React.lazy(() => import('./pages/BlogPost').then(m => ({ default: m.BlogPostPage })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-950">
    <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
  </div>
);

function AnimatedRoutes({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route
              path="/admin/*"
              element={
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Admin theme={theme} toggleTheme={toggleTheme} />
                </motion.div>
              }
            />
          </Routes>
        </AnimatePresence>
      </Suspense>
    );
  }

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route
              path="/"
              element={
                <motion.div
                  key="home"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <AppContent onCheckout={() => navigate('/checkout')} theme={theme} toggleTheme={toggleTheme} />
                </motion.div>
              }
            />
            <Route
              path="/checkout"
              element={
                <motion.div
                  key="checkout"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Checkout theme={theme} toggleTheme={toggleTheme} />
                </motion.div>
              }
            />
            <Route
              path="/products"
              element={
                <motion.div
                  key="products"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Products theme={theme} toggleTheme={toggleTheme} />
                </motion.div>
              }
            />
            <Route
              path="/profile"
              element={
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Profile />
                </motion.div>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                >
                  <ForgotPassword />
                </motion.div>
              }
            />
            <Route
              path="/reset-password"
              element={
                <motion.div
                  key="reset-password"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                >
                  <ResetPassword />
                </motion.div>
              }
            />
            <Route
              path="/product/:id"
              element={
                <motion.div key="product-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: "easeInOut" }}>
                  <ProductDetail theme={theme} toggleTheme={toggleTheme} />
                </motion.div>
              }
            />
            <Route
              path="/destek"
              element={
                <motion.div key="support" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                  <SupportPage />
                </motion.div>
              }
            />
            <Route
              path="/sss"
              element={
                <motion.div key="faq" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                  <FAQPage />
                </motion.div>
              }
            />
            <Route
              path="/blog"
              element={
                <motion.div key="blog" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                  <BlogPage />
                </motion.div>
              }
            />
            <Route
              path="/blog/:slug"
              element={
                <motion.div key="blog-post" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                  <BlogPostPage />
                </motion.div>
              }
            />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </MainLayout>
  );
}

import { FavoritesProvider } from './FavoritesContext';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved as 'light' | 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    getSettings().then(s => {
      if (s.site_title) document.title = s.site_title;
      if (s.favicon_url) {
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = s.favicon_url;
      }
    }).catch(() => {});
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-white dark:bg-surface-950 transition-colors duration-500">
              <AppRoutesWrapper theme={theme} toggleTheme={toggleTheme} />
            </div>
          </BrowserRouter>
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}

function AppRoutesWrapper({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <>
      <AnimatedRoutes theme={theme} toggleTheme={toggleTheme} />
      {!isAdminPage && <ContactMenu />}
    </>
  );
}
