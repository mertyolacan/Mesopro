import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Package, ShoppingBag, Plus, Trash2, Edit2, X, Save, LogOut,
  ShieldCheck, Eye, EyeOff, Lock, User, AlertCircle, TrendingUp,
  Clock, CheckCircle2, Truck, Search, Filter, BarChart3,
  RefreshCw, ChevronDown, ChevronLeft, ChevronRight, Bell, ArrowUpRight, Store, Image as ImageIcon,
  MessageSquare, Mail, Phone, Link, Tag, Loader2, Moon, Sun, Menu, Ticket, Copy, Settings, Download, Upload,
  UserPlus, Activity, ShieldAlert, MoreVertical, ExternalLink, StickyNote, Users, TriangleAlert, ClipboardList,
  HelpCircle, BookOpen, Globe, LifeBuoy, FileText, ToggleLeft, ToggleRight, GripVertical, Send, ChevronUp, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  getProducts, saveProduct, deleteProduct,
  getOrders, updateOrderStatus as apiUpdateOrderStatus,
  Order as ApiOrder, uploadImage, getMedia, Media, deleteMedia,
  getMessages, deleteMessage, markMessageRead, ContactMessage,
  getBrands, createBrand, deleteBrand, Brand, updateBrand,
  getCategories, createCategory, updateCategory, deleteCategory, Category,
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  getAdminUsers, getSettings, updateSetting,
  getAnalytics, Analytics, getAdminNotifications, AdminNotifications,
  updateOrderNotes, getAuditLog, AuditEntry,
  getAdminTeam, removeAdminAccess, inviteAdmin, AdminTeamMember,
  getUserOrders,
  getTickets, getTicket, updateTicketStatus, replyTicket, deleteTicket,
  getAllFAQs, createFAQ, updateFAQ, deleteFAQ,
  getAllBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost,
  getSEOPages, updateSEOPage, createSEOPage, deleteSEOPage
} from './api';
import { Product, Campaign, AdminUser, SupportTicket, FAQ, BlogPost, SEOPage } from './types';
import { PRODUCTS } from './constants';
import { ShinyButton } from './components/ShinyButton';
import { useAuth } from './AuthContext';

// ──Auth constants 
// Auth is now handled server-side via /api/auth/login
const SESSION_KEY = 'mesopro_admin_session';

// ──Types 
type AdminTab = 'dashboard' | 'orders' | 'products' | 'media' | 'messages' | 'brands' | 'categories' | 'campaigns' | 'customers' | 'settings' | 'support' | 'faq' | 'blog' | 'seo';

type Order = ApiOrder;

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ──Toast System 
const ToastContainer: React.FC<{ toasts: Toast[]; remove: (id: string) => void }> = ({ toasts, remove }) => (
  <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
    <AnimatePresence>
      {toasts.map(t => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: 60, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 60, scale: 0.9 }}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold border backdrop-blur ${
            t.type === 'success' ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-700' :
            t.type === 'error' ? 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700' :
            'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
          }`}
        >
          {t.type === 'success' ? <CheckCircle2 size={16} /> : t.type === 'error' ? <AlertCircle size={16} /> : <Bell size={16} />}
          {t.message}
          <button onClick={() => remove(t.id)} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ──Login Screen 
const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4 relative overflow-hidden text-center">
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-brand-400/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-surface-400/10 blur-[140px] rounded-full pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-md relative z-10 p-10 bg-white dark:bg-surface-900 rounded-[2.5rem] shadow-2xl border border-surface-100 dark:border-surface-800">
        <div className="w-20 h-20 bg-brand-500/10 dark:bg-brand-500/20 rounded-3xl flex items-center justify-center mb-8 mx-auto">
          <ShieldCheck size={40} className="text-brand-600 dark:text-brand-400" />
        </div>
        <h1 className="text-2xl font-black text-surface-950 dark:text-white tracking-tight mb-3">Yönetici Erişimi Gerekli</h1>
        <p className="text-surface-500 dark:text-surface-400 text-sm mb-10 leading-relaxed px-4">
          Bu bölüme girmek için bir yönetici hesabı ile oturum açmanız gerekmektedir. Lütfen ana sayfa üzerinden giriş yapın.
        </p>
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Ana Sayfaya Git
          </button>
        </div>
        <p className="text-xs text-surface-400 mt-8 font-medium">MesoPro Admin Panel · Güvenli Erişim Sistemi</p>
      </motion.div>
    </div>
  );
};

// ──Stat Card 
const StatCard: React.FC<{ label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string; trend?: number }> = ({ label, value, sub, icon, color, trend }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800 p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}>{icon}</div>
      {trend !== undefined && (
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-xl ${trend >= 0 ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
          <ArrowUpRight size={12} className={trend < 0 ? 'rotate-180' : ''} />{Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="text-2xl font-black text-surface-900 dark:text-white tracking-tight mb-1">{value}</div>
    <div className="text-xs font-bold text-surface-400 uppercase tracking-widest">{label}</div>
    {sub && <div className="text-xs text-surface-400 mt-1">{sub}</div>}
  </motion.div>
);

// ──Status Badge 
const StatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const map = {
    pending: { label: 'Beklemede', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', icon: <Clock size={11} /> },
    confirmed: { label: 'Onaylandı', cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', icon: <CheckCircle2 size={11} /> },
    shipped: { label: 'Kargoda', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', icon: <Truck size={11} /> },
    delivered: { label: 'Teslim Edildi', cls: 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400', icon: <CheckCircle2 size={11} /> },
    cancelled: { label: 'İptal Edildi', cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: <X size={11} /> },
  };
  const { label, cls, icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${cls}`}>
      {icon}{label}
    </span>
  );
};

// ──Custom Select Component 
const CustomSelect = ({ 
  value, 
  options, 
  onChange, 
  disabled = false,
  className = "",
  inputClassName = "w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  dropdownClassName = "absolute left-0 right-0 top-full mt-2 bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl shadow-xl z-[70] max-h-48 overflow-y-auto py-2 custom-scrollbar",
  placeholder = "Seçiniz"
}: {
  value: string;
  options: { value: string, label: string }[];
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <div className={`relative ${className}`}>
      <input 
        readOnly
        type="text"
        value={selectedLabel || placeholder}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className={inputClassName}
      />
      <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 transition-transform pointer-events-none ${isOpen ? 'rotate-180' : ''}`} />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className={dropdownClassName}>
            {options.map(option => (
              <div
                key={option.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors flex items-center justify-between group ${value === option.value ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-bold' : 'text-surface-700 dark:text-surface-300'}`}
              >
                <span className="truncate">{option.label}</span>
                {value === option.value && <CheckCircle2 size={14} />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ──Main Admin Component 
export const Admin: React.FC<{ theme?: 'light' | 'dark', toggleTheme?: () => void }> = ({ theme = 'light', toggleTheme = () => {} }) => {
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [searchOrders, setSearchOrders] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');
  const [searchProducts, setSearchProducts] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_sidebar_collapsed');
      if (stored !== null) return stored === 'true';
      return window.innerWidth < 768; // collapsed by default on mobile
    } catch { return true; }
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingMediaTab, setIsUploadingMediaTab] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isSelectingLogoFromMedia, setIsSelectingLogoFromMedia] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: '', logo: '' });
  const [isUploadingBrandLogo, setIsUploadingBrandLogo] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  // ──Categories state 
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', image: '' });
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isUploadingCategoryImage, setIsUploadingCategoryImage] = useState(false);
  const [isSelectingCategoryFromMedia, setIsSelectingCategoryFromMedia] = useState(false);

  // ──Campaigns state 
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaignTab, setActiveCampaignTab] = useState<'general' | 'conditions' | 'reward' | 'coupon' | 'scheduling'>('general');
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaignProductSearch, setCampaignProductSearch] = useState('');
  const [isCampaignProductDropdownOpen, setIsCampaignProductDropdownOpen] = useState(false);
  const [campaignCategorySearch, setCampaignCategorySearch] = useState('');
  const [isCampaignCategoryDropdownOpen, setIsCampaignCategoryDropdownOpen] = useState(false);
  const [isCampaignTypeDropdownOpen, setIsCampaignTypeDropdownOpen] = useState(false);
  const [isCampaignDiscountTypeDropdownOpen, setIsCampaignDiscountTypeDropdownOpen] = useState(false);

  // ──Customers state
  const [customers, setCustomers] = useState<AdminUser[]>([]);
  const [searchCustomers, setSearchCustomers] = useState('');

  // ──Settings state
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({ site_title: '', contact_email: '', contact_phone: '', contact_address: '', whatsapp_number: '', whatsapp_greeting: '', site_logo: '', favicon_url: '' });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState<"today" | "7d" | "30d" | "90d">("30d");

  // Notifications state
  const [notifications, setNotifications] = useState<AdminNotifications>({ newOrders: 0, unreadMessages: 0, lowStock: 0 });
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Audit log state
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Order detail state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderNotesDraft, setOrderNotesDraft] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Customer detail state
  const [selectedCustomer, setSelectedCustomer] = useState<AdminUser | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isLoadingCustomerOrders, setIsLoadingCustomerOrders] = useState(false);

  // Admin team state
  const [adminTeam, setAdminTeam] = useState<AdminTeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState("");

  // Bulk actions state
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkOrderStatus, setBulkOrderStatus] = useState<Order["status"]>("confirmed");

  // Support ticket state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // FAQ state
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'general', sort_order: 0, is_active: true });
  const [isSavingFaq, setIsSavingFaq] = useState(false);

  // Blog state
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [isAddingBlogPost, setIsAddingBlogPost] = useState(false);
  const [blogForm, setBlogForm] = useState({ title: '', slug: '', content: '', excerpt: '', cover_image: '', author_name: 'MesoPro', tags: '', status: 'draft' as 'draft' | 'published', seo_title: '', seo_description: '', seo_keywords: '' });
  const [isSavingBlogPost, setIsSavingBlogPost] = useState(false);

  // SEO state
  const [seoPages, setSeoPages] = useState<Record<string, SEOPage>>({});
  const [activeSeoPage, setActiveSeoPage] = useState('home');
  const [seoForm, setSeoForm] = useState<Partial<SEOPage>>({});
  const [isSavingSeo, setIsSavingSeo] = useState(false);
  const [newSeoPageSlug, setNewSeoPageSlug] = useState('');
  const [isAddingSeoPage, setIsAddingSeoPage] = useState(false);
  const [seoDetailOpen, setSeoDetailOpen] = useState(false);
  const [activeProductModalTab, setActiveProductModalTab] = useState<'general' | 'seo'>('general');

  // ──Loading & data state 
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState<string | null>(null);


  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = `${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // Stable ref so fetchData/fetchTabData don't recreate on every render
  const addToastRef = React.useRef(addToast);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);

  const checkAuthError = useCallback((err: any) => {
    if (err.status === 401 || err.status === 403) {
      addToastRef.current('Oturum süresi doldu veya yetkiniz yok. Tekrar giriş yapın.', 'error');
      handleLogout();
      return true;
    }
    return false;
  }, []);

  const fetchTabData = useCallback(async (tab: AdminTab) => {
    try {
      switch (tab) {
        case 'dashboard': {
          const [fetched, auditEntries] = await Promise.all([getOrders(), getAuditLog()]);
          setOrders(fetched);
          setAuditLog(auditEntries);
          break;
        }
        case 'orders': {
          const fetched = await getOrders();
          setOrders(fetched);
          break;
        }
        case 'products': {
          const [prods, cats, brs] = await Promise.all([getProducts(), getCategories(), getBrands()]);
          setProducts(prods); setCategories(cats); setBrands(brs);
          break;
        }
        case 'media': {
          const med = await getMedia();
          setMedia(med);
          break;
        }
        case 'messages': {
          const msgs = await getMessages();
          setMessages(msgs);
          break;
        }
        case 'brands': {
          const [brs, med] = await Promise.all([getBrands(), getMedia()]);
          setBrands(brs); setMedia(med);
          break;
        }
        case 'categories': {
          const cats = await getCategories();
          setCategories(cats);
          break;
        }
        case 'campaigns': {
          const [camps, prods, cats] = await Promise.all([getCampaigns(), getProducts(), getCategories()]);
          setCampaigns(camps); setProducts(prods); setCategories(cats);
          break;
        }
        case 'customers': {
          const users = await getAdminUsers();
          setCustomers(users);
          break;
        }
        case 'settings': {
          const [s, team] = await Promise.all([getSettings(), getAdminTeam()]);
          setSettingsForm((prev: Record<string, string>) => ({ ...prev, ...s }));
          setAdminTeam(team);
          break;
        }
        case 'support': {
          const tix = await getTickets();
          setTickets(tix);
          break;
        }
        case 'faq': {
          const faqData = await getAllFAQs();
          setFaqs(faqData);
          break;
        }
        case 'blog': {
          const posts = await getAllBlogPosts();
          setBlogPosts(posts);
          break;
        }
        case 'seo': {
          const pages = await getSEOPages();
          setSeoPages(pages);
          const first = Object.keys(pages)[0] || 'home';
          setActiveSeoPage(first);
          setSeoForm(pages[first] || {});
          break;
        }
      }
    } catch (err) {
      if (!checkAuthError(err)) {
        console.error('Tab fetch error:', err);
        addToastRef.current('Veriler yüklenirken hata oluğtu.', 'error');
      }
    }
  }, [checkAuthError, activeTab]); // added checkAuthError

  // ──Core data fetcher (initial load) 
  const fetchData = useCallback(async (showInitial = false) => {
    if (showInitial) setIsInitialLoading(true);
    setFetchError(false);
    try {
      const [fetchedOrders, fetchedProducts, fetchedBrands, fetchedCategories, fetchedCampaigns] = await Promise.all([
        getOrders(), getProducts(), getBrands(), getCategories(), getCampaigns()
      ]);
      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
      setBrands(fetchedBrands);
      setCategories(fetchedCategories);
      setCampaigns(fetchedCampaigns);
      setLastFetchedAt(new Date());
      // Non-blocking background loads
      getMedia().then(setMedia).catch(err => { if (!checkAuthError(err)) console.error(err); });
      getMessages().then(setMessages).catch(err => { if (!checkAuthError(err)) console.error(err); });
      getSettings().then(s => setSettingsForm((prev: Record<string, string>) => ({ ...prev, ...s }))).catch(() => {});
      getTickets().then(setTickets).catch(() => {});
    } catch (err) {
      if (!checkAuthError(err)) {
        console.error('Fetch error:', err);
        setFetchError(true);
        addToastRef.current('Veriler yüklenirken hata oluğtu.', 'error');
      }
    } finally {
      if (showInitial) setIsInitialLoading(false);
    }
  }, [checkAuthError]); // added checkAuthError

  // ──Auth check 
  useEffect(() => {
    const session = sessionStorage.getItem(SESSION_KEY);
    const isAdminUser = user?.role === 'admin';
    if (session === 'true' || isAdminUser) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setIsChecking(false);
  }, [user]);

  // ──Auto-refresh every 2 minutes 
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => fetchData(false), 120_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchData]);

  // Notifications polling every 60s
  useEffect(() => {
    if (!isAuthenticated) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]); // eslint-disable-line

  // Load analytics when dashboard is active
  useEffect(() => {
    if (activeTab === "dashboard" && isAuthenticated) loadAnalytics();
  }, [activeTab, analyticsRange]); // eslint-disable-line

  // ──Refresh when user returns to tab (stale > 60s) 
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleVisibility = () => {
      if (!document.hidden && lastFetchedAt && Date.now() - lastFetchedAt.getTime() > 60_000) {
        fetchData(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isAuthenticated, fetchData, lastFetchedAt]);

  // ──Fetch after successful login (one-shot) 
  const prevAuthRef = React.useRef(false);
  useEffect(() => {
    if (isAuthenticated && !prevAuthRef.current) fetchData(true);
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, fetchData]);

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    setIsSavingCategory(true);
    try {
      if (editingCategoryId !== null) {
        const updated = await updateCategory(editingCategoryId, { name: categoryForm.name.trim(), image: categoryForm.image });
        setCategories(prev => prev.map(c => c.id === editingCategoryId ? updated : c));
        addToast('Kategori güncellendi.', 'success');
      } else {
        const created = await createCategory({ name: categoryForm.name.trim(), image: categoryForm.image });
        setCategories(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        addToast('Kategori oluşturuldu.', 'success');
      }
      setCategoryForm({ name: '', image: '' });
      setEditingCategoryId(null);
      fetchTabData(activeTab); // Sadece aktif sekmeyi yenile
    } catch (err: any) {
      if (!checkAuthError(err)) {
        addToast(err.message || 'Kategori kaydedilemedi.', 'error');
      }
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCategoryImage(true);
    try {
      const url = await uploadImage(file);
      setCategoryForm(prev => ({ ...prev, image: url }));
      addToast('Kategori görseli yüklendi.', 'success');
    } catch (err) {
      addToast('Görsel yüklenirken hata oluğtu.', 'error');
    } finally {
      setIsUploadingCategoryImage(false);
    }
  };

  const handleImageIconPaste = (val: string) => {
    let parsed = val;
    if (parsed.includes('icon_names=')) {
      const match = parsed.match(/icon_names=([^&"'>]+)/);
      if (match) parsed = `material:${match[1]}`;
    } else if (parsed.includes('material-symbols-outlined') && parsed.includes('<span')) {
      const match = parsed.match(/>([^<]+)<\/span>/);
      if (match) parsed = `material:${match[1].trim()}`;
    }
    setCategoryForm(prev => ({ ...prev, image: parsed }));
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      addToast('Kategori silindi.', 'success');
    } catch (err) {
      if (!checkAuthError(err)) {
        addToast('Kategori silinemedi.', 'error');
      }
    }
  };

  // ──REMOVED: duplicate fetchData useEffect (now only triggers from login) 

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    authLogout();
    setIsAuthenticated(false);
    addToast('Oturum sonlandırıldı.', 'info');
  };

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    setIsUpdatingOrder(orderId);
    try {
      await apiUpdateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      addToast(`Sipariş durumu güncellendi: ${newStatus}`, 'success');
      fetchTabData(activeTab); // Sadece aktif sekmeyi yenile
    } catch (err) {
      if (!checkAuthError(err)) {
        addToast('Durum güncellenirken hata oluğtu.', 'error');
      }
    } finally {
      setIsUpdatingOrder(null);
    }
  };

  const handleExportOrders = () => {
    const headers = ['ID', 'Müşteri', 'Email', 'Telefon', 'Toplam', 'Durum', 'Tarih'];
    const rows = filteredOrders.map(o => [
      o.id, o.customerName, o.email, o.phone,
      o.total, o.status, new Date(o.createdAt).toLocaleDateString('tr-TR')
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `siparisler-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      addToast('Ürün silindi.', 'success');
    } catch (err) {
      if (!checkAuthError(err)) {
        addToast('Ürün silinirken hata oluğtu.', 'error');
      }
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    const copy: Product = { ...product, id: `prod-${Date.now()}`, name: `${product.name} (Kopya)`, featuredBadge: null };
    try {
      const saved = await saveProduct(copy);
      setProducts((prev: Product[]) => [...prev, saved]);
      addToast('Ürün kopyalandı.', 'success');
    } catch (err) {
      if (!checkAuthError(err)) addToast('Ürün kopyalanırken hata oluştu.', 'error');
    }
  };

  const handleDeleteMedia = async (id: number) => {
    if (!window.confirm('Bu görseli kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await deleteMedia(id);
      setMedia(prev => prev.filter(m => m.id !== id));
      addToast('Görsel silindi.', 'success');
    } catch (e) {
      addToast('Görsel silinirken hata oluğtu.', 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setIsUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setEditingProduct({ ...editingProduct, image: url });
      // Fetch media again to update the media tab
      getMedia().then(setMedia);
      addToast('Görsel başarıyla yüklendi.', 'success');
    } catch (err) {
      addToast('Görsel yüklenirken hata oluğtu.', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleMediaTabUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Input'u sıfırla ki aynı dosya tekrar seçilebilsin
    e.target.value = '';
    setIsUploadingMediaTab(true);
    try {
      await uploadImage(file);
      const updated = await getMedia();
      setMedia(updated);
      addToast('Yeni görsel kütüphaneye eklendi.', 'success');
    } catch (err) {
      if (!checkAuthError(err)) {
        console.error('Media upload error:', err);
        addToast('Görsel yüklenirken hata oluğtu. Desteklenen formatlar: JPG, PNG, WebP, SVG', 'error');
      }
    } finally {
      setIsUploadingMediaTab(false);
    }
  };

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBrandLogo(true);
    try {
      const url = await uploadImage(file);
      setNewBrand(prev => ({ ...prev, logo: url }));
      addToast('Marka logosu yüklendi.', 'success');
    } catch (err) {
      if (!checkAuthError(err)) {
        addToast('Logo yüklenirken hata oluğtu.', 'error');
      }
    } finally {
      setIsUploadingBrandLogo(false);
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.name.trim()) return;
    setIsSavingBrand(true);
    try {
      if (editingBrand) {
        const updated = await updateBrand(editingBrand.id, newBrand);
        setBrands(prev => prev.map(b => b.id === editingBrand.id ? updated : b));
        addToast('Marka güncellendi.', 'success');
      } else {
        const created = await createBrand(newBrand);
        setBrands(prev => [...prev, created]);
        addToast('Marka oluşturuldu.', 'success');
      }
      setNewBrand({ name: '', logo: '' });
      setIsAddingBrand(false);
      setEditingBrand(null);
      fetchTabData(activeTab); // Sadece aktif sekmeyi yenile
    } catch (err) {
      if (!checkAuthError(err)) {
        addToast('Marka kaydedilirken hata oluğtu.', 'error');
      }
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setNewBrand({ name: brand.name, logo: brand.logo });
    setIsAddingBrand(true);
  };

  const handleDeleteBrand = async (id: number) => {
    if (!window.confirm('Bu markayı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteBrand(id);
      setBrands(prev => prev.filter(b => b.id !== id));
      addToast('Marka silindi.', 'success');
    } catch (err) {
      if (!checkAuthError(err)) {
        addToast('Marka silinirken hata oluğtu.', 'error');
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSavingProduct(true);
    try {
      const saved = await saveProduct(editingProduct);
      setProducts(prev => {
        const index = prev.findIndex(p => p.id === saved.id);
        if (index >= 0) {
          return prev.map(p => p.id === saved.id ? saved : p);
        }
        return [...prev, saved];
      });
      setEditingProduct(null);
      setIsAddingProduct(false);
      addToast(isAddingProduct ? 'Yeni ürün eklendi!' : 'Ürün güncellendi!', 'success');
      fetchTabData(activeTab); // Sadece aktif sekmeyi yenile
    } catch (err) {
      if (!checkAuthError(err)) {
        addToast('Ürün kaydedilirken hata oluğtu.', 'error');
      }
    } finally {
      setIsSavingProduct(false);
    }
  };

  const seedProducts = async () => {
    if (!window.confirm("Varsayılan ürünleri PostgreSQL'e aktarmak istiyor musunuz?")) return;
    try {
      for (const p of PRODUCTS) await saveProduct(p);
      await fetchData();
      addToast(`${PRODUCTS.length} ürün başarıyla yüklendi!`, 'success');
    } catch (e) {
      addToast('Ürünler yüklenirken hata oluğtu.', 'error');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    addToast('Veriler yenilendi.', 'info');
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    // Basic validation
    if (editingCampaign.type === 'volume' && (!editingCampaign.minQuantity || editingCampaign.minQuantity <= 0)) {
       addToast('Miktar bazlı kampanyalar için min adet girilmelidir.', 'error'); return;
    }
    setIsSavingCampaign(true);
    try {
      const isNew = !editingCampaign.id || editingCampaign.id === 0;
      let saved: Campaign;
      
      if (isNew) {
        // Remove ID field for creation
        const { id, ...dataToSave } = editingCampaign;
        saved = await createCampaign(dataToSave);
      } else {
        saved = await updateCampaign(editingCampaign.id, editingCampaign);
      }

      setCampaigns(prev => isNew ? [...prev, saved] : prev.map(c => c.id === saved.id ? saved : c));
      setEditingCampaign(null);
      setIsAddingCampaign(false);
      addToast(isNew ? 'Kampanya eklendi!' : 'Kampanya güncellendi!', 'success');
      fetchTabData(activeTab); // Sadece aktif sekmeyi yenile
    } catch (err) {
      if (!checkAuthError(err)) {
        console.error('Campaign save error:', err);
        addToast('Kampanya kaydedilirken hata oluğtu.', 'error');
      }
    } finally {
      setIsSavingCampaign(false);
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!window.confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteCampaign(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      addToast('Kampanya silindi.', 'success');
    } catch (err) {
      if (!checkAuthError(err)) {
        addToast('Kampanya silinirken hata oluğtu.', 'error');
      }
    }
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    const { id: _id, createdAt: _ca, currentUsage: _cu, isUsed: _iu, ...rest } = campaign;
    const copy: Partial<Campaign> = { ...rest, name: `${campaign.name} (Kopya)`, isActive: false, currentUsage: 0, couponCode: '' };
    try {
      const saved = await createCampaign(copy);
      setCampaigns((prev: Campaign[]) => [...prev, saved]);
      addToast('Kampanya kopyalandı (pasif olarak eklendi).', 'success');
    } catch (err) {
      if (!checkAuthError(err)) addToast('Kampanya kopyalanırken hata oluştu.', 'error');
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await Promise.all((Object.entries(settingsForm) as [string, string][]).map(([key, value]) => updateSetting(key, value)));
      addToast('Ayarlar kaydedildi.', 'success');
    } catch (err) {
      if (!checkAuthError(err)) addToast('Ayarlar kaydedilemedi.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ── Analytics loader
  const loadAnalytics = async (range?: string) => {
    const r = range || analyticsRange;
    setAnalyticsLoading(true);
    const now = new Date();
    let from = new Date();
    if (r === "today") { from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
    else if (r === "7d") { from = new Date(now); from.setDate(from.getDate() - 6); }
    else if (r === "30d") { from = new Date(now); from.setDate(from.getDate() - 29); }
    else if (r === "90d") { from = new Date(now); from.setDate(from.getDate() - 89); }
    try {
      const data = await getAnalytics(from.toISOString(), now.toISOString());
      setAnalytics(data);
    } catch (err) {
      if (!checkAuthError(err)) addToast("Analitik veriler yüklenemedi.", "error");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ── Notifications poller
  const loadNotifications = async () => {
    try { const n = await getAdminNotifications(); setNotifications(n); } catch {}
    try {
      const tix = await getTickets();
      setTickets(prev => {
        const prevOpen = prev.filter((t: SupportTicket) => t.status === 'open').length;
        const newOpen = tix.filter((t: SupportTicket) => t.status === 'open').length;
        if (newOpen > prevOpen && prev.length > 0) {
          addToastRef.current(`${newOpen - prevOpen} yeni destek talebi geldi!`, 'info');
        }
        return tix;
      });
    } catch {}
  };

  // ── Order notes save
  const handleSaveOrderNotes = async () => {
    if (!selectedOrder) return;
    setIsSavingNotes(true);
    try {
      await updateOrderNotes(selectedOrder.id, orderNotesDraft);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, notes: orderNotesDraft } : o));
      setSelectedOrder(prev => prev ? { ...prev, notes: orderNotesDraft } : null);
      addToast("Not kaydedildi.", "success");
    } catch (err) {
      if (!checkAuthError(err)) addToast("Not kaydedilemedi.", "error");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // ── Customer detail loader
  const handleOpenCustomer = async (customer: AdminUser) => {
    setSelectedCustomer(customer);
    setIsLoadingCustomerOrders(true);
    try {
      const orders = await getUserOrders(customer.id);
      setCustomerOrders(orders);
    } catch {} finally { setIsLoadingCustomerOrders(false); }
  };

  // ── Customer CSV export
  const handleExportCustomers = () => {
    const headers = ["ID", "Ad", "Email", "Telefon", "Kayıt Tarihi", "Sipariş Sayısı", "Toplam Harcama"];
    const rows = customers.map(c => [c.id, c.name, c.email, c.phone || "", new Date(c.createdAt).toLocaleDateString("tr-TR"), c.orderCount, c.totalSpent.toFixed(2)]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "musteriler.csv";
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Admin team invite
  const handleInviteAdmin = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      const res = await inviteAdmin(inviteEmail);
      setLastInviteUrl(res.inviteUrl);
      setInviteEmail("");
      addToast("Davet gönderildi.", "success");
      const team = await getAdminTeam();
      setAdminTeam(team);
    } catch (err) {
      if (!checkAuthError(err)) addToast("Davet gönderilemedi.", "error");
    } finally { setIsInviting(false); }
  };

  // ── Admin team remove
  const handleRemoveAdmin = async (id: number) => {
    if (!window.confirm("Bu adminin erişimini kaldırmak istediğinize emin misiniz?")) return;
    try {
      await removeAdminAccess(id);
      setAdminTeam(prev => prev.filter(m => m.id !== id));
      addToast("Admin erişimi kaldırıldı.", "success");
    } catch (err) {
      if (!checkAuthError(err)) addToast("İşlem başarısız.", "error");
    }
  };

  // ── Bulk product actions
  const handleBulkDeleteProducts = async () => {
    if (!window.confirm()) return;
    try {
      await Promise.all(selectedProducts.map(id => deleteProduct(id)));
      setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
      addToast("Seçili ürünler silindi.", "success");
    } catch (err) {
      if (!checkAuthError(err)) addToast("Bazı ürünler silinemedi.", "error");
    }
  };

  // ── Bulk order status update
  const handleBulkOrderStatus = async () => {
    if (!selectedOrders.length) return;
    try {
      await Promise.all(selectedOrders.map(id => apiUpdateOrderStatus(id, bulkOrderStatus)));
      setOrders(prev => prev.map(o => selectedOrders.includes(o.id) ? { ...o, status: bulkOrderStatus } : o));
      setSelectedOrders([]);
      addToast(`${selectedOrders.length} sipariş güncellendi.`, "success");
    } catch (err) {
      if (!checkAuthError(err)) addToast("Güncelleme başarısız.", "error");
    }
  };

  const handleToggleCampaignActive = async (id: number, currentActive: boolean) => {
    try {
      const updated = await updateCampaign(id, { isActive: !currentActive });
      setCampaigns(prev => prev.map(c => c.id === id ? updated : c));
      addToast(updated.isActive ? 'Kampanya aktifleştirildi.' : 'Kampanya duraklatıldı.', 'success');
    } catch (err) {
      if (!checkAuthError(err)) {
        addToast('Durum güncellenirken hata oluğtu.', 'error');
      }
    }
  };

  // ──Computed stats 
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const todayOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  // ──Filtered data 
  const filteredOrders = orders.filter(o => {
    const matchSearch = !searchOrders || o.customerName?.toLowerCase().includes(searchOrders.toLowerCase()) ||
      o.email?.toLowerCase().includes(searchOrders.toLowerCase()) ||
      o.id?.toString().toLowerCase().includes(searchOrders.toLowerCase()) ||
      o.phone?.includes(searchOrders);
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredProducts = products.filter(p =>
    !searchProducts || p.name?.toLowerCase().includes(searchProducts.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchProducts.toLowerCase())
  );

  if (isChecking) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return <LoginScreen />;

  type TabItem = { id: AdminTab; label: string; icon: React.ReactNode; badge?: number };
  type TabGroup = { label: string; items: TabItem[] };

  const tabGroups: TabGroup[] = [
    {
      label: 'Genel',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
      ]
    },
    {
      label: 'Ticaret',
      items: [
        { id: 'orders', label: 'Siparişler', icon: <ShoppingBag size={16} />, badge: (notifications.newOrders || pendingCount) || undefined },
        { id: 'products', label: 'Ürünler', icon: <Package size={16} /> },
        { id: 'campaigns', label: 'Kampanyalar', icon: <Tag size={16} /> },
        { id: 'customers', label: 'Müşteriler', icon: <User size={16} /> },
      ]
    },
    {
      label: 'Katalog',
      items: [
        { id: 'brands', label: 'Markalar', icon: <Store size={16} /> },
        { id: 'categories', label: 'Kategoriler', icon: <Filter size={16} /> },
        { id: 'media', label: 'Medya', icon: <ImageIcon size={16} /> },
      ]
    },
    {
      label: 'İletişim',
      items: [
        { id: 'messages', label: 'Mesajlar', icon: <MessageSquare size={16} />, badge: (notifications.unreadMessages || messages.filter((m: {is_read: boolean}) => !m.is_read).length) || undefined },
        { id: 'support', label: 'Destek', icon: <LifeBuoy size={16} />, badge: tickets.filter((t: SupportTicket) => t.status === 'open').length || undefined },
      ]
    },
    {
      label: 'İçerik',
      items: [
        { id: 'faq', label: 'SSS', icon: <HelpCircle size={16} /> },
        { id: 'blog', label: 'Blog', icon: <BookOpen size={16} /> },
        { id: 'seo', label: 'SEO', icon: <Globe size={16} /> },
      ]
    },
    {
      label: 'Sistem',
      items: [
        { id: 'settings', label: 'Ayarlar', icon: <Settings size={16} /> },
      ]
    },
  ];

  const tabs = tabGroups.flatMap(g => g.items);
  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label ?? '';
  const totalNotifCount = notifications.newOrders + notifications.unreadMessages + notifications.lowStock;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-500 flex">
      <ToastContainer toasts={toasts} remove={removeToast} />

      {/* ─── Sidebar ─── */}
      <aside className={`fixed inset-y-0 left-0 flex flex-col bg-white dark:bg-surface-900 border-r border-surface-100 dark:border-surface-800 z-40 shadow-[1px_0_0_0_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-[60px]' : 'w-[220px]'
      }`}>

        {/* Toggle Button */}
        <button
          onClick={() => {
            const next = !sidebarCollapsed;
            setSidebarCollapsed(next);
            try { localStorage.setItem('admin_sidebar_collapsed', String(next)); } catch {}
          }}
          aria-label={sidebarCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
          className="absolute top-[72px] -right-3 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-md text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all z-50"
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Sidebar Logo */}
        <div className={`flex items-center h-[60px] border-b border-surface-100 dark:border-surface-800 shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? 'justify-center px-3' : 'px-4 gap-3'
        }`}>
          {settingsForm.site_logo
            ? <img src={settingsForm.site_logo} alt="Logo" className="w-7 h-7 flex-shrink-0 object-contain rounded-lg" />
            : <div className="w-7 h-7 flex-shrink-0 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white text-[9px] font-black shadow-sm">MP</div>
          }
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black tracking-widest text-surface-900 dark:text-white uppercase truncate">MesoPro</p>
              <p className="text-[9px] font-medium text-surface-400 uppercase tracking-widest">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav Groups */}
        <div className="flex-1 overflow-y-auto py-3 no-scrollbar">
          {tabGroups.map((group, gi) => (
            <div key={gi} className={`${gi > 0 ? 'mt-1' : ''}`}>
              {/* Section label */}
              {!sidebarCollapsed && (
                <p className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-[0.12em] text-surface-400 select-none">
                  {group.label}
                </p>
              )}
              {sidebarCollapsed && gi > 0 && (
                <div className="mx-3 my-2 border-t border-surface-100 dark:border-surface-800" />
              )}
              <div className="px-2 space-y-0.5">
                {group.items.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); fetchTabData(tab.id); }}
                    title={sidebarCollapsed ? tab.label : undefined}
                    aria-label={tab.label}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    className={`w-full flex items-center gap-2.5 py-2.5 rounded-xl text-[11px] font-semibold transition-all relative group ${
                      sidebarCollapsed ? 'justify-center px-0' : 'px-3'
                    } ${
                      activeTab === tab.id
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400'
                        : 'text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/60 hover:text-surface-800 dark:hover:text-surface-200'
                    }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div layoutId="sidebarActiveTab" className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-brand-500 rounded-r-full" />
                    )}
                    <span className={`flex-shrink-0 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-brand-600 dark:text-brand-400' : ''}`}>
                      {tab.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span className="truncate flex-1 text-left">{tab.label}</span>
                    )}
                    {tab.badge ? (
                      sidebarCollapsed
                        ? <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5">{tab.badge}</span>
                        : <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 text-white font-black text-[9px] rounded-full flex items-center justify-center px-1 shrink-0">{tab.badge}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ─── Sidebar Footer: User Info + Actions ─── */}
        <div className="border-t border-surface-100 dark:border-surface-800 shrink-0">
          {/* Quick action buttons */}
          <div className={`flex items-center gap-1 px-2 py-2 ${sidebarCollapsed ? 'flex-col' : 'flex-row'}`}>
            <button
              disabled={isRefreshing}
              onClick={handleRefresh}
              title="Yenile"
              aria-label="Verileri yenile"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-all disabled:opacity-40 text-[10px] font-semibold"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-brand-500' : ''} />
              {!sidebarCollapsed && <span>{isRefreshing ? 'Yenileniyor' : 'Yenile'}</span>}
            </button>
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Koyu tema' : 'Açık tema'}
              aria-label="Tema değiştir"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-all text-[10px] font-semibold"
            >
              {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
              {!sidebarCollapsed && <span>{theme === 'light' ? 'Koyu' : 'Açık'}</span>}
            </button>
            <button
              onClick={() => navigate('/')}
              title="Mağazaya Dön"
              aria-label="Mağazaya dön"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-all text-[10px] font-semibold"
            >
              <Store size={13} />
              {!sidebarCollapsed && <span>Mağaza</span>}
            </button>
          </div>

          {/* User info + logout */}
          <div className={`px-2 pb-3 flex items-center gap-2.5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-[11px] font-black shadow-sm shrink-0">
              {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-surface-800 dark:text-surface-200 truncate">{user?.name || 'Yönetici'}</p>
                  <p className="text-[9px] text-surface-400 truncate">{user?.email || ''}</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Çıkış Yap"
                  aria-label="Çıkış Yap"
                  className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0"
                >
                  <LogOut size={14} />
                </button>
              </>
            )}
            {sidebarCollapsed && (
              <button
                onClick={handleLogout}
                title="Çıkış Yap"
                className="hidden"
              />
            )}
          </div>
          {sidebarCollapsed && (
            <div className="px-2 pb-3">
              <button
                onClick={handleLogout}
                title="Çıkış Yap"
                className="w-full flex items-center justify-center py-2 rounded-xl text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Top Navbar ─── */}
      <header className={`fixed top-0 right-0 h-[60px] bg-white/90 dark:bg-surface-900/90 backdrop-blur-md border-b border-surface-100 dark:border-surface-800 z-30 flex items-center px-5 gap-4 transition-all duration-300 ${
        sidebarCollapsed ? 'left-[60px]' : 'left-[220px]'
      }`}>
        {/* Page title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-black text-surface-900 dark:text-white tracking-tight truncate">{activeTabLabel}</h1>
          <p className="text-[10px] text-surface-400 font-medium hidden sm:block">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Last refreshed */}
        {lastFetchedAt && (
          <span className="hidden md:flex items-center gap-1 text-[10px] text-surface-400 font-medium">
            <RefreshCw size={10} />
            {lastFetchedAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifPanel((p: boolean) => !p)}
            aria-label="Bildirimler"
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-900 dark:hover:text-white transition-all"
          >
            <Bell size={15} />
            {totalNotifCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5">
                {totalNotifCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {showNotifPanel && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-700 shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                  <p className="text-xs font-black text-surface-800 dark:text-surface-200">Bildirimler</p>
                </div>
                <div className="p-2 space-y-1">
                  {notifications.newOrders > 0 && (
                    <button onClick={() => { setShowNotifPanel(false); setActiveTab('orders'); fetchTabData('orders'); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-left">
                      <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center shrink-0"><ShoppingBag size={14} /></span>
                      <div>
                        <p className="text-xs font-semibold text-surface-800 dark:text-surface-200"><span className="font-black text-amber-600">{notifications.newOrders}</span> yeni sipariş</p>
                        <p className="text-[10px] text-surface-400">Son 24 saatte</p>
                      </div>
                    </button>
                  )}
                  {notifications.unreadMessages > 0 && (
                    <button onClick={() => { setShowNotifPanel(false); setActiveTab('messages'); fetchTabData('messages'); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-left">
                      <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0"><MessageSquare size={14} /></span>
                      <div>
                        <p className="text-xs font-semibold text-surface-800 dark:text-surface-200"><span className="font-black text-blue-600">{notifications.unreadMessages}</span> okunmamış mesaj</p>
                        <p className="text-[10px] text-surface-400">Yanıtlanmayı bekliyor</p>
                      </div>
                    </button>
                  )}
                  {notifications.lowStock > 0 && (
                    <button onClick={() => { setShowNotifPanel(false); setActiveTab('products'); fetchTabData('products'); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-left">
                      <span className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center shrink-0"><TriangleAlert size={14} /></span>
                      <div>
                        <p className="text-xs font-semibold text-surface-800 dark:text-surface-200"><span className="font-black text-red-500">{notifications.lowStock}</span> ürün düşük stokta</p>
                        <p className="text-[10px] text-surface-400">Stok kontrolü gerekiyor</p>
                      </div>
                    </button>
                  )}
                  {totalNotifCount === 0 && (
                    <div className="py-6 text-center">
                      <CheckCircle2 size={24} className="mx-auto mb-2 text-brand-400" />
                      <p className="text-xs text-surface-400 font-medium">Her şey yolunda!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar in navbar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-surface-100 dark:border-surface-800">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-bold text-surface-800 dark:text-surface-200 leading-tight">{user?.name || 'Yönetici'}</p>
            <p className="text-[9px] text-surface-400">Admin</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-[11px] font-black shadow-sm">
            {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-[60px]' : 'ml-[220px]'
      }`}>
        <div className="max-w-[1700px] mx-auto px-4 md:px-8 lg:px-10 pt-[76px] pb-12">

        {isInitialLoading ? (
          <div className="animate-pulse space-y-8">
            <div className="space-y-3">
              <div className="h-8 bg-surface-200 dark:bg-surface-800 rounded-xl w-1/4" />
              <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded-lg w-1/3" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-surface-100 dark:bg-surface-800/50 rounded-3xl" />)}
            </div>
            <div className="h-96 bg-surface-100 dark:bg-surface-800/50 rounded-3xl" />
          </div>
        ) : (
          <>
          <AnimatePresence mode="wait">

            {/* ─ ────────────────────────────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {/* Header + Date Range Picker */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-surface-900 dark:text-white tracking-tight">
                    Hoş geldiniz, {user?.name?.split(' ')[0] || 'Admin'} 👋
                  </h2>
                  <p className="text-sm text-surface-400 mt-0.5">Genel duruma hızlı bakış</p>
                </div>
                <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800/80 rounded-xl p-1 self-start sm:self-auto">
                  {(['today', '7d', '30d', '90d'] as const).map(r => (
                    <button key={r} onClick={() => setAnalyticsRange(r)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${analyticsRange === r ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' : 'text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'}`}>
                      {r === 'today' ? 'Bugün' : r === '7d' ? '7G' : r === '30d' ? '30G' : '90G'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Low Stock Alert */}
              {notifications.lowStock > 0 && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
                  <TriangleAlert size={16} className="text-red-500 shrink-0" />
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                    <span className="font-black">{notifications.lowStock}</span> ürün düşük stokta (5 veya altı)
                  </p>
                  <button onClick={() => setActiveTab('products')} className="ml-auto text-xs font-bold text-red-600 dark:text-red-400 underline">Görüntüle</button>
                </div>
              )}

              {/* KPI Cards */}
              {analyticsLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-surface-100 dark:bg-surface-800/50 rounded-3xl animate-pulse" />)}
                </div>
              ) : analytics ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Toplam Gelir', value: `₺${analytics.kpis.revenue.toLocaleString()}`, change: analytics.kpis.revenueChange, icon: <TrendingUp size={18} />, color: 'brand' },
                    { label: 'Sipariş Sayısı', value: String(analytics.kpis.orderCount), change: analytics.kpis.orderChange, icon: <ShoppingBag size={18} />, color: 'blue' },
                    { label: 'Ort. Sipariş', value: `₺${Math.round(analytics.kpis.avgOrder).toLocaleString()}`, change: analytics.kpis.avgOrderChange, icon: <BarChart3 size={18} />, color: 'purple' },
                    { label: 'Yeni Müşteri', value: String(analytics.kpis.newCustomers), change: analytics.kpis.newCustomerChange, icon: <Users size={18} />, color: 'amber' },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800 p-5 shadow-sm">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                        kpi.color === 'brand' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600' :
                        kpi.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                        kpi.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' :
                        'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                      }`}>{kpi.icon}</div>
                      <p className="text-2xl font-black text-surface-900 dark:text-white leading-tight">{kpi.value}</p>
                      <p className="text-xs text-surface-500 font-medium mt-0.5">{kpi.label}</p>
                      <p className={`text-[10px] font-bold mt-1 ${kpi.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(1)}% önceki dönem
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Bekleyen', value: pendingCount, icon: <Clock size={18} />, color: 'amber' },
                    { label: 'Teslim Edilen', value: deliveredCount, icon: <CheckCircle2 size={18} />, color: 'blue' },
                    { label: 'Bugün', value: todayOrders, icon: <ShoppingBag size={18} />, color: 'purple' },
                    { label: 'Toplam Gelir', value: `₺${totalRevenue.toLocaleString()}`, icon: <TrendingUp size={18} />, color: 'brand' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-surface-900 p-5 rounded-3xl border border-surface-100 dark:border-surface-800 shadow-sm">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                        stat.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                        stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                        stat.color === 'brand' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600' :
                        'bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                      }`}>{stat.icon}</div>
                      <p className="text-2xl font-black text-surface-900 dark:text-white">{stat.value}</p>
                      <p className="text-xs text-surface-500 font-medium mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-surface-900 dark:text-white mb-6">
                    {analytics ? 'Günlük Gelir' : 'Aylık Gelir (Son 6 Ay)'}
                  </h3>
                  {analytics ? (() => {
                    const last14 = analytics.revenueByDay.slice(-14);
                    const maxRev = Math.max(...last14.map(d => Number(d.revenue)), 1);
                    return (
                      <div className="flex items-end gap-1.5 h-36">
                        {last14.map(d => (
                          <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full bg-brand-500 dark:bg-brand-600 rounded-t transition-all duration-700" style={{ height: `${Math.max((Number(d.revenue) / maxRev) * 120, Number(d.revenue) > 0 ? 4 : 0)}px` }} title={`₺${Number(d.revenue).toLocaleString()}`} />
                            <span className="text-[8px] font-bold text-surface-400">{d.day.slice(5)}</span>
                          </div>
                        ))}
                        {last14.length === 0 && <p className="text-sm text-surface-400 m-auto">Veri yok</p>}
                      </div>
                    );
                  })() : (() => {
                    const last6Months = Array.from({ length: 6 }, (_, i) => {
                      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i));
                      return { label: d.toLocaleString('tr-TR', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() };
                    }).map(m => ({
                      ...m,
                      revenue: orders.filter(o => { const od = new Date(o.createdAt); return od.getFullYear() === m.year && od.getMonth() === m.month; }).reduce((s, o) => s + o.total, 0),
                    }));
                    const maxRevenue = Math.max(...last6Months.map(m => m.revenue), 1);
                    return (
                      <div className="flex items-end gap-2 h-36">
                        {last6Months.map(m => (
                          <div key={`${m.year}-${m.month}`} className="flex-1 flex flex-col items-center gap-1.5">
                            <span className="text-[9px] font-bold text-surface-400 leading-none">
                              {m.revenue > 0 ? `₺${m.revenue >= 1000 ? `${(m.revenue / 1000).toFixed(0)}K` : m.revenue}` : ''}
                            </span>
                            <div className="w-full bg-brand-500 dark:bg-brand-600 rounded-t-lg transition-all duration-700" style={{ height: `${Math.max((m.revenue / maxRevenue) * 100, m.revenue > 0 ? 4 : 0)}px` }} />
                            <span className="text-[9px] font-bold text-surface-400 uppercase">{m.label}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Order Status Breakdown */}
                <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-surface-900 dark:text-white mb-6">Sipariş Durumu</h3>
                  {(() => {
                    const statusConfig = [
                      { key: 'pending', label: 'Bekliyor', color: 'bg-amber-500' },
                      { key: 'confirmed', label: 'Onaylandı', color: 'bg-blue-500' },
                      { key: 'shipped', label: 'Kargoda', color: 'bg-purple-500' },
                      { key: 'delivered', label: 'Teslim', color: 'bg-brand-500' },
                      { key: 'cancelled', label: 'İptal', color: 'bg-red-400' },
                    ];
                    const breakdown = analytics?.statusBreakdown;
                    const total = breakdown
                      ? Object.values(breakdown).reduce((s: number, v) => s + Number(v), 0)
                      : orders.length;
                    if (total === 0) return <p className="text-surface-400 text-sm">Henüz sipariş yok.</p>;
                    return (
                      <div className="space-y-3">
                        {statusConfig.map(s => {
                          const count = breakdown ? (Number(breakdown[s.key]) || 0) : orders.filter(o => o.status === s.key).length;
                          const pct = total > 0 ? Math.round(count / total * 100) : 0;
                          return (
                            <div key={s.key}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-surface-600 dark:text-surface-400">{s.label}</span>
                                <span className="text-xs font-black text-surface-900 dark:text-white">{count} <span className="text-surface-400 font-medium">({pct}%)</span></span>
                              </div>
                              <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Top Products + Audit Log */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 5 Products */}
                <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-surface-900 dark:text-white mb-4">En Çok Satan Ürünler</h3>
                  {(() => {
                    const top5 = analytics?.topProducts ?? (() => {
                      const m = new Map<string, { name: string; qty: number; revenue: number }>();
                      orders.forEach(order => order.items.forEach((item: any) => {
                        const ex = m.get(item.productId) || { name: item.productName, qty: 0, revenue: 0 };
                        m.set(item.productId, { name: item.productName, qty: ex.qty + item.quantity, revenue: ex.revenue + item.price * item.quantity });
                      }));
                      return Array.from(m.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
                    })();
                    if (top5.length === 0) return <p className="text-surface-400 text-sm">Henüz satış yok.</p>;
                    const maxQ = top5[0].qty;
                    return (
                      <div className="space-y-3">
                        {top5.map((p, i) => (
                          <div key={p.name} className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-surface-400 w-4 text-right shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-surface-800 dark:text-surface-200 truncate">{p.name}</span>
                                <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 ml-2 shrink-0">{p.qty} adet</span>
                              </div>
                              <div className="h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(p.qty / maxQ) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Audit Log Timeline */}
                <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-surface-900 dark:text-white">Son Aktiviteler</h3>
                    {auditLog.length > 0 && (
                      <button onClick={() => setShowAuditModal(true)} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">Tümü</button>
                    )}
                  </div>
                  {auditLog.length === 0 ? (
                    <p className="text-surface-400 text-sm">Henüz aktivite yok.</p>
                  ) : (
                    <div className="space-y-3">
                      {auditLog.slice(0, 6).map(entry => (
                        <div key={entry.id} className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            entry.action === 'create' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' :
                            entry.action === 'delete' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' :
                            'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          }`}>
                            {entry.action === 'create' ? <Plus size={13} /> : entry.action === 'delete' ? <Trash2 size={13} /> : <Activity size={13} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-surface-800 dark:text-surface-200 truncate">
                              <span className="font-black">{entry.adminName}</span> {entry.action === 'create' ? 'oluşturdu' : entry.action === 'delete' ? 'sildi' : 'güncelledi'} · {entry.resource}
                              {entry.detail ? <span className="text-surface-500 font-normal"> — {entry.detail}</span> : null}
                            </p>
                            <p className="text-[10px] text-surface-400">{new Date(entry.createdAt).toLocaleString('tr-TR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────────────────────── ORDERS TAB ─────────────────────── */}
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="space-y-0.5">
                  <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tight">Sipariş Yönetimi</h2>
                  <p className="text-xs text-surface-400 font-medium">{orders.length} toplam sipariş</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                   <div className="relative flex-1 sm:flex-none">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input type="text" placeholder="Sipariş ara..." value={searchOrders} onChange={e => setSearchOrders(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white sm:w-48 transition-all" />
                  </div>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white">
                    <option value="all">Tüm Durumlar</option>
                    <option value="pending">Bekliyor</option>
                    <option value="confirmed">Onaylandı</option>
                    <option value="shipped">Kargoda</option>
                    <option value="delivered">Teslim Edildi</option>
                    <option value="cancelled">İptal</option>
                  </select>
                  <button onClick={handleExportOrders} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                    <Download size={14} /> CSV İndir
                  </button>
                </div>
              </div>

              {/* Bulk Order Actions Toolbar */}
              <AnimatePresence>
                {selectedOrders.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-wrap items-center gap-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-2xl px-4 py-3">
                    <span className="text-sm font-bold text-brand-700 dark:text-brand-300">{selectedOrders.length} sipariş seçili</span>
                    <select value={bulkOrderStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBulkOrderStatus(e.target.value as Order['status'])} className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-1.5 text-xs font-bold dark:text-white focus:outline-none">
                      <option value="confirmed">Onaylandı</option>
                      <option value="shipped">Kargoya Verildi</option>
                      <option value="delivered">Teslim Edildi</option>
                      <option value="cancelled">İptal</option>
                    </select>
                    <button onClick={handleBulkOrderStatus} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-colors">Uygula</button>
                    <button onClick={() => setSelectedOrders([])} className="ml-auto text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">Temizle</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {filteredOrders.length === 0 ? (
                <div className="bg-white dark:bg-surface-900 p-16 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 text-center">
                  <ShoppingBag size={48} className="mx-auto text-surface-200 dark:text-surface-800 mb-4" />
                  <p className="text-surface-500 font-medium">Sipariş bulunamadı.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`bg-white dark:bg-surface-900 p-6 rounded-[2.5rem] border shadow-sm hover:shadow-xl hover:shadow-surface-200/50 dark:hover:shadow-black/50 transition-all ${selectedOrders.includes(order.id) ? 'border-brand-400 dark:border-brand-600' : 'border-surface-100 dark:border-surface-800'}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <button
                              onClick={() => setSelectedOrders((prev: string[]) => prev.includes(order.id) ? prev.filter((id: string) => id !== order.id) : [...prev, order.id])}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${selectedOrders.includes(order.id) ? 'bg-brand-500 border-brand-500' : 'border-surface-300 dark:border-surface-600'}`}
                            >
                              {selectedOrders.includes(order.id) && <span className="text-white text-[9px] font-black">✓</span>}
                            </button>
                            <h3 className="font-bold text-lg text-surface-900 dark:text-white">{order.customerName}</h3>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                              order.status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                              order.status === 'confirmed' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                              order.status === 'shipped' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                              order.status === 'delivered' ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400' :
                              'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            }`}>{order.status === 'pending' ? 'Bekliyor' : order.status === 'confirmed' ? 'Onaylandı' : order.status === 'shipped' ? 'Kargoda' : order.status === 'delivered' ? 'Teslim Edildi' : 'İptal'}</span>
                          </div>
                          <div className="text-xs text-surface-500 flex flex-wrap gap-3">
                            <span className="flex items-center gap-1"><Mail size={12} /> {order.email}</span>
                            <span className="flex items-center gap-1"><Phone size={12} /> {order.phone}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleString('tr-TR')}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {order.items.map((item, idx) => (
                              <span key={idx} className="text-[10px] font-bold text-surface-500 bg-surface-50 dark:bg-surface-800/50 px-2 py-1 rounded-lg border border-surface-100 dark:border-surface-800">{item.productName} x{item.quantity}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <p className="text-xl font-black text-surface-900 dark:text-white">₺{order.total.toLocaleString()}</p>
                          <div className="flex gap-2">
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <select
                                value={order.status}
                                disabled={isUpdatingOrder === order.id}
                                onChange={e => updateStatus(order.id, e.target.value as Order['status'])}
                                className="bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white disabled:opacity-50"
                              >
                                <option value="pending">Bekliyor</option>
                                <option value="confirmed">Onaylandı</option>
                                <option value="shipped">Kargoda</option>
                                <option value="delivered">Teslim Edildi</option>
                                <option value="cancelled">İptal</option>
                              </select>
                            )}
                            <button onClick={() => { setSelectedOrder(order); setOrderNotesDraft(order.notes || ''); }} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 rounded-xl transition-all">
                              Detay
                            </button>
                          </div>
                        </div>
                      </div>
                      {selectedOrder?.id === order.id && (
                        <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800 text-xs text-surface-500 flex gap-4 flex-wrap">
                          <span><strong className="text-surface-700 dark:text-surface-300">Adres:</strong> {order.address}</span>
                          <span><strong className="text-surface-700 dark:text-surface-300">Ödeme:</strong> {order.paymentMethod}</span>
                          {order.notes && <span><strong className="text-surface-700 dark:text-surface-300">Not:</strong> {order.notes}</span>}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Order Detail Modal */}
          <AnimatePresence>
            {selectedOrder && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedOrder(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 20 }}
                  className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-surface-900 dark:text-white">Sipariş Detayı</h3>
                      <p className="text-xs text-surface-500 mt-0.5">#{selectedOrder.id}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 transition-colors"><X size={18} /></button>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">Müşteri</p>
                        <p className="text-sm font-bold text-surface-900 dark:text-white">{selectedOrder.customerName}</p>
                        <p className="text-xs text-surface-500">{selectedOrder.email}</p>
                        <p className="text-xs text-surface-500">{selectedOrder.phone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">Teslimat Adresi</p>
                        <p className="text-xs text-surface-600 dark:text-surface-400">{selectedOrder.address}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">Ödeme</p>
                        <p className="text-sm text-surface-700 dark:text-surface-300">{selectedOrder.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">Tarih</p>
                        <p className="text-xs text-surface-600 dark:text-surface-400">{new Date(selectedOrder.createdAt).toLocaleString('tr-TR')}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Durum Güncelle</p>
                      <select
                        value={selectedOrder.status}
                        disabled={isUpdatingOrder === selectedOrder.id}
                        onChange={e => {
                          const newStatus = e.target.value as Order['status'];
                          updateStatus(selectedOrder.id, newStatus);
                          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
                        }}
                        className="bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white w-full"
                      >
                        <option value="pending">Bekliyor</option>
                        <option value="confirmed">Onaylandı</option>
                        <option value="shipped">Kargoda</option>
                        <option value="delivered">Teslim Edildi</option>
                        <option value="cancelled">İptal</option>
                      </select>
                    </div>

                    {/* Order Items */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Sipariş Kalemleri</p>
                      <div className="space-y-2">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b border-surface-50 dark:border-surface-800 last:border-0">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{item.productName}</p>
                              <p className="text-xs text-surface-500">{item.quantity} adet × ₺{item.price.toLocaleString()}</p>
                            </div>
                            <p className="text-sm font-black text-surface-900 dark:text-white">₺{(item.quantity * item.price).toLocaleString()}</p>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-sm font-black text-surface-900 dark:text-white">Toplam</span>
                          <span className="text-xl font-black text-brand-600 dark:text-brand-400">₺{selectedOrder.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Admin Notu</p>
                      <textarea
                        rows={3}
                        value={orderNotesDraft}
                        onChange={e => setOrderNotesDraft(e.target.value)}
                        placeholder="Bu siparişe özel not ekle..."
                        className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white resize-none"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSaveOrderNotes}
                          disabled={isSavingNotes}
                          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                        >
                          {isSavingNotes ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                          Notu Kaydet
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─────────────────────── PRODUCTS TAB ─────────────────────── */}
          {activeTab === 'products' && (
            <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="space-y-0.5">
                  <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tight">Ürün Yönetimi</h2>
                  <p className="text-xs text-surface-400 font-medium">{filteredProducts.length} ürün listeleniyor</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
                  <div className="relative flex-1 sm:flex-none min-w-[140px]">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input type="text" placeholder="Ürün ara..." value={searchProducts} onChange={e => setSearchProducts(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white sm:w-48 transition-all" />
                  </div>
                  <ShinyButton className="flex-1 sm:flex-none justify-center whitespace-nowrap" onClick={() => { setEditingProduct({ id: `prod-${Date.now()}`, name: '', brand: '', category: '', problem: [], basePrice: 0, image: 'https://picsum.photos/seed/new/600/600', description: '', ingredients: '', indications: '', applicationArea: '', warnings: '' }); setIsAddingProduct(true); }}>
                    <Plus size={16} /> Yeni Ürün
                  </ShinyButton>
                </div>
              </div>

              {/* Bulk Actions Toolbar */}
              <AnimatePresence>
                {selectedProducts.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-2xl px-4 py-3">
                    <span className="text-sm font-bold text-brand-700 dark:text-brand-300">{selectedProducts.length} ürün seçili</span>
                    <button onClick={handleBulkDeleteProducts} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors"><Trash2 size={12} /> Sil</button>
                    <button onClick={() => setSelectedProducts([])} className="ml-auto text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">Seçimi Temizle</button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-3 sm:gap-6">
                {filteredProducts.map(product => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`bg-white dark:bg-surface-900 rounded-[2.5rem] border overflow-hidden group hover:shadow-2xl hover:shadow-surface-200/50 dark:hover:shadow-black/50 transition-all duration-500 ${selectedProducts.includes(product.id) ? 'border-brand-400 dark:border-brand-600' : 'border-surface-100 dark:border-surface-800'}`}>
                    <div className="aspect-[16/10] relative overflow-hidden bg-surface-50 dark:bg-surface-800">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                      <button
                        onClick={() => setSelectedProducts((prev: string[]) => prev.includes(product.id) ? prev.filter((id: string) => id !== product.id) : [...prev, product.id])}
                        className={`absolute top-3 left-3 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedProducts.includes(product.id) ? 'bg-brand-500 border-brand-500' : 'bg-white/80 border-surface-300 opacity-0 group-hover:opacity-100'}`}
                      >
                        {selectedProducts.includes(product.id) && <span className="text-white text-[10px] font-black">✓</span>}
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">{product.brand}</span>
                        <span className="text-sm font-black text-surface-900 dark:text-white">₺{product.basePrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-surface-900 dark:text-white text-base line-clamp-1 flex-1">{product.name}</h3>
                        <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          product.inStock === false || product.stockQuantity === 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                          (product.stockQuantity !== undefined && product.stockQuantity !== -1 && product.stockQuantity <= 5) ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                          'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {product.inStock === false || product.stockQuantity === 0 ? 'Tükendi' :
                           (product.stockQuantity !== undefined && product.stockQuantity !== -1 && product.stockQuantity <= 5) ? `Az Kaldı (${product.stockQuantity})` :
                           'Stokta'}
                        </span>
                      </div>
                      <p className="text-xs text-surface-500 dark:text-surface-500 line-clamp-2 leading-relaxed mb-5">{product.description}</p>
                      
                      <div className="flex items-center justify-end pt-4 border-t border-surface-50 dark:border-surface-800">
                         <div className="flex items-center gap-2">
                           <button onClick={(e) => { e.stopPropagation(); setEditingProduct(product); setIsAddingProduct(false); }} className="px-4 py-2.5 flex items-center gap-1.5 bg-brand-50 dark:bg-brand-900/10 hover:bg-brand-100 dark:hover:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-2xl transition-all text-[10px] font-bold uppercase tracking-widest border border-brand-100 dark:border-brand-900/30"><Edit2 size={12} /> Düzenle</button>
                           <button onClick={(e) => { e.stopPropagation(); handleDuplicateProduct(product); }} title="Kopyala" className="p-2.5 flex items-center justify-center bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 dark:text-surface-400 rounded-2xl transition-all border border-surface-100 dark:border-surface-700"><Copy size={14} /></button>
                           <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }} className="p-2.5 flex items-center justify-center bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl transition-all border border-red-100 dark:border-red-900/30 shadow-sm"><Trash2 size={14} /></button>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─ ────────────────────────────────────────────────────────────────────── */}
          {activeTab === 'media' && (
            <motion.div key="media" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tight">Medya Kütüphanesi</h2>
                  <p className="text-xs text-surface-400 font-medium">{media.length} görsel yüklendi</p>
                </div>
                <div className="relative overflow-hidden w-full sm:w-auto">
                  <input type="file" multiple accept="image/*" onChange={handleMediaTabUpload} disabled={isUploadingMediaTab} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <ShinyButton className="pointer-events-none w-full justify-center">
                    {isUploadingMediaTab ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Görsel Yükle
                  </ShinyButton>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                {media.length === 0 ? (
                  <div className="col-span-full text-center py-12 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-3xl text-surface-500 bg-surface-50/50 dark:bg-surface-900/50">
                    <ImageIcon className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    Henüz görsel yüklenmedi
                  </div>
                ) : (
                  media.map(m => (
                    <div key={m.id} className="relative group aspect-square rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800">
                      <img src={m.url} alt="media" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => { navigator.clipboard.writeText(m.url); addToast('Bağlantı kopyalandı', 'success'); }} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-colors" title="Kopyala">
                          <Link size={16} />
                        </button>
                        <button onClick={() => handleDeleteMedia(m.id)} className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl backdrop-blur-md transition-colors" title="Sil">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ──────────────────────────────────────────────────────────────────────── */}
          {activeTab === 'messages' && (
            <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tight">İletişim Mesajları</h2>
                  <p className="text-xs text-surface-400 font-medium">{messages.length} mesaj, {messages.filter(m => !m.is_read).length} okunmamış</p>
                </div>
              </div>
              <div className="grid gap-4">
                {messages.length === 0 ? (
                  <div className="bg-white dark:bg-surface-900 p-16 rounded-3xl border border-surface-200 dark:border-surface-800 text-center">
                    <MessageSquare size={48} className="mx-auto text-surface-200 dark:text-surface-800 mb-4" />
                    <p className="text-surface-500 font-medium">Henüz mesaj gelmedi.</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-7 rounded-[2.5rem] border ${msg.is_read ? 'bg-white dark:bg-surface-900 border-surface-100 dark:border-surface-800' : 'bg-brand-50 dark:bg-brand-900/10 border-brand-100 dark:border-brand-800/30'} flex flex-col md:flex-row gap-6 justify-between items-start transition-all shadow-sm hover:shadow-xl hover:shadow-surface-200/50 dark:hover:shadow-black/50 group`}>
                      <div className="flex-1 w-full min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="font-bold text-xl text-surface-900 dark:text-white flex items-center gap-2">
                             {msg.name}
                             {!msg.is_read && <span className="bg-brand-500 text-white text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest leading-none">Yeni Mesaj</span>}
                          </h4>
                        </div>
                        <div className="text-xs text-surface-500 dark:text-surface-500 mb-5 font-bold flex items-center gap-3 opacity-90 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-white/50 dark:bg-surface-800/50 px-2 py-1 rounded-lg border border-surface-100 dark:border-surface-800"><Mail size={12} className="text-brand-500" /> {msg.email}</div>
                          <div className="flex items-center gap-1.5 bg-white/50 dark:bg-surface-800/50 px-2 py-1 rounded-lg border border-surface-100 dark:border-surface-800"><Phone size={12} className="text-brand-500" /> {msg.phone || 'Girilmedi'}</div>
                          <div className="flex items-center gap-1.5 opacity-60"><Clock size={12} /> {new Date(msg.created_at).toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="bg-white/60 dark:bg-surface-950/40 border border-surface-50 dark:border-surface-800 p-6 rounded-[2rem] text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                          {msg.message}
                        </div>
                      </div>
                      <div className="flex md:flex-col items-stretch gap-2.5 shrink-0 w-full md:w-auto mt-6 md:mt-2">
                        {!msg.is_read && (
                          <button onClick={async () => { await markMessageRead(msg.id); setMessages(messages.map(m => m.id === msg.id ? { ...m, is_read: true } : m)); }} className="flex-1 md:flex-none px-5 py-3 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded-2xl text-[10px] font-black hover:bg-brand-200 dark:hover:bg-brand-900/50 transition-all uppercase tracking-widest flex justify-center whitespace-nowrap border border-brand-200 dark:border-brand-800">Okundu</button>
                        )}
                        <a href={`mailto:${msg.email}`} onClick={() => { if(!msg.is_read) { markMessageRead(msg.id).then(() => setMessages(messages.map(m => m.id === msg.id ? { ...m, is_read: true } : m))); } }} className="flex-1 md:flex-none px-5 py-3 bg-surface-100 dark:bg-surface-800 text-brand-600 dark:text-brand-400 rounded-2xl text-[10px] font-black hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all uppercase tracking-widest flex items-center justify-center whitespace-nowrap gap-2 border border-surface-200 dark:border-surface-700">Yanıtla</a>
                        <button onClick={async () => { if(window.confirm('Bu mesajı tamamen silmek istediğinize emin misiniz?')){ await deleteMessage(msg.id); setMessages(messages.filter(m => m.id !== msg.id)); } }} className="flex-1 md:flex-none p-3.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl transition-all border border-red-100 dark:border-red-900/30 flex items-center justify-center shadow-sm hover:bg-red-100"><Trash2 size={18} /></button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ─ ────────────────────────────────────────────────────────────────────── */}
          {activeTab === 'brands' && (
            <motion.div key="brands" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tight">Marka Yönetimi</h2>
                  <p className="text-xs text-surface-400 font-medium">{brands.length} markanız bulunuyor</p>
                </div>
                <ShinyButton className="w-full sm:w-auto justify-center" onClick={() => setIsAddingBrand(true)}>
                  <Plus size={16} /> Yeni Marka Ekle
                </ShinyButton>
              </div>

              {isAddingBrand && (
                <form onSubmit={handleCreateBrand} className="bg-white dark:bg-surface-900 p-6 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 space-y-4 shadow-sm mb-6">
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">{editingBrand ? 'Marka Düzenle' : 'Yeni Marka Ekle'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Marka Adı *</label>
                      <input type="text" value={newBrand.name} onChange={e => setNewBrand({ ...newBrand, name: e.target.value })} placeholder="Örn: Filmed" required className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Logo URL / Görsel</label>
                      <div className="flex gap-2">
                        <input type="text" value={newBrand.logo} onChange={e => setNewBrand({ ...newBrand, logo: e.target.value })} placeholder="https://..." className="flex-1 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none" />
                        <button type="button" onClick={() => { setIsSelectingLogoFromMedia(true); setIsMediaModalOpen(true); }} className="px-4 py-3 bg-brand-50 dark:bg-brand-900/10 hover:bg-brand-100 dark:hover:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap">
                          Seç
                        </button>
                        <div className="relative">
                          <input type="file" accept="image/*" onChange={handleBrandLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          <button type="button" className="px-4 py-3 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 rounded-2xl font-bold hover:bg-surface-200 dark:hover:bg-surface-700 transition-all flex items-center justify-center">
                            {isUploadingBrandLogo ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={isSavingBrand || !newBrand.name.trim()} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2">
                      {isSavingBrand ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {editingBrand ? 'Güncelle' : 'Kaydet'}
                    </button>
                    <button type="button" onClick={() => { setIsAddingBrand(false); setEditingBrand(null); setNewBrand({ name: '', logo: '' }); }} className="px-5 py-2.5 text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                      İptal
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6">
                {brands.length === 0 ? (
                  <div className="col-span-full py-20 bg-white dark:bg-surface-900 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 text-center">
                    <Store size={48} className="mx-auto text-surface-200 dark:text-surface-800 mb-4" />
                    <p className="text-surface-500">Henüz marka eklenmedi.</p>
                  </div>
                ) : (
                  brands.map(brand => (
                    <div key={brand.id} className="bg-white dark:bg-surface-900 p-6 rounded-[2.5rem] border border-surface-100 dark:border-surface-800 shadow-sm flex flex-col items-center text-center group transition-all hover:shadow-xl hover:shadow-surface-200/50 dark:hover:shadow-black/50">
                      <div className="w-24 h-24 rounded-3xl bg-surface-50 dark:bg-surface-950 border border-surface-100 dark:border-surface-800 flex items-center justify-center mb-5 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                        {brand.logo ? (
                          <img src={brand.logo} className="w-full h-full object-contain p-2" />
                        ) : (
                          <Store size={36} className="text-surface-200" />
                        )}
                      </div>
                      <h3 className="font-black text-lg text-surface-900 dark:text-white uppercase tracking-tighter mb-5">{brand.name}</h3>
                      <div className="w-full flex gap-2">
                        <button onClick={() => handleEditBrand(brand)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-brand-600 bg-brand-50 dark:bg-brand-900/10 hover:bg-brand-100 dark:hover:bg-brand-900/20 rounded-2xl transition-all border border-brand-100 dark:border-brand-900/30 flex items-center justify-center gap-1.5">
                          <Edit2 size={12} /> Düzenle
                        </button>
                        <button onClick={() => handleDeleteBrand(brand.id)} className="p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl transition-all border border-red-100 dark:border-red-900/10 flex items-center justify-center shadow-sm hover:bg-red-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ─────────────────────── CATEGORIES TAB ─────────────────────── */}
          {activeTab === 'categories' && (
            <motion.div key="categories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tight">Kategori Yönetimi</h2>
                  <p className="text-xs text-surface-400 font-medium">{categories.length} kategori listeleniyor</p>
                </div>
                <ShinyButton className="w-full sm:w-auto justify-center" onClick={() => { setIsAddingCategory(true); setEditingCategoryId(null); setCategoryForm({ name: '', image: '' }); }}>
                  <Plus size={16} /> Yeni Kategori
                </ShinyButton>
              </div>

              {isAddingCategory && (
                <div className="bg-white dark:bg-surface-900 p-6 rounded-3xl border border-surface-200 dark:border-surface-800 space-y-4">
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white">{editingCategoryId ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Kategori Adı *</label>
                      <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="Kategori adı..." className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Görsel / İkon</label>
                      <div className="flex gap-2">
                        <input type="text" value={categoryForm.image} onChange={e => handleImageIconPaste(e.target.value)} placeholder="URL veya material:icon_name" className="flex-1 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none" />
                        <div className="relative">
                          <input type="file" accept="image/*" onChange={handleCategoryImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          <button type="button" className="px-4 py-3 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 rounded-2xl text-sm font-bold hover:bg-surface-200 dark:hover:bg-surface-700 transition-all">
                            {isUploadingCategoryImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveCategory} disabled={isSavingCategory || !categoryForm.name.trim()} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold transition-all disabled:opacity-50">
                      {isSavingCategory ? 'Kaydediliyor...' : (editingCategoryId ? 'Güncelle' : 'Ekle')}
                    </button>
                    <button onClick={() => { setIsAddingCategory(false); setEditingCategoryId(null); setCategoryForm({ name: '', image: '' }); }} className="px-5 py-2.5 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-2xl text-sm font-bold transition-all">
                      İptal
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {categories.length === 0 ? (
                  <div className="col-span-full py-20 bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 text-center">
                    <Filter size={48} className="mx-auto text-surface-200 dark:text-surface-800 mb-4" />
                    <p className="text-surface-500">Henüz kategori eklenmedi.</p>
                  </div>
                ) : (
                  categories.map(cat => (
                    <div key={cat.id} className="bg-white dark:bg-surface-900 p-5 rounded-2xl border border-surface-100 dark:border-surface-800 shadow-sm flex flex-col items-center text-center group hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all">
                      {/* Icon */}
                      <div className="w-16 h-16 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700 flex items-center justify-center overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                        {cat.image ? (
                          cat.image.startsWith('material:') ? (
                            <span className="material-symbols-outlined text-3xl text-brand-500">{cat.image.replace('material:', '')}</span>
                          ) : (
                            <img src={cat.image} className="w-full h-full object-contain p-2" alt={cat.name} />
                          )
                        ) : (
                          <Filter size={26} className="text-surface-300" />
                        )}
                      </div>
                      {/* Name */}
                      <h3 className="font-bold text-sm text-surface-900 dark:text-white w-full leading-snug mb-4 line-clamp-2">{cat.name}</h3>
                      {/* Actions */}
                      <div className="flex gap-1.5 w-full mt-auto">
                        <button
                          onClick={() => { setEditingCategoryId(cat.id); setCategoryForm({ name: cat.name, image: cat.image }); setIsAddingCategory(true); }}
                          className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded-xl transition-all border border-brand-100 dark:border-brand-800 flex items-center justify-center gap-1"
                        >
                          <Edit2 size={11} /> Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-all border border-red-100 dark:border-red-900/20 flex items-center justify-center"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ─────────────────────── CAMPAIGNS TAB ─────────────────────── */}
          {activeTab === 'campaigns' && (
            <motion.div key="campaigns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tight">Kampanyalar & İndirimler</h2>
                  <p className="text-xs text-surface-400 font-medium max-w-2xl">Çeşitli indirim tekliflerinizi buradan yönetebilirsiniz.</p>
                </div>
                <ShinyButton
                  className="w-full sm:w-auto justify-center"
                  onClick={() => {
                    setEditingCampaign({ id: 0, name: '', type: 'volume', targetValue: '', discountType: 'percentage', discountValue: 0, minQuantity: 0, minAmount: 0, isActive: true, isStackable: true, couponCode: '', startDate: '', endDate: '', maxUsage: 0, currentUsage: 0, createdAt: '' });
                    setCampaignProductSearch('');
                    setCampaignCategorySearch('');
                    setIsAddingCampaign(true);
                  }}
                >
                  <Plus size={16} /> Yeni Kampanya
                </ShinyButton>
              </div>

              {campaigns.length === 0 ? (
                <div className="bg-white dark:bg-surface-900 p-16 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 text-center">
                  <Tag size={48} className="mx-auto text-surface-200 dark:text-surface-800 mb-4" />
                  <p className="text-surface-500 font-medium">Henüz kampanya eklenmedi.</p>
                  <p className="text-xs text-surface-400 mt-2">Yukarıdan yeni kampanya oluşturabilirsiniz.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {campaigns.map(c => (
                    <div key={c.id} className="bg-white dark:bg-surface-900 p-6 flex flex-col justify-between rounded-[2.5rem] border border-surface-100 dark:border-surface-800 shadow-sm relative group">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                           <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-1 rounded-lg uppercase tracking-widest">{c.type === 'volume' ? 'ADET BAZLI' : c.type === 'cart_total' ? 'SEPET TOPLAMI' : c.type === 'bogo' ? 'X AL Y ÖDE' : c.type === 'product' ? 'ÜRÜNE ÖZEL' : 'KATEGORİYE ÖZEL'}</span>
                           
                           {c.startDate && new Date(c.startDate) > new Date() ? (
                               <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20 px-2 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1">
                                 <Clock size={10} /> Gelecek
                               </span>
                             ) : c.endDate && new Date(c.endDate) < new Date() ? (
                               <span className="text-[10px] font-bold text-surface-600 bg-surface-100 dark:text-surface-400 dark:bg-surface-800 px-2 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1">
                                 <AlertCircle size={10} /> Bitti
                               </span>
                             ) : c.maxUsage > 0 && c.currentUsage >= c.maxUsage ? (
                               <span className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20 px-2 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1">
                                 <AlertCircle size={10} /> Limit Doldu
                               </span>
                             ) : (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleToggleCampaignActive(c.id, c.isActive); }}
                                 className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all border group ${
                                   c.isActive 
                                     ? 'bg-brand-50 border-brand-100 text-brand-600 dark:bg-brand-900/10 dark:border-brand-900/30 dark:text-brand-400' 
                                     : 'bg-surface-50 border-surface-200 text-surface-400 dark:bg-surface-800 dark:border-surface-700 dark:text-surface-500'
                                 }`}
                               >
                                 <div className={`w-6 h-3.5 rounded-full flex items-center px-0.5 transition-colors ${c.isActive ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'}`}>
                                   <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform ${c.isActive ? 'translate-x-2.5' : 'translate-x-0'}`} />
                                 </div>
                                 <span className="text-[10px] font-black uppercase tracking-widest">
                                   {c.isActive ? 'Aktif' : 'Pasif'}
                                 </span>
                               </button>
                             )}

                           {c.isStackable && <span title="Birleşebilir" className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-1 rounded-lg">Yığılabilir +</span>}
                           {c.couponCode && <span title="Kupon Kodu Gerektirir" className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20 px-1.5 py-1 rounded-lg flex items-center gap-1">🎫 {c.couponCode}</span>}
                        </div>
                        <h3 className="font-bold text-lg text-surface-900 dark:text-white leading-tight">{c.name}</h3>
                        <p className="text-surface-500 text-sm mt-1 flex flex-col gap-1 font-medium">
                          <span className="flex items-center gap-1"><Tag size={14} />{c.type === 'bogo' ? `${c.minQuantity} Al ${c.minQuantity - (c.bogoFreeQuantity || 1)} Öde` : c.discountType === 'percentage' ? `%${c.discountValue} İndirim` : `₺${c.discountValue} İndirim`}</span>
                          {c.maxUsage > 0 && <span className="text-[10px] opacity-70">Kullanım: {c.currentUsage} / {c.maxUsage}</span>}
                        </p>
                      </div>
                      <div className="flex gap-2 pt-4 border-t border-surface-100 dark:border-surface-800/50 mt-4">
                        <button onClick={() => { setEditingCampaign(c); setIsAddingCampaign(true); }} className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest bg-brand-50 dark:bg-brand-900/10 hover:bg-brand-100 dark:hover:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-xl transition-all border border-brand-100 dark:border-brand-900/30 flex justify-center items-center gap-1.5"><Edit2 size={12} /> Düzenle</button>
                        <button onClick={() => handleDuplicateCampaign(c)} title="Kopyala" className="w-10 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 dark:text-surface-400 rounded-xl transition-all border border-surface-100 dark:border-surface-700 flex items-center justify-center"><Copy size={14} /></button>
                        <button onClick={() => handleDeleteCampaign(c.id)} className="w-10 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl transition-all border border-red-100 dark:border-red-900/30 flex items-center justify-center shadow-sm"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ─────────────────────── CUSTOMERS TAB ─────────────────────── */}
          {activeTab === 'customers' && (
            <motion.div key="customers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tight">Müşteriler</h2>
                  <p className="text-xs text-surface-400 font-medium">Kayıtlı kullanıcılar ve sipariş geçmişleri.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input type="text" placeholder="İsim, e-posta veya telefon ara..." value={searchCustomers} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchCustomers(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl text-sm text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" />
                  </div>
                  <button onClick={handleExportCustomers} className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors shrink-0">
                    <Download size={14} /> CSV
                  </button>
                </div>
              </div>
              {customers.length === 0 ? (
                <div className="bg-white dark:bg-surface-900 p-16 rounded-[2.5rem] border border-surface-200 dark:border-surface-800 text-center">
                  <User size={48} className="mx-auto text-surface-200 dark:text-surface-800 mb-4" />
                  <p className="text-surface-500 font-medium">Henüz kayıtlı müşteri bulunmuyor.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-surface-900 rounded-[2.5rem] border border-surface-100 dark:border-surface-800 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50">
                          <th className="px-6 py-4 text-left text-[10px] font-black text-surface-400 uppercase tracking-widest">Müşteri</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-surface-400 uppercase tracking-widest hidden md:table-cell">İletişim</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-surface-400 uppercase tracking-widest hidden lg:table-cell">Kayıt Tarihi</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-surface-400 uppercase tracking-widest">Sipariş</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-surface-400 uppercase tracking-widest">Toplam Harcama</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.filter((c: AdminUser) => !searchCustomers || c.name.toLowerCase().includes(searchCustomers.toLowerCase()) || c.email.toLowerCase().includes(searchCustomers.toLowerCase()) || (c.phone || '').includes(searchCustomers)).map((c: AdminUser, i: number) => (
                          <tr key={c.id} onClick={() => handleOpenCustomer(c)} className={`border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-surface-50/30 dark:bg-surface-900/20'}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center shrink-0">
                                  <span className="text-brand-600 dark:text-brand-400 font-black text-sm">{c.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                  <p className="font-bold text-surface-900 dark:text-white text-sm">{c.name}</p>
                                  <p className="text-surface-400 text-xs">{c.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              <p className="text-surface-600 dark:text-surface-400 text-xs">{c.phone || '—'}</p>
                            </td>
                            <td className="px-6 py-4 hidden lg:table-cell">
                              <p className="text-surface-500 text-xs">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black ${c.orderCount > 0 ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'bg-surface-100 dark:bg-surface-800 text-surface-400'}`}>{c.orderCount}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-black text-surface-900 dark:text-white text-sm">₺{c.totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                    <p className="text-[11px] text-surface-400 font-medium">{customers.length} kayıtlı müşteri</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─────────────────────── SETTINGS TAB ─────────────────────── */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5 max-w-3xl">

              {/* ── Page header ── */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tight">Sistem Ayarları</h2>
                  <p className="text-xs text-surface-400 font-medium">Site genelinde geçerli temel yapılandırma</p>
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSavingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isSavingSettings ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>

              {/* ── Section 1: Site Kimliği ── */}
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                    <Store size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surface-800 dark:text-surface-200">Site Kimliği</p>
                    <p className="text-[10px] text-surface-400">Başlık ve görsel öğeler</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  {/* Site title */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Site Başlığı</label>
                    <input
                      type="text"
                      value={settingsForm.site_title || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettingsForm((f: Record<string, string>) => ({ ...f, site_title: e.target.value }))}
                      className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-shadow"
                      placeholder="MesoPro"
                    />
                  </div>

                  {/* Logo + Favicon in 2-col */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Logo */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Site Logosu</label>
                      {settingsForm.site_logo ? (
                        <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800">
                          <img src={settingsForm.site_logo} alt="Logo" className="h-10 w-10 object-contain rounded-lg bg-white dark:bg-surface-900 p-1 shrink-0 border border-surface-100 dark:border-surface-800" />
                          <span className="text-[10px] text-surface-400 truncate flex-1 font-mono">
                            {settingsForm.site_logo.length > 30 ? settingsForm.site_logo.slice(0, 30) + '…' : settingsForm.site_logo}
                          </span>
                          <button type="button" onClick={() => setSettingsForm((f: Record<string, string>) => ({ ...f, site_logo: '' }))} className="p-1 hover:text-red-500 text-surface-400 transition-colors shrink-0"><X size={13} /></button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 bg-surface-50 dark:bg-surface-950 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-xl cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 transition-colors group">
                          <div className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 transition-colors">
                            <Upload size={15} className="text-surface-400 group-hover:text-brand-500 transition-colors" />
                          </div>
                          <span className="text-xs text-surface-400 font-medium">Logo yükle</span>
                          <span className="text-[10px] text-surface-300 dark:text-surface-600">PNG, SVG önerilir</span>
                          <input type="file" accept="image/*" className="sr-only" onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0]; if (!file) return;
                            try { const url = await uploadImage(file); setSettingsForm((f: Record<string, string>) => ({ ...f, site_logo: url })); addToast('Logo yüklendi.', 'success'); }
                            catch { addToast('Logo yüklenemedi.', 'error'); }
                          }} />
                        </label>
                      )}
                      <input
                        type="url"
                        value={settingsForm.site_logo || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettingsForm((f: Record<string, string>) => ({ ...f, site_logo: e.target.value }))}
                        className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 dark:text-white outline-none font-mono"
                        placeholder="veya URL girin..."
                      />
                    </div>

                    {/* Favicon */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Favicon</label>
                      {settingsForm.favicon_url ? (
                        <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800">
                          <img src={settingsForm.favicon_url} alt="Favicon" className="h-10 w-10 object-contain rounded-lg bg-white dark:bg-surface-900 p-1 shrink-0 border border-surface-100 dark:border-surface-800" />
                          <span className="text-[10px] text-surface-400 truncate flex-1 font-mono">
                            {settingsForm.favicon_url.length > 30 ? settingsForm.favicon_url.slice(0, 30) + '…' : settingsForm.favicon_url}
                          </span>
                          <button type="button" onClick={() => setSettingsForm((f: Record<string, string>) => ({ ...f, favicon_url: '' }))} className="p-1 hover:text-red-500 text-surface-400 transition-colors shrink-0"><X size={13} /></button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 bg-surface-50 dark:bg-surface-950 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-xl cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 transition-colors group">
                          <div className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 transition-colors">
                            <Upload size={15} className="text-surface-400 group-hover:text-brand-500 transition-colors" />
                          </div>
                          <span className="text-xs text-surface-400 font-medium">Favicon yükle</span>
                          <span className="text-[10px] text-surface-300 dark:text-surface-600">ICO, PNG 32×32</span>
                          <input type="file" accept="image/*" className="sr-only" onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0]; if (!file) return;
                            try { const url = await uploadImage(file); setSettingsForm((f: Record<string, string>) => ({ ...f, favicon_url: url })); addToast('Favicon yüklendi.', 'success'); }
                            catch { addToast('Favicon yüklenemedi.', 'error'); }
                          }} />
                        </label>
                      )}
                      <input
                        type="url"
                        value={settingsForm.favicon_url || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettingsForm((f: Record<string, string>) => ({ ...f, favicon_url: e.target.value }))}
                        className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 dark:text-white outline-none font-mono"
                        placeholder="veya URL girin..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 2: İletişim Bilgileri ── */}
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Mail size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surface-800 dark:text-surface-200">İletişim Bilgileri</p>
                    <p className="text-[10px] text-surface-400">E-posta, telefon ve adres</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Mail size={10} /> E-posta
                      </label>
                      <input
                        type="email"
                        value={settingsForm.contact_email || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettingsForm((f: Record<string, string>) => ({ ...f, contact_email: e.target.value }))}
                        className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none"
                        placeholder="info@mesopro.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Phone size={10} /> Telefon
                      </label>
                      <input
                        type="tel"
                        value={settingsForm.contact_phone || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettingsForm((f: Record<string, string>) => ({ ...f, contact_phone: e.target.value }))}
                        className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none"
                        placeholder="+90 555 000 00 00"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Adres</label>
                    <textarea
                      rows={2}
                      value={settingsForm.contact_address || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettingsForm((f: Record<string, string>) => ({ ...f, contact_address: e.target.value }))}
                      className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none resize-none"
                      placeholder="Şehir, İlçe, Sokak No..."
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 3: WhatsApp ── */}
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                  <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                    <MessageSquare size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surface-800 dark:text-surface-200">WhatsApp</p>
                    <p className="text-[10px] text-surface-400">Hızlı iletişim butonu ayarları</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Numara</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-surface-400 select-none">+</span>
                      <input
                        type="text"
                        value={settingsForm.whatsapp_number || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettingsForm((f: Record<string, string>) => ({ ...f, whatsapp_number: e.target.value }))}
                        className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none font-mono"
                        placeholder="905XXXXXXXXX"
                      />
                    </div>
                    <p className="text-[10px] text-surface-400">Başında + veya boşluk olmadan, ülke kodu dahil girin</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Karşılama Mesajı</label>
                    <textarea
                      rows={2}
                      value={settingsForm.whatsapp_greeting || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettingsForm((f: Record<string, string>) => ({ ...f, whatsapp_greeting: e.target.value }))}
                      className="w-full bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none resize-none"
                      placeholder="Merhaba, bilgi almak istiyorum."
                    />
                    <p className="text-[10px] text-surface-400">Kullanıcı WhatsApp'ı açtığında önceden dolu gelecek mesaj</p>
                  </div>
                </div>
              </div>

              {/* ── Section 4: Yönetici Ekibi ── */}
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Users size={15} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-surface-800 dark:text-surface-200">Yönetici Ekibi</p>
                    <p className="text-[10px] text-surface-400">{adminTeam.length} üye · admin erişimi</p>
                  </div>
                </div>

                {/* Team Members */}
                <div className="px-6 pt-5">
                  {adminTeam.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center mx-auto mb-3">
                        <Users size={20} className="text-surface-300 dark:text-surface-600" />
                      </div>
                      <p className="text-sm font-medium text-surface-400">Henüz ek yönetici yok</p>
                      <p className="text-[11px] text-surface-300 dark:text-surface-600 mt-1">Aşağıdan yeni admin davet edin</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-surface-50 dark:divide-surface-800">
                      {adminTeam.map(member => (
                        <div key={member.id} className="flex items-center justify-between py-3.5 gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-purple-700 flex items-center justify-center text-white text-[11px] font-black shrink-0 shadow-sm">
                              {(member.name || member.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-surface-900 dark:text-white truncate">{member.name || '—'}</p>
                              <p className="text-[10px] text-surface-400 truncate">{member.email} · {new Date(member.createdAt).toLocaleDateString('tr-TR')}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveAdmin(member.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                          >
                            <Trash2 size={11} /> Kaldır
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invite Form */}
                <div className="px-6 pb-6 pt-4 mt-2 border-t border-surface-100 dark:border-surface-800">
                  <p className="text-[11px] font-black text-surface-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <UserPlus size={11} /> Yeni Admin Davet Et
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && inviteEmail) handleInviteAdmin(); }}
                      placeholder="admin@ornek.com"
                      className="flex-1 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none"
                    />
                    <button
                      onClick={handleInviteAdmin}
                      disabled={isInviting || !inviteEmail}
                      className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shrink-0"
                    >
                      {isInviting ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                      Davet Et
                    </button>
                  </div>
                  {lastInviteUrl && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-xl p-3 flex items-center gap-2">
                      <Link size={12} className="text-brand-500 shrink-0" />
                      <p className="text-[10px] text-brand-700 dark:text-brand-400 truncate flex-1 font-mono">{lastInviteUrl}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(lastInviteUrl); addToast('Link kopyalandı!', 'success'); }}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 bg-brand-100 dark:bg-brand-800/50 hover:bg-brand-200 dark:hover:bg-brand-700 rounded-lg transition-colors text-brand-700 dark:text-brand-300"
                      >
                        <Copy size={11} />
                        <span className="text-[10px] font-bold">Kopyala</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* ── Save button (bottom) ── */}
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white rounded-xl font-black text-sm shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isSavingSettings ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {isSavingSettings ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}
              </button>
            </motion.div>
          )}

          {/* ─ ────────────────────────────────────────────────────────────────────── */}

          {/* ─────────────────────── SUPPORT TAB ─────────────────────── */}
          {activeTab === 'support' && (
            <motion.div key="support" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="space-y-0.5 mb-4">
                <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tight">Destek Talepleri</h2>
                <p className="text-xs text-surface-400 font-medium">Kullanıcılardan gelen destek taleplerini yönetin.</p>
              </div>
              <div className="grid gap-3">
                {tickets.length === 0 ? (
                  <div className="text-center py-16 text-surface-400">
                    <LifeBuoy size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">Henüz destek talebi yok.</p>
                  </div>
                ) : tickets.map((ticket: SupportTicket) => (
                  <div key={ticket.id} onClick={async () => {
                    const detail = await getTicket(ticket.id);
                    setSelectedTicket(detail);
                    setTicketReply('');
                  }} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-4 hover:border-brand-300 dark:hover:border-brand-600 cursor-pointer transition-all shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${ticket.status === 'open' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : ticket.status === 'in_progress' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : ticket.status === 'resolved' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-surface-100 text-surface-400'}`}>
                            {ticket.status === 'open' ? 'Açık' : ticket.status === 'in_progress' ? 'İşlemde' : ticket.status === 'resolved' ? 'Çözüldü' : 'Kapalı'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${ticket.priority === 'high' ? 'bg-red-50 text-red-500' : ticket.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-surface-50 text-surface-400'}`}>
                            {ticket.priority === 'high' ? 'Yüksek' : ticket.priority === 'medium' ? 'Orta' : 'Düşük'} öncelik
                          </span>
                        </div>
                        <p className="text-sm font-bold text-surface-900 dark:text-white truncate">{ticket.subject}</p>
                        <p className="text-xs text-surface-500 mt-0.5">{ticket.name} · {ticket.email}</p>
                      </div>
                      <p className="text-[10px] text-surface-400 whitespace-nowrap shrink-0">{new Date(ticket.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ticket Detail Modal */}
              <AnimatePresence>
                {selectedTicket && (
                  <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTicket(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white dark:bg-surface-900 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                      <div className="p-5 border-b border-surface-100 dark:border-surface-800 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-brand-600 dark:text-brand-400 mb-1">#{selectedTicket.id} · {selectedTicket.category}</p>
                          <h3 className="text-lg font-black text-surface-900 dark:text-white">{selectedTicket.subject}</h3>
                          <p className="text-xs text-surface-500 mt-0.5">{selectedTicket.name} · {selectedTicket.email}{selectedTicket.phone ? ` · ${selectedTicket.phone}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select value={selectedTicket.status} onChange={async (e: React.ChangeEvent<HTMLSelectElement>) => {
                            const newStatus = e.target.value as SupportTicket['status'];
                            await updateTicketStatus(selectedTicket.id, { status: newStatus });
                            setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
                            setTickets(prev => prev.map((t: SupportTicket) => t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
                            addToast('Durum güncellendi', 'success');
                          }} className="text-xs font-bold bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 dark:text-white outline-none">
                            <option value="open">Açık</option>
                            <option value="in_progress">İşlemde</option>
                            <option value="resolved">Çözüldü</option>
                            <option value="closed">Kapalı</option>
                          </select>
                          <button onClick={async () => {
                            if (!confirm('Bu talebi silmek istiyor musunuz?')) return;
                            await deleteTicket(selectedTicket.id);
                            setTickets(prev => prev.filter((t: SupportTicket) => t.id !== selectedTicket.id));
                            setSelectedTicket(null);
                            addToast('Talep silindi', 'success');
                          }} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                            <Trash2 size={15} />
                          </button>
                          <button onClick={() => setSelectedTicket(null)} className="p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors">
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1 p-5 space-y-4">
                        {/* Original message */}
                        <div className="bg-surface-50 dark:bg-surface-800 rounded-2xl p-4">
                          <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">Mesaj</p>
                          <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                        </div>
                        {/* Replies */}
                        {(selectedTicket.replies || []).map(reply => (
                          <div key={reply.id} className={`rounded-2xl p-4 ${reply.is_admin ? 'bg-brand-50 dark:bg-brand-900/20 ml-6' : 'bg-surface-50 dark:bg-surface-800 mr-6'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">{reply.is_admin ? 'Admin Yanıtı' : reply.author_name}</p>
                              <p className="text-[10px] text-surface-400">{new Date(reply.created_at).toLocaleString('tr-TR')}</p>
                            </div>
                            <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                      {/* Reply input */}
                      <div className="p-5 border-t border-surface-100 dark:border-surface-800">
                        <div className="flex gap-3">
                          <textarea rows={2} value={ticketReply} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTicketReply(e.target.value)} placeholder="Yanıtınızı yazın..." className="flex-1 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none resize-none" />
                          <button disabled={isSendingReply || !ticketReply.trim()} onClick={async () => {
                            setIsSendingReply(true);
                            try {
                              await replyTicket(selectedTicket.id, ticketReply);
                              const updated = await getTicket(selectedTicket.id);
                              setSelectedTicket(updated);
                              setTicketReply('');
                              addToast('Yanıt gönderildi', 'success');
                            } catch { addToast('Hata oluştu', 'error'); }
                            finally { setIsSendingReply(false); }
                          }} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-2xl font-bold text-sm transition-colors flex items-center gap-2">
                            {isSendingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ─────────────────────── FAQ TAB ─────────────────────── */}
          {activeTab === 'faq' && (
            <motion.div key="faq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tight">SSS Yönetimi</h2>
                  <p className="text-xs text-surface-400 font-medium">Sıkça Sorulan Sorular sayfasını düzenleyin.</p>
                </div>
                <button onClick={() => { setIsAddingFaq(true); setEditingFaq(null); setFaqForm({ question: '', answer: '', category: 'general', sort_order: 0, is_active: true }); }} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl text-sm font-bold transition-colors shadow-lg shadow-brand-500/20">
                  <Plus size={16} /> Yeni SSS
                </button>
              </div>

              {(isAddingFaq || editingFaq) && (
                <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-surface-900 dark:text-white">{editingFaq ? 'SSS Düzenle' : 'Yeni SSS Ekle'}</h3>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Soru</label>
                    <input value={faqForm.question} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFaqForm(f => ({ ...f, question: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="Soru metni..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Cevap</label>
                    <textarea rows={4} value={faqForm.answer} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFaqForm(f => ({ ...f, answer: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder="Cevap metni..." />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Kategori</label>
                      <input value={faqForm.category} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFaqForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="general" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Sıra</label>
                      <input type="number" value={faqForm.sort_order} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFaqForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div className="flex items-end pb-1">
                      <button onClick={() => setFaqForm(f => ({ ...f, is_active: !f.is_active }))} className="flex items-center gap-2 text-sm font-bold text-surface-700 dark:text-surface-300">
                        {faqForm.is_active ? <ToggleRight size={22} className="text-brand-500" /> : <ToggleLeft size={22} className="text-surface-400" />}
                        {faqForm.is_active ? 'Aktif' : 'Pasif'}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={async () => {
                      setIsSavingFaq(true);
                      try {
                        if (editingFaq) { await updateFAQ(editingFaq.id, faqForm); } else { await createFAQ(faqForm); }
                        const updated = await getAllFAQs(); setFaqs(updated);
                        setIsAddingFaq(false); setEditingFaq(null);
                        addToast(editingFaq ? 'SSS güncellendi' : 'SSS eklendi', 'success');
                      } catch { addToast('Hata oluştu', 'error'); }
                      finally { setIsSavingFaq(false); }
                    }} disabled={isSavingFaq || !faqForm.question || !faqForm.answer} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-2xl text-sm font-bold transition-colors">
                      {isSavingFaq ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {editingFaq ? 'Güncelle' : 'Kaydet'}
                    </button>
                    <button onClick={() => { setIsAddingFaq(false); setEditingFaq(null); }} className="px-5 py-2.5 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 rounded-2xl text-sm font-bold transition-colors hover:bg-surface-200 dark:hover:bg-surface-700">
                      İptal
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {faqs.length === 0 ? (
                  <div className="text-center py-12 text-surface-400">
                    <HelpCircle size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Henüz SSS eklenmemiş.</p>
                  </div>
                ) : faqs.map((faq: FAQ) => (
                  <div key={faq.id} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${faq.is_active ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-surface-100 text-surface-400'}`}>
                            {faq.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                          <span className="text-[9px] text-surface-400 font-semibold">{faq.category} · #{faq.sort_order}</span>
                        </div>
                        <p className="text-sm font-bold text-surface-900 dark:text-white">{faq.question}</p>
                        <p className="text-xs text-surface-500 mt-1 line-clamp-2">{faq.answer}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setEditingFaq(faq); setIsAddingFaq(false); setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category, sort_order: faq.sort_order, is_active: faq.is_active }); }} className="p-2 text-surface-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-colors"><Edit2 size={14} /></button>
                        <button onClick={async () => {
                          if (!confirm('Bu SSS silinecek, emin misiniz?')) return;
                          await deleteFAQ(faq.id);
                          setFaqs(prev => prev.filter((f: FAQ) => f.id !== faq.id));
                          addToast('SSS silindi', 'success');
                        }} className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─────────────────────── BLOG TAB ─────────────────────── */}
          {activeTab === 'blog' && (
            <motion.div key="blog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tight">Blog Yönetimi</h2>
                  <p className="text-xs text-surface-400 font-medium">Blog yazılarını oluşturun ve yönetin.</p>
                </div>
                <button onClick={() => { setIsAddingBlogPost(true); setEditingBlogPost(null); setBlogForm({ title: '', slug: '', content: '', excerpt: '', cover_image: '', author_name: 'MesoPro', tags: '', status: 'draft', seo_title: '', seo_description: '', seo_keywords: '' }); }} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl text-sm font-bold transition-colors shadow-lg shadow-brand-500/20">
                  <Plus size={16} /> Yeni Yazı
                </button>
              </div>

              {(isAddingBlogPost || editingBlogPost) && (
                <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800 p-6 shadow-sm space-y-5">
                  <h3 className="text-sm font-black text-surface-900 dark:text-white">{editingBlogPost ? 'Yazıyı Düzenle' : 'Yeni Blog Yazısı'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Başlık</label>
                      <input value={blogForm.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlogForm(f => ({ ...f, title: e.target.value, slug: f.slug || e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="Yazı başlığı..." />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Slug</label>
                      <input value={blogForm.slug} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlogForm(f => ({ ...f, slug: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500 font-mono" placeholder="yazi-slug" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Özet</label>
                    <input value={blogForm.excerpt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlogForm(f => ({ ...f, excerpt: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="Kısa özet (listelerde gösterilir)..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">İçerik (HTML)</label>
                    <textarea rows={10} value={blogForm.content} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBlogForm(f => ({ ...f, content: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500 resize-y font-mono" placeholder="<p>Yazı içeriği HTML formatında...</p>" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Kapak Görseli URL</label>
                      <input value={blogForm.cover_image} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlogForm(f => ({ ...f, cover_image: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Yazar</label>
                      <input value={blogForm.author_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlogForm(f => ({ ...f, author_name: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Etiketler (virgülle)</label>
                      <input value={blogForm.tags} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlogForm(f => ({ ...f, tags: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="mezoterapi, cilt, klinik" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Durum</label>
                      <select value={blogForm.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBlogForm(f => ({ ...f, status: e.target.value as 'draft' | 'published' }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500">
                        <option value="draft">Taslak</option>
                        <option value="published">Yayınlandı</option>
                      </select>
                    </div>
                  </div>
                  <div className="border-t border-surface-100 dark:border-surface-800 pt-4 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-500 flex items-center gap-2"><Globe size={11} /> SEO</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 flex justify-between">
                          <span>SEO Başlığı</span>
                          <span className={blogForm.seo_title.length > 60 ? 'text-red-500' : 'text-surface-400'}>{blogForm.seo_title.length}/60</span>
                        </label>
                        <input value={blogForm.seo_title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlogForm(f => ({ ...f, seo_title: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="Boş bırakılırsa başlık kullanılır" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 flex justify-between">
                          <span>SEO Açıklaması</span>
                          <span className={blogForm.seo_description.length > 155 ? 'text-red-500' : 'text-surface-400'}>{blogForm.seo_description.length}/155</span>
                        </label>
                        <input value={blogForm.seo_description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlogForm(f => ({ ...f, seo_description: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="Meta description (155 karakter önerilir)..." />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Anahtar Kelimeler</label>
                      <input value={blogForm.seo_keywords} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlogForm(f => ({ ...f, seo_keywords: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="mezoterapi, cilt bakımı, hyalüronik asit..." />
                      <p className="text-[10px] text-surface-400 mt-1">Virgülle ayırın.</p>
                    </div>

                    {/* Blog Google Önizleme */}
                    <div className="border border-surface-200 dark:border-surface-700 rounded-2xl p-4 bg-surface-50 dark:bg-surface-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Google Önizleme</p>
                      <div className="text-xs text-green-700 dark:text-green-500 mb-1 font-medium truncate">mesopro.com/blog/{blogForm.slug || 'yazi-slug'}</div>
                      <div className={`font-semibold text-[15px] mb-1 leading-snug truncate ${(blogForm.seo_title || blogForm.title).length > 60 ? 'text-red-500' : 'text-blue-700 dark:text-blue-400'}`}>
                        {blogForm.seo_title || blogForm.title || <span className="text-surface-400 italic font-normal text-sm">Başlık girilmedi</span>}
                      </div>
                      <div className={`text-[13px] leading-relaxed line-clamp-2 ${blogForm.seo_description.length > 155 ? 'text-red-500' : 'text-surface-600 dark:text-surface-400'}`}>
                        {blogForm.seo_description || blogForm.excerpt || <span className="italic">Açıklama girilmedi.</span>}
                      </div>
                      {blogForm.seo_keywords && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {blogForm.seo_keywords.split(',').map((k: string, i: number) => (
                            <span key={i} className="text-[10px] bg-surface-200 dark:bg-surface-700 text-surface-500 px-2 py-0.5 rounded-full">{k.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={async () => {
                      setIsSavingBlogPost(true);
                      try {
                        const payload = { ...blogForm, tags: blogForm.tags ? blogForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [] };
                        if (editingBlogPost) { await updateBlogPost(editingBlogPost.id, payload); } else { await createBlogPost(payload); }
                        const updated = await getAllBlogPosts(); setBlogPosts(updated);
                        setIsAddingBlogPost(false); setEditingBlogPost(null);
                        addToast(editingBlogPost ? 'Yazı güncellendi' : 'Yazı oluşturuldu', 'success');
                      } catch { addToast('Hata oluştu', 'error'); }
                      finally { setIsSavingBlogPost(false); }
                    }} disabled={isSavingBlogPost || !blogForm.title || !blogForm.slug || !blogForm.content} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-2xl text-sm font-bold transition-colors">
                      {isSavingBlogPost ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {editingBlogPost ? 'Güncelle' : 'Kaydet'}
                    </button>
                    <button onClick={() => { setIsAddingBlogPost(false); setEditingBlogPost(null); }} className="px-5 py-2.5 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 rounded-2xl text-sm font-bold transition-colors hover:bg-surface-200 dark:hover:bg-surface-700">
                      İptal
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-3">
                {blogPosts.length === 0 ? (
                  <div className="text-center py-12 text-surface-400">
                    <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Henüz blog yazısı yok.</p>
                  </div>
                ) : blogPosts.map((post: BlogPost) => (
                  <div key={post.id} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-4 shadow-sm flex items-start gap-4">
                    {post.cover_image && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 shrink-0">
                        <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${post.status === 'published' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                          {post.status === 'published' ? 'Yayında' : 'Taslak'}
                        </span>
                        {(post.tags || []).slice(0, 2).map((tag: string) => (
                          <span key={tag} className="text-[9px] text-surface-400 font-semibold">#{tag}</span>
                        ))}
                      </div>
                      <p className="text-sm font-bold text-surface-900 dark:text-white">{post.title}</p>
                      <p className="text-xs text-surface-400 mt-0.5 font-mono">/blog/{post.slug}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setEditingBlogPost(post); setIsAddingBlogPost(false); setBlogForm({ title: post.title, slug: post.slug, content: post.content, excerpt: post.excerpt || '', cover_image: post.cover_image || '', author_name: post.author_name, tags: (post.tags || []).join(', '), status: post.status, seo_title: post.seo_title || '', seo_description: post.seo_description || '', seo_keywords: post.seo_keywords || '' }); }} className="p-2 text-surface-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-colors"><Edit2 size={14} /></button>
                      <button onClick={async () => {
                        if (!confirm('Bu yazı silinecek, emin misiniz?')) return;
                        await deleteBlogPost(post.id);
                        setBlogPosts(prev => prev.filter((p: BlogPost) => p.id !== post.id));
                        addToast('Yazı silindi', 'success');
                      }} className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─────────────────────── SEO TAB ─────────────────────── */}
          {activeTab === 'seo' && (
            <motion.div key="seo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <AnimatePresence mode="wait">

              {/* ── INDEX: Sayfa listesi ── */}
              {!seoDetailOpen && (
                <motion.div key="seo-index" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">

                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tight">SEO Yönetimi</h2>
                      <p className="text-xs text-surface-400 font-medium">{Object.keys(seoPages).length} sayfa yapılandırıldı</p>
                    </div>
                    {/* Yeni sayfa ekle butonu */}
                    <button
                      onClick={() => setIsAddingSeoPage(p => !p)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/20"
                    >
                      <Plus size={15} /> Yeni Sayfa
                    </button>
                  </div>

                  {/* Yeni sayfa formu */}
                  <AnimatePresence>
                    {isAddingSeoPage && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-5 shadow-sm">
                          <p className="text-xs font-black text-surface-700 dark:text-surface-300 mb-3">Özel Sayfa Ekle</p>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-surface-400 font-mono select-none">/</span>
                              <input
                                value={newSeoPageSlug}
                                onChange={e => setNewSeoPageSlug(e.target.value)}
                                onKeyDown={async e => {
                                  if (e.key !== 'Enter' || !newSeoPageSlug.trim()) return;
                                  e.preventDefault();
                                  try {
                                    await createSEOPage(newSeoPageSlug.trim());
                                    const updated = await getSEOPages();
                                    setSeoPages(updated);
                                    setNewSeoPageSlug('');
                                    setIsAddingSeoPage(false);
                                    addToast('Sayfa eklendi', 'success');
                                  } catch { addToast('Bu sayfa zaten mevcut veya geçersiz.', 'error'); }
                                }}
                                placeholder="hakkimizda"
                                className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl pl-7 pr-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!newSeoPageSlug.trim()) return;
                                try {
                                  await createSEOPage(newSeoPageSlug.trim());
                                  const updated = await getSEOPages();
                                  setSeoPages(updated);
                                  setNewSeoPageSlug('');
                                  setIsAddingSeoPage(false);
                                  addToast('Sayfa eklendi', 'success');
                                } catch { addToast('Bu sayfa zaten mevcut veya geçersiz.', 'error'); }
                              }}
                              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shrink-0"
                            >
                              <Plus size={14} /> Ekle
                            </button>
                            <button onClick={() => { setIsAddingSeoPage(false); setNewSeoPageSlug(''); }} className="px-3 py-2.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors">
                              <X size={15} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sayfa kartları */}
                  {Object.keys(seoPages).length === 0 ? (
                    <div className="py-20 text-center text-surface-400">
                      <Globe size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">Henüz sayfa yok</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(seoPages).map(([slug, data]) => {
                        const page = data as SEOPage;
                        const hasTitle = !!page.title;
                        const hasDesc = !!page.description;
                        const hasOg = !!page.og_image;
                        const score = [hasTitle, hasDesc, hasOg].filter(Boolean).length;
                        const scoreColor = score === 3 ? 'text-green-600 dark:text-green-400' : score >= 1 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500';
                        const scoreBg = score === 3 ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' : score >= 1 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30';
                        const isBuiltin = ['home', 'products', 'blog', 'sss', 'destek'].includes(slug);

                        return (
                          <div
                            key={slug}
                            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 shadow-sm hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all group"
                          >
                            <div className="p-5">
                              {/* Slug + built-in badge */}
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Globe size={13} className="text-surface-400 shrink-0" />
                                    <span className="text-xs font-mono font-bold text-surface-500 dark:text-surface-400 truncate">
                                      /{slug === 'home' ? '' : slug}
                                    </span>
                                  </div>
                                  <p className="text-sm font-bold text-surface-900 dark:text-white truncate">
                                    {page.title || <span className="text-surface-300 dark:text-surface-600 font-normal italic">Başlık yok</span>}
                                  </p>
                                </div>
                                {/* SEO skoru */}
                                <div className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black ${scoreBg} ${scoreColor}`}>
                                  {score === 3 ? '✓ İyi' : score >= 1 ? '~ Orta' : '! Eksik'}
                                </div>
                              </div>

                              {/* Meta desc önizleme */}
                              <p className="text-[11px] text-surface-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                                {page.description || <span className="italic">Meta açıklama girilmedi.</span>}
                              </p>

                              {/* Checkpoints */}
                              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-surface-50 dark:border-surface-800">
                                {[
                                  { label: 'Başlık', ok: hasTitle },
                                  { label: 'Açıklama', ok: hasDesc },
                                  { label: 'OG Görsel', ok: hasOg },
                                ].map(c => (
                                  <span key={c.label} className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide ${c.ok ? 'text-green-600 dark:text-green-400' : 'text-surface-300 dark:text-surface-600'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${c.ok ? 'bg-green-500' : 'bg-surface-200 dark:bg-surface-700'}`} />
                                    {c.label}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="px-5 pb-4 flex items-center gap-2">
                              <button
                                onClick={() => { setActiveSeoPage(slug); setSeoForm(seoPages[slug] || {}); setSeoDetailOpen(true); }}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded-xl border border-brand-100 dark:border-brand-900/30 transition-all"
                              >
                                <Edit2 size={11} /> Düzenle
                              </button>
                              {!isBuiltin && (
                                <button
                                  onClick={async () => {
                                    if (!confirm(`"${slug}" sayfasını silmek istediğinize emin misiniz?`)) return;
                                    try {
                                      await deleteSEOPage(slug);
                                      const updated = await getSEOPages();
                                      setSeoPages(updated);
                                      addToast('Sayfa silindi', 'success');
                                    } catch { addToast('Hata oluştu', 'error'); }
                                  }}
                                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-transparent hover:border-red-100 dark:hover:border-red-900/20 transition-all"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── DETAIL: Tek sayfa SEO formu ── */}
              {seoDetailOpen && (
                <motion.div key="seo-detail" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} className="space-y-5 max-w-2xl">

                  {/* Header with back button */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSeoDetailOpen(false)}
                      className="flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-white hover:border-surface-300 dark:hover:border-surface-700 transition-all shadow-sm"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-surface-400 font-mono">SEO /</p>
                        <p className="text-sm font-black text-surface-900 dark:text-white truncate">
                          {activeSeoPage === 'home' ? 'Ana Sayfa' : activeSeoPage}
                        </p>
                        <span className="text-[9px] font-mono text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded-md">
                          /{activeSeoPage === 'home' ? '' : activeSeoPage}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setIsSavingSeo(true);
                        try {
                          await updateSEOPage(activeSeoPage, seoForm);
                          const updated = await getSEOPages();
                          setSeoPages(updated);
                          addToast('SEO ayarları kaydedildi', 'success');
                        } catch { addToast('Hata oluştu', 'error'); }
                        finally { setIsSavingSeo(false); }
                      }}
                      disabled={isSavingSeo}
                      className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/20 shrink-0"
                    >
                      {isSavingSeo ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      {isSavingSeo ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>

                  {/* Google SERP Önizleme */}
                  <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4 flex items-center gap-1.5">
                      <Globe size={11} /> Google Önizleme
                    </p>
                    <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-100 dark:border-surface-700">
                      <p className="text-[11px] text-green-700 dark:text-green-500 font-medium mb-0.5 font-mono">
                        mesopro.com{activeSeoPage !== 'home' ? `/${activeSeoPage}` : ''}
                      </p>
                      <p className={`text-base font-semibold leading-snug mb-1 ${(seoForm.title || '').length > 60 ? 'text-red-500' : 'text-blue-700 dark:text-blue-400'}`}>
                        {seoForm.title || <span className="text-surface-300 dark:text-surface-600 italic font-normal text-sm">Başlık girilmedi</span>}
                      </p>
                      <p className={`text-sm leading-relaxed line-clamp-2 ${(seoForm.description || '').length > 155 ? 'text-red-500' : 'text-surface-500 dark:text-surface-400'}`}>
                        {seoForm.description || <span className="italic text-surface-300 dark:text-surface-600">Açıklama girilmedi.</span>}
                      </p>
                    </div>
                  </div>

                  {/* ── Temel SEO ── */}
                  <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                      <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400"><Globe size={13} /></div>
                      <p className="text-sm font-bold text-surface-800 dark:text-surface-200">Temel Meta Etiketleri</p>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 flex justify-between">
                          <span>Sayfa Başlığı</span>
                          <span className={(seoForm.title || '').length > 60 ? 'text-red-500 font-black' : 'text-surface-400'}>{(seoForm.title || '').length}/60</span>
                        </label>
                        <input
                          value={seoForm.title || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeoForm(f => ({ ...f, title: e.target.value }))}
                          className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder="Sayfa başlığı (60 karakter önerilir)"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 flex justify-between">
                          <span>Meta Açıklaması</span>
                          <span className={(seoForm.description || '').length > 155 ? 'text-red-500 font-black' : 'text-surface-400'}>{(seoForm.description || '').length}/155</span>
                        </label>
                        <textarea
                          rows={3}
                          value={seoForm.description || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSeoForm(f => ({ ...f, description: e.target.value }))}
                          className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                          placeholder="Meta description (155 karakter önerilir)"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Anahtar Kelimeler</label>
                        <input
                          value={seoForm.meta_keywords || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeoForm(f => ({ ...f, meta_keywords: e.target.value }))}
                          className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder="mezoterapi, cilt bakımı, klinik ürünleri..."
                        />
                        <p className="text-[10px] text-surface-400 mt-1">Virgülle ayırın</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Robots</label>
                          <select
                            value={seoForm.robots || 'index, follow'}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSeoForm(f => ({ ...f, robots: e.target.value }))}
                            className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            <option value="index, follow">index, follow</option>
                            <option value="noindex, nofollow">noindex, nofollow</option>
                            <option value="noindex, follow">noindex, follow</option>
                            <option value="index, nofollow">index, nofollow</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Canonical URL</label>
                          <input
                            value={seoForm.canonical || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeoForm(f => ({ ...f, canonical: e.target.value }))}
                            className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="https://mesopro.com/..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Open Graph ── */}
                  <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400"><Share2 size={13} /></div>
                      <div>
                        <p className="text-sm font-bold text-surface-800 dark:text-surface-200">Open Graph</p>
                        <p className="text-[10px] text-surface-400">Facebook, LinkedIn ve diğer sosyal medya paylaşımları</p>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">OG Başlık</label>
                        <input value={seoForm.og_title || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeoForm(f => ({ ...f, og_title: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="Boş bırakılırsa sayfa başlığı kullanılır" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">OG Açıklaması</label>
                        <input value={seoForm.og_description || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeoForm(f => ({ ...f, og_description: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="Paylaşım açıklaması..." />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">OG Görsel URL</label>
                        <input value={seoForm.og_image || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeoForm(f => ({ ...f, og_image: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="https://..." />
                        {seoForm.og_image && (
                          <div className="mt-2 w-full h-28 rounded-xl overflow-hidden border border-surface-100 dark:border-surface-700">
                            <img src={seoForm.og_image} alt="OG önizleme" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Twitter / X Card ── */}
                  <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                      <div className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-600 dark:text-surface-400">
                        <span className="text-xs font-black">𝕏</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-surface-800 dark:text-surface-200">Twitter / X Card</p>
                        <p className="text-[10px] text-surface-400">Twitter/X paylaşımları için özel ayarlar</p>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Card Tipi</label>
                        <select value={seoForm.twitter_card || 'summary_large_image'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSeoForm(f => ({ ...f, twitter_card: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500">
                          <option value="summary_large_image">summary_large_image — Büyük görsel</option>
                          <option value="summary">summary — Küçük görsel</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Twitter Başlık</label>
                          <input value={seoForm.twitter_title || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeoForm(f => ({ ...f, twitter_title: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="Boş → OG başlığı" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5 block">Twitter Açıklama</label>
                          <input value={seoForm.twitter_description || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeoForm(f => ({ ...f, twitter_description: e.target.value }))} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="Boş → OG açıklaması" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save bottom */}
                  <button
                    onClick={async () => {
                      setIsSavingSeo(true);
                      try {
                        await updateSEOPage(activeSeoPage, seoForm);
                        const updated = await getSEOPages();
                        setSeoPages(updated);
                        addToast('SEO ayarları kaydedildi', 'success');
                        setSeoDetailOpen(false);
                      } catch { addToast('Hata oluştu', 'error'); }
                      finally { setIsSavingSeo(false); }
                    }}
                    disabled={isSavingSeo}
                    className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white rounded-xl font-black text-sm shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    {isSavingSeo ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {isSavingSeo ? 'Kaydediliyor...' : 'Kaydet & Listeye Dön'}
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
            </motion.div>
          )}

          <AnimatePresence>
            {isAddingCampaign && editingCampaign && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAddingCampaign(false); setEditingCampaign(null); }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-surface-950 w-full max-w-2xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-5 sm:p-7 border-b border-surface-100 dark:border-surface-900 flex justify-between items-center text-surface-900 dark:text-white">
                    <div>
                      <h3 className="text-xl font-bold">{editingCampaign.id === 0 ? 'Yeni Kampanya Oluştur' : 'Kampanyayı Düzenle'}</h3>
                      <p className="text-xs text-surface-400 mt-1">Gelişmiş kampanya ayarlarını aşağıdaki sekmelerden yapılandırın.</p>
                    </div>
                    <button onClick={() => { setIsAddingCampaign(false); setEditingCampaign(null); }} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-900 rounded-full transition-colors"><X size={22} className="text-surface-400" /></button>
                  </div>

                  {/* Modal Tabs - Forced to fit in one row without scroll */}
                  <div className="grid grid-cols-5 bg-surface-50 dark:bg-surface-900/50 border-b border-surface-100 dark:border-surface-800 shrink-0">
                    {[
                      { id: 'general', label: 'Genel', icon: <Tag size={16} /> },
                      { id: 'conditions', label: 'Koşullar', icon: <Filter size={16} /> },
                      { id: 'reward', label: 'İndirim', icon: <TrendingUp size={16} /> },
                      { id: 'coupon', label: 'Kupon', icon: <Ticket size={16} /> },
                      { id: 'scheduling', label: 'Zamanlama', icon: <Clock size={16} /> }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveCampaignTab(tab.id as any)}
                        className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 px-1 py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-widest border-b-2 transition-all ${activeCampaignTab === tab.id ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5' : 'border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200'}`}
                      >
                        <div className="shrink-0">{tab.icon}</div>
                        <span className="truncate">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSaveCampaign} className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-5 sm:p-7">
                      <AnimatePresence mode="wait">
                        {activeCampaignTab === 'general' && (
                          <motion.div key="general" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> Temel Bilgiler
                              </h4>
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Kampanya Adı *</label>
                                <input required type="text" value={editingCampaign.name} onChange={e => setEditingCampaign({ ...editingCampaign, name: e.target.value })} className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none shadow-sm" placeholder="Örn: 6 Alımlarda %10 İndirim" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Kampanya Tipi *</label>
                                <CustomSelect 
                                  value={editingCampaign.type}
                                  onChange={(val: any) => {
                                    setEditingCampaign({
                                      ...editingCampaign,
                                      type: val,
                                      targetValue: '',
                                      // BOGO: free items are always 100% off — set automatically
                                      ...(val === 'bogo' ? { discountType: 'percentage', discountValue: 100 } : {})
                                    });
                                    setCampaignProductSearch('');
                                    setCampaignCategorySearch('');
                                  }}
                                  options={[
                                    { value: 'volume', label: 'Adet/Miktar Bazlı İndirim' },
                                    { value: 'cart_total', label: 'Sepet Toplam Tutarı İndirimi' },
                                    { value: 'product', label: 'Ürüne Özel İndirim' },
                                    { value: 'category', label: 'Kategoriye Özel İndirim' },
                                    { value: 'bogo', label: 'X Al Y Öde (BOGO)' }
                                  ]}
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Açıklama (Opsiyonel)</label>
                              <textarea
                                rows={3}
                                value={editingCampaign.description || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingCampaign({ ...editingCampaign, description: e.target.value })}
                                className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none shadow-sm resize-none"
                                placeholder="Müşterilere gösterilecek kampanya açıklaması..."
                              />
                            </div>
                          </motion.div>
                        )}

                        {activeCampaignTab === 'coupon' && (
                          <motion.div key="coupon" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Kupon Ayarları
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-3">
                                  <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Kupon Kodu (Opsiyonel)</label>
                                  <input type="text" value={editingCampaign.couponCode || ''} onChange={e => setEditingCampaign({ ...editingCampaign, couponCode: e.target.value.toUpperCase().replace(/\s/g, '') })} className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none uppercase shadow-sm" placeholder="Örn: YAZ2024" />
                                  <p className="text-[10px] text-surface-500">Kupon kodu girilirse sepet otomatik uygulanmaz. Büyük harflerle yazınız.</p>
                                </div>
                                <div className="flex items-center gap-3 h-fit mt-0 sm:mt-8 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20 ring-2 ring-blue-500/20">
                                  <button type="button" onClick={() => setEditingCampaign({ ...editingCampaign, isStackable: !editingCampaign.isStackable })} className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors shrink-0 ${editingCampaign.isStackable ? 'bg-blue-500' : 'bg-surface-200 dark:bg-surface-800'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${editingCampaign.isStackable ? 'translate-x-5' : 'translate-x-0'}`} />
                                  </button>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Birleştirilebilir</span>
                                    <span className="text-[9px] text-surface-500">Diğer aktif kampanyalarla birlikte uygulanır.</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {activeCampaignTab === 'conditions' && (
                          <motion.div key="conditions" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Hedef & Kısıtlamalar
                              </h4>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Min. Adet {editingCampaign.type === 'bogo' && '(X Al)'}</label>
                                  <input type="number" min="0" value={editingCampaign.minQuantity} onChange={e => setEditingCampaign({ ...editingCampaign, minQuantity: Number(e.target.value) })} className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none shadow-sm" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Min. Sepet Tutarı (₺)</label>
                                  <input type="number" min="0" value={editingCampaign.minAmount} onChange={e => setEditingCampaign({ ...editingCampaign, minAmount: Number(e.target.value) })} className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none shadow-sm" />
                                </div>
                              </div>

                              {(editingCampaign.type === 'category' || editingCampaign.type === 'bogo') && (
                                <div className="space-y-1.5 relative">
                                  <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Hedef Kategori (Opsiyonel)</label>
                                  <div className="relative">
                                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                                    <input 
                                      required={editingCampaign.type === 'category'}
                                      type="text"
                                      placeholder="Kategori adı ara veya seç..."
                                      value={campaignCategorySearch}
                                      onChange={e => {
                                        setCampaignCategorySearch(e.target.value);
                                        setIsCampaignCategoryDropdownOpen(true);
                                        if (e.target.value === '') setEditingCampaign({ ...editingCampaign, targetValue: '' });
                                      }}
                                      onFocus={() => setIsCampaignCategoryDropdownOpen(true)}
                                      onBlur={() => setTimeout(() => setIsCampaignCategoryDropdownOpen(false), 200)}
                                      className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl pl-10 pr-10 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none shadow-sm"
                                    />
                                    <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 transition-all ${isCampaignCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                  </div>
                                  <AnimatePresence>
                                    {isCampaignCategoryDropdownOpen && (
                                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl shadow-2xl z-[60] max-h-48 overflow-y-auto py-2 custom-scrollbar">
                                        {categories.filter(c => c.name.toLowerCase().includes(campaignCategorySearch.toLowerCase())).map(c => (
                                          <div key={c.id} onMouseDown={(e) => { e.preventDefault(); setEditingCampaign({...editingCampaign, targetValue: c.name}); setCampaignCategorySearch(c.name); setIsCampaignCategoryDropdownOpen(false); }} className={`px-4 py-3 text-sm cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors flex items-center justify-between ${editingCampaign.targetValue === c.name ? 'text-brand-500 font-bold' : 'text-surface-600 dark:text-surface-300'}`}>
                                            {c.name} {editingCampaign.targetValue === c.name && <CheckCircle2 size={14} />}
                                          </div>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                  {editingCampaign.type === 'bogo' && <p className="text-[9px] text-surface-400 font-medium">Kategori boş bırakılırsa tüm ürünlerde geçerli olur.</p>}
                                </div>
                              )}

                              {(editingCampaign.type === 'product' || editingCampaign.type === 'bogo') && (
                                <div className="space-y-1.5 relative">
                                  <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Hedef Ürün (Opsiyonel)</label>
                                  <div className="relative">
                                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                                    <input 
                                      required={editingCampaign.type === 'product'}
                                      type="text"
                                      placeholder="Ürün adı ara..."
                                      value={campaignProductSearch}
                                      onChange={e => {
                                        setCampaignProductSearch(e.target.value);
                                        setIsCampaignProductDropdownOpen(true);
                                        if (e.target.value === '') setEditingCampaign({ ...editingCampaign, targetValue: '' });
                                      }}
                                      onFocus={() => setIsCampaignProductDropdownOpen(true)}
                                      onBlur={() => setTimeout(() => setIsCampaignProductDropdownOpen(false), 200)}
                                      className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl pl-10 pr-10 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none shadow-sm"
                                    />
                                    <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 transition-all ${isCampaignProductDropdownOpen ? 'rotate-180' : ''}`} />
                                  </div>
                                  <AnimatePresence>
                                    {isCampaignProductDropdownOpen && (
                                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl shadow-2xl z-[60] max-h-48 overflow-y-auto py-2 custom-scrollbar">
                                        {products.filter(p => p.name.toLowerCase().includes(campaignProductSearch.toLowerCase())).map(p => (
                                          <div key={p.id} onMouseDown={(e) => { e.preventDefault(); setEditingCampaign({...editingCampaign, targetValue: p.id}); setCampaignProductSearch(p.name); setIsCampaignProductDropdownOpen(false); }} className={`px-4 py-3 text-sm cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors flex items-center justify-between ${editingCampaign.targetValue === p.id ? 'text-brand-500 font-bold' : 'text-surface-600 dark:text-surface-300'}`}>
                                            <span>{p.name} <span className="opacity-50 text-[10px]">({p.brand})</span></span> {editingCampaign.targetValue === p.id && <CheckCircle2 size={14} />}
                                          </div>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                  {editingCampaign.type === 'bogo' && <p className="text-[9px] text-surface-400 font-medium">Ürün seçilirse sadece o üründen alımlarda kural işler.</p>}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {activeCampaignTab === 'reward' && (
                          <motion.div key="reward" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> İndirim & Ödül Yapısı
                              </h4>

                              {editingCampaign.type === 'bogo' ? (
                                <div className="space-y-6">
                                  <div className="bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 p-6 rounded-3xl">
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                                      <div className="flex flex-col items-center gap-2">
                                        <label className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">KAMPANYA SETİ (X)</label>
                                        <div className="flex items-center gap-3">
                                          <input 
                                            type="number" 
                                            min="1" 
                                            value={editingCampaign.minQuantity} 
                                            onChange={e => setEditingCampaign({ ...editingCampaign, minQuantity: Math.max(1, Number(e.target.value)) })} 
                                            className="w-20 text-center bg-white dark:bg-surface-900 border-2 border-brand-500/30 rounded-2xl px-2 py-4 text-xl font-black text-brand-600 dark:text-brand-400 outline-none focus:border-brand-500 shadow-sm" 
                                          />
                                          <span className="text-lg font-black text-surface-400">ADET</span>
                                        </div>
                                      </div>

                                      <div className="text-2xl font-black text-surface-300 pointer-events-none">ALANA</div>

                                      <div className="flex flex-col items-center gap-2">
                                        <label className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">HEDİYE (Y)</label>
                                        <div className="flex items-center gap-3">
                                          <input 
                                            type="number" 
                                            min="1" 
                                            max={editingCampaign.minQuantity - 1}
                                            value={editingCampaign.bogoFreeQuantity || 1} 
                                            onChange={e => setEditingCampaign({ ...editingCampaign, bogoFreeQuantity: Math.max(1, Math.min(editingCampaign.minQuantity - 1, Number(e.target.value))) })} 
                                            className="w-20 text-center bg-white dark:bg-surface-900 border-2 border-orange-500/30 rounded-2xl px-2 py-4 text-xl font-black text-orange-600 dark:text-orange-400 outline-none focus:border-orange-500 shadow-sm" 
                                          />
                                          <span className="text-lg font-black text-surface-400">BEDAVA</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-brand-500/10 text-center">
                                      <p className="text-sm font-bold text-surface-600 dark:text-surface-300">
                                        Sonuç: <span className="text-brand-600 dark:text-brand-400">{editingCampaign.minQuantity} Al {editingCampaign.minQuantity - (editingCampaign.bogoFreeQuantity || 1)} Öde</span>
                                      </p>
                                      <p className="text-[10px] text-surface-400 mt-1 uppercase tracking-tight">
                                        Her {editingCampaign.minQuantity} üründe en ucuz {editingCampaign.bogoFreeQuantity || 1} ürün hediye edilir.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">İndirim Türü *</label>
                                      <CustomSelect 
                                        value={editingCampaign.discountType}
                                        onChange={(val: any) => setEditingCampaign({ ...editingCampaign, discountType: val })}
                                        options={[
                                            { value: 'percentage', label: '% Yüzdelik İndirim' },
                                            { value: 'fixed', label: '₺ Sabit İndirim' },
                                          ]}
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">İndirim Miktarı *</label>
                                      <input required type="number" min="0" step="0.01" value={editingCampaign.discountValue} onChange={e => setEditingCampaign({ ...editingCampaign, discountValue: Number(e.target.value) })} className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none shadow-sm" />
                                    </div>
                                  </div>
                                  <div className="p-4 bg-surface-50 dark:bg-surface-900/50 border border-surface-100 dark:border-surface-800 rounded-2xl">
                                    <p className="text-[11px] text-surface-500 leading-relaxed italic">
                                      İndirim sepet alt toplamı üzerinden {editingCampaign.discountType === 'percentage' ? 'yüzdesel' : 'sabit tutar'} olarak düşülecektir.
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {activeCampaignTab === 'scheduling' && (
                          <motion.div key="scheduling" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Takvim & Limitler
                              </h4>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Maks. Toplam Kullanım (0=Sınırsız)</label>
                                  <input type="number" min="0" value={editingCampaign.maxUsage || 0} onChange={e => setEditingCampaign({ ...editingCampaign, maxUsage: Number(e.target.value) })} className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none shadow-sm" placeholder="Örn: 100" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Kullanıcı Başına Limit (0=Sınırsız)</label>
                                  <input type="number" min="0" value={editingCampaign.perUserLimit || 0} onChange={e => setEditingCampaign({ ...editingCampaign, perUserLimit: Number(e.target.value) })} className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none shadow-sm" placeholder="Örn: 1" />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Başlangıç Tarihi</label>
                                  <input type="datetime-local" value={editingCampaign.startDate ? new Date(new Date(editingCampaign.startDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => setEditingCampaign({ ...editingCampaign, startDate: e.target.value })} className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-purple-500 dark:text-white outline-none shadow-sm" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Bitiş Tarihi</label>
                                  <input type="datetime-local" value={editingCampaign.endDate ? new Date(new Date(editingCampaign.endDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => setEditingCampaign({ ...editingCampaign, endDate: e.target.value })} className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-red-500 dark:text-white outline-none shadow-sm" />
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 pt-2">
                                {[
                                  { label: '+6 Saat', val: 6 * 60 * 60 * 1000 },
                                  { label: '+12 Saat', val: 12 * 60 * 60 * 1000 },
                                  { label: '+24 Saat', val: 24 * 60 * 60 * 1000 },
                                  { label: '+3 Gün', val: 3 * 24 * 60 * 60 * 1000 },
                                  { label: '+7 Gün', val: 7 * 24 * 60 * 60 * 1000 }
                                ].map(dur => (
                                  <button key={dur.label} type="button" onClick={() => setEditingCampaign({ ...editingCampaign, endDate: new Date(Date.now() + dur.val).toISOString() })} className="px-3 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-[10px] font-black uppercase rounded-xl transition-all">
                                    {dur.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 mt-4 bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/20 rounded-2xl">
                              <button type="button" onClick={() => setEditingCampaign({ ...editingCampaign, isActive: !editingCampaign.isActive })} className={`w-14 h-8 rounded-full flex items-center px-1 transition-all shrink-0 ${editingCampaign.isActive ? 'bg-brand-500 shadow-lg shadow-brand-500/30' : 'bg-surface-300 dark:bg-surface-700'}`}>
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${editingCampaign.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                              </button>
                              <div>
                                <span className="text-sm font-bold text-surface-900 dark:text-white block">Kampanyayı Hemen Yayınla</span>
                                <span className="text-xs text-surface-500 block -mt-0.5">Toggle pasif ise kampanya taslak olarak kalır.</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="p-7 border-t border-surface-100 dark:border-surface-900 bg-surface-50/50 dark:bg-surface-950/50 flex gap-4 sticky bottom-0 backdrop-blur-md">
                      <button type="button" disabled={isSavingCampaign} onClick={() => { setIsAddingCampaign(false); setEditingCampaign(null); }} className="flex-1 py-4 text-sm font-bold text-surface-500 hover:bg-surface-200/50 dark:hover:bg-surface-800 rounded-2xl transition-all disabled:opacity-50">Kapat</button>
                      <button type="submit" disabled={isSavingCampaign} className="flex-[2] py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-xl shadow-brand-500/20 hover:bg-brand-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                        {isSavingCampaign ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {editingCampaign.id === 0 ? 'Kampanyayı Oluştur' : 'Değişiklikleri Kaydet'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          </AnimatePresence>
          </>
        )}
        </div>
      </main>

      {/* ─ ────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setEditingProduct(null); setIsAddingProduct(false); }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="relative bg-white dark:bg-surface-950 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="p-7 border-b border-surface-100 dark:border-surface-900 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-surface-900 dark:text-white">{isAddingProduct ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}</h3>
                  <p className="text-xs text-surface-400 mt-0.5">Tüm zorunlu alanları doldurun</p>
                </div>
                <button onClick={() => { setEditingProduct(null); setIsAddingProduct(false); setActiveProductModalTab('general'); }} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-900 rounded-full transition-colors"><X size={22} className="text-surface-400" /></button>
              </div>

              {/* Product Modal Tabs */}
              <div className="flex border-b border-surface-100 dark:border-surface-900 bg-surface-50/50 dark:bg-surface-950/50 shrink-0">
                {([{ id: 'general', label: 'Genel', icon: <Package size={14} /> }, { id: 'seo', label: 'SEO', icon: <Globe size={14} /> }] as const).map(tab => (
                  <button key={tab.id} type="button" onClick={() => setActiveProductModalTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors border-b-2 -mb-px ${activeProductModalTab === tab.id ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'}`}>
                    {tab.icon}{tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto">
                {/* ── General Tab ── */}
                {activeProductModalTab === 'general' && <div className="p-7 space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Ürün Adı *</label>
                      <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white focus:outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Marka *</label>
                      <CustomSelect 
                        value={editingProduct.brand} 
                        onChange={val => setEditingProduct({ ...editingProduct, brand: val })} 
                        options={brands.map(b => ({ value: b.name, label: b.name }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Kategori *</label>
                      <CustomSelect 
                        value={editingProduct.category} 
                        onChange={val => setEditingProduct({ ...editingProduct, category: val })} 
                        options={categories.length === 0 ? [] : categories.map(c => ({ value: c.name, label: c.name }))}
                        placeholder={categories.length === 0 ? "Önce kategori ekleyin" : "Seçiniz"}
                        disabled={categories.length === 0}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Güncel Fiyat (₺) *</label>
                      <input required type="number" min="0" value={editingProduct.basePrice} onChange={e => setEditingProduct({ ...editingProduct, basePrice: Number(e.target.value) })} className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white focus:outline-none transition-all" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 mt-5">
                    <label className="text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1.5">Gerçek Fiyat <span className="text-[9px] text-surface-400 font-medium normal-case tracking-normal">(Opsiyonel, İndirim için kullanılır)</span></label>
                    <input type="number" min="0" value={editingProduct.originalPrice || ''} onChange={e => setEditingProduct({ ...editingProduct, originalPrice: e.target.value ? Number(e.target.value) : null })} placeholder="Örn: 1500 (Üstü çizili olarak gösterilir)" className="w-full bg-surface-50 dark:bg-surface-900 border border-brand-200 dark:border-brand-800/30 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white focus:outline-none transition-all placeholder:text-surface-400/60" />
                  </div>
                  <div className="mt-5 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <div className={`relative w-11 h-6 rounded-full transition-colors ${(editingProduct.inStock !== false) ? 'bg-brand-500' : 'bg-surface-300 dark:bg-surface-700'}`}>
                        <input type="checkbox" className="sr-only" checked={editingProduct.inStock !== false} onChange={e => setEditingProduct({ ...editingProduct, inStock: e.target.checked })} />
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${(editingProduct.inStock !== false) ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Stokta Mevcut</span>
                    </label>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Stok Miktarı</label>
                      <div className="flex gap-3">
                        <select
                          value={(editingProduct.stockQuantity ?? -1) === -1 ? 'unlimited' : 'specific'}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingProduct({ ...editingProduct, stockQuantity: e.target.value === 'unlimited' ? -1 : (editingProduct.stockQuantity && editingProduct.stockQuantity > 0 ? editingProduct.stockQuantity : 10) })}
                          className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white focus:outline-none"
                        >
                          <option value="unlimited">Sınırsız</option>
                          <option value="specific">Belirli Adet</option>
                        </select>
                        {(editingProduct.stockQuantity ?? -1) !== -1 && (
                          <input
                            type="number"
                            min="0"
                            value={editingProduct.stockQuantity ?? 0}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingProduct({ ...editingProduct, stockQuantity: Math.max(0, Number(e.target.value)) })}
                            className="flex-1 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white focus:outline-none"
                            placeholder="Adet"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 mt-5">
                    <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Öne Çıkarma Etiketi (Opsiyonel)</label>
                    <div className="text-xs text-surface-500 mb-2">Eğer bir etiket seçilirse, bu ürün anasayfada sergilenecektir. Seçilmezse sadece katalogda kalır.</div>
                    <CustomSelect 
                      value={editingProduct.featuredBadge || ""} 
                      onChange={val => setEditingProduct({ ...editingProduct, featuredBadge: val ? val : null })} 
                      options={[
                        { value: "", label: "Hiçbiri (Anasayfada Görünmez)" },
                        { value: "Popüler", label: "Popüler" },
                        { value: "İndirim", label: "İndirim" },
                        { value: "Yeni", label: "Yeni" },
                        { value: "Çok Satan", label: "Çok Satan" },
                        { value: "Özel Teklif", label: "Özel Teklif" }
                      ]}
                    />
                  </div>
                  <div className="space-y-1.5 mt-5">
                    <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Görsel *</label>
                    <div className="flex gap-2 sm:gap-4 items-center flex-wrap sm:flex-nowrap">
                      <div className="flex-1 min-w-full sm:min-w-0">
                        <input required type="url" value={editingProduct.image} onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })} placeholder="Görsel URL'si girin veya yükleyin" className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white focus:outline-none transition-all" />
                      </div>
                      <div className="shrink-0 flex gap-2">
                        <button type="button" onClick={() => setIsMediaModalOpen(true)} className="px-4 py-3 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-2xl text-sm font-bold transition-colors">
                          Medyadan Seç
                        </button>
                        <div className="relative overflow-hidden">
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          <button type="button" className="px-4 py-3 bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-900/20 dark:hover:bg-brand-900/40 dark:text-brand-400 font-bold text-sm rounded-2xl flex items-center gap-2 transition-colors">
                            <Plus size={16} /> Yükle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Açıklama</label>
                    <textarea value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all" rows={3}></textarea>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">İçerikler (Ingredients)</label>
                    <textarea value={editingProduct.ingredients} onChange={e => setEditingProduct({ ...editingProduct, ingredients: e.target.value })} className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all" rows={2}></textarea>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Endikasyonlar (Örn: Leke Karşıtı, Nemlendirme)</label>
                    <input type="text" value={editingProduct.indications} onChange={e => setEditingProduct({ ...editingProduct, indications: e.target.value })} className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Uygulama Bölgesi</label>
                      <input type="text" value={editingProduct.applicationArea} onChange={e => setEditingProduct({ ...editingProduct, applicationArea: e.target.value })} placeholder="Yüz, Boyun vb." className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Uyarılar</label>
                      <input type="text" value={editingProduct.warnings} onChange={e => setEditingProduct({ ...editingProduct, warnings: e.target.value })} placeholder="Haricen kullanılır vb." className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Hitap Ettiği Problemler (Virgülle ayırın)</label>
                    <input type="text" value={editingProduct.problem.join(', ')} onChange={e => setEditingProduct({ ...editingProduct, problem: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} placeholder="Akne, Leke, Sarkma vb." className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all" />
                  </div>
                </div>}

                {/* ── SEO Tab ── */}
                {activeProductModalTab === 'seo' && (
                  <div className="p-7 space-y-5">
                    <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 rounded-2xl p-4 text-xs text-brand-700 dark:text-brand-300">
                      SEO alanları boş bırakılırsa ürün adı ve açıklaması otomatik kullanılır. Boş bırakabilirsiniz.
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest flex justify-between">
                        <span>SEO Başlığı</span>
                        <span className={(editingProduct.seoTitle || '').length > 60 ? 'text-red-500' : 'text-surface-400'}>
                          {(editingProduct.seoTitle || '').length}/60
                        </span>
                      </label>
                      <input
                        type="text"
                        value={editingProduct.seoTitle || ''}
                        onChange={e => setEditingProduct({ ...editingProduct, seoTitle: e.target.value || null })}
                        placeholder={`${editingProduct.name} — MesoPro`}
                        className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest flex justify-between">
                        <span>SEO Açıklaması</span>
                        <span className={(editingProduct.seoDescription || '').length > 155 ? 'text-red-500' : 'text-surface-400'}>
                          {(editingProduct.seoDescription || '').length}/155
                        </span>
                      </label>
                      <textarea
                        rows={4}
                        value={editingProduct.seoDescription || ''}
                        onChange={e => setEditingProduct({ ...editingProduct, seoDescription: e.target.value || null })}
                        placeholder={editingProduct.description?.slice(0, 155) || 'Meta açıklaması...'}
                        className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white focus:outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-surface-400 uppercase tracking-widest block">Anahtar Kelimeler</label>
                      <input
                        type="text"
                        value={editingProduct.keywords || ''}
                        onChange={e => setEditingProduct({ ...editingProduct, keywords: e.target.value || null })}
                        placeholder="mezoterapi, cilt bakım, hyalüronik asit..."
                        className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white focus:outline-none transition-all"
                      />
                      <p className="text-[10px] text-surface-400">Virgülle ayırın. Google doğrudan kullanmasa da bazı arama motorları ve gelişmiş analizler için değerlidir.</p>
                    </div>

                    {/* Google Önizleme */}
                    <div className="border border-surface-200 dark:border-surface-700 rounded-2xl p-5 bg-white dark:bg-surface-900">
                      <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Google Önizleme</p>
                      <div className="text-xs text-green-700 dark:text-green-500 mb-1 font-medium truncate">mesopro.com/urun/{editingProduct.id}</div>
                      <div className={`font-semibold text-[15px] mb-1 leading-snug truncate ${(editingProduct.seoTitle || editingProduct.name).length > 60 ? 'text-red-500' : 'text-blue-700 dark:text-blue-400'}`}>
                        {editingProduct.seoTitle || `${editingProduct.name} — MesoPro`}
                      </div>
                      <div className={`text-[13px] leading-relaxed line-clamp-2 ${(editingProduct.seoDescription || editingProduct.description || '').length > 155 ? 'text-red-500' : 'text-surface-600 dark:text-surface-400'}`}>
                        {editingProduct.seoDescription || editingProduct.description?.slice(0, 155) || 'Açıklama girilmedi.'}
                      </div>
                      {editingProduct.keywords && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {editingProduct.keywords.split(',').map((k, i) => (
                            <span key={i} className="text-[10px] bg-surface-100 dark:bg-surface-800 text-surface-500 px-2 py-0.5 rounded-full">{k.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-7 border-t border-surface-100 dark:border-surface-900 bg-surface-50/50 dark:bg-surface-950 flex justify-end gap-3 sticky bottom-0 z-10 backdrop-blur-md">
                  <button type="button" onClick={() => { setIsAddingProduct(false); setEditingProduct(null); setActiveProductModalTab('general'); }} className="px-6 py-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-surface-700 dark:text-surface-300 rounded-2xl font-bold hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                    İptal
                  </button>
                  <ShinyButton type="submit">
                    {isSavingProduct ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                    Kaydet
                  </ShinyButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMediaModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMediaModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-surface-950 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-surface-100 dark:border-surface-900 flex justify-between items-center">
                <h3 className="text-xl font-bold text-surface-900 dark:text-white">Görsel Seç</h3>
                <button onClick={() => setIsMediaModalOpen(false)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-900 rounded-full transition-colors"><X size={22} className="text-surface-400" /></button>
              </div>
              <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {media.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-sm text-surface-500">Mevcut medya bulunamadı.</div>
                ) : (
                  media.map(m => (
                    <button key={m.id} onClick={() => { 
                      if (isSelectingCategoryFromMedia) {
                        setCategoryForm(prev => ({ ...prev, image: m.url }));
                        setIsSelectingCategoryFromMedia(false);
                      } else if (isSelectingLogoFromMedia) {
                        setNewBrand(prev => ({ ...prev, logo: m.url }));
                        setIsSelectingLogoFromMedia(false);
                      } else if (editingProduct) {
                        setEditingProduct({ ...editingProduct, image: m.url });
                      }
                      setIsMediaModalOpen(false);
                    }} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-brand-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-surface-950">
                      <img src={m.url} alt="Media" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audit Log Modal */}
      <AnimatePresence>
        {showAuditModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAuditModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }} className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-black text-surface-900 dark:text-white flex items-center gap-2"><ClipboardList size={18} /> Aktivite Logu</h3>
                <button onClick={() => setShowAuditModal(false)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 transition-colors"><X size={18} /></button>
              </div>
              <div className="overflow-y-auto p-6 space-y-3">
                {auditLog.length === 0 ? (
                  <p className="text-surface-400 text-sm text-center py-8">Henüz aktivite yok.</p>
                ) : auditLog.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 py-3 border-b border-surface-50 dark:border-surface-800 last:border-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${entry.action === 'create' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : entry.action === 'delete' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                      {entry.action === 'create' ? <Plus size={14} /> : entry.action === 'delete' ? <Trash2 size={14} /> : <Activity size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                        <span className="font-black">{entry.adminName}</span>{' '}
                        {entry.action === 'create' ? 'oluşturdu' : entry.action === 'delete' ? 'sildi' : 'güncelledi'} · <span className="text-surface-500">{entry.resource}</span>
                        {entry.resourceId && <span className="text-surface-400 text-xs"> #{entry.resourceId}</span>}
                        {entry.detail && <span className="text-surface-500 font-normal"> — {entry.detail}</span>}
                      </p>
                      <p className="text-xs text-surface-400 mt-0.5">{new Date(entry.createdAt).toLocaleString('tr-TR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCustomer(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }} className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-black text-surface-900 dark:text-white">{selectedCustomer.name}</h3>
                  <p className="text-xs text-surface-500">{selectedCustomer.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`mailto:${selectedCustomer.email}`} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-brand-500 transition-colors" title="E-posta Gönder"><Mail size={16} /></a>
                  <button onClick={() => setSelectedCustomer(null)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 transition-colors"><X size={18} /></button>
                </div>
              </div>
              <div className="overflow-y-auto p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Toplam Harcama', value: `₺${selectedCustomer.totalSpent.toLocaleString()}` },
                    { label: 'Sipariş Sayısı', value: String(selectedCustomer.orderCount) },
                    { label: 'Ort. Sipariş', value: selectedCustomer.orderCount > 0 ? `₺${Math.round(selectedCustomer.totalSpent / selectedCustomer.orderCount).toLocaleString()}` : '—' },
                  ].map(s => (
                    <div key={s.label} className="bg-surface-50 dark:bg-surface-800 rounded-2xl p-4 text-center">
                      <p className="text-lg font-black text-surface-900 dark:text-white">{s.value}</p>
                      <p className="text-[10px] text-surface-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* Order History */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Sipariş Geçmişi</p>
                  {isLoadingCustomerOrders ? (
                    <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
                  ) : customerOrders.length === 0 ? (
                    <p className="text-sm text-surface-400">Sipariş bulunamadı.</p>
                  ) : (
                    <div className="space-y-2">
                      {customerOrders.map(o => (
                        <div key={o.id} className="flex items-center justify-between py-3 border-b border-surface-50 dark:border-surface-800 last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">#{o.id}</p>
                            <p className="text-xs text-surface-500">{new Date(o.createdAt).toLocaleDateString('tr-TR')} · {o.items.length} ürün</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-surface-900 dark:text-white">₺{o.total.toLocaleString()}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.status === 'delivered' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : o.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
                              {o.status === 'pending' ? 'Bekliyor' : o.status === 'confirmed' ? 'Onaylandı' : o.status === 'shipped' ? 'Kargoda' : o.status === 'delivered' ? 'Teslim' : 'İptal'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;

