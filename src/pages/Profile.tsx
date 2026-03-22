import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Heart, User, LogOut, ChevronRight, Truck, CheckCircle2, Clock, X, Settings, MapPin, Phone, Save, ShieldCheck, ShoppingBag, Loader2, Eye, EyeOff, ArrowLeft, Zap, LifeBuoy, Plus, MessageCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getUserOrders, getProducts, changePasswordApi, forgotPassword, getMyTicket, getMyTickets } from '../api';
import { Order, Product, SupportTicket, TicketReply } from '../types';
import { useUnreadTickets, markTicketSeen, hasUnread } from '../hooks/useUnreadTickets';

export const Profile = () => {
  const { user, logout, favorites, toggleFavorite, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'settings' | 'support'>(
    searchParams.get('tab') === 'support' ? 'support' : 'orders'
  );
  const { tickets: myTickets, setTickets: setMyTickets, unreadCount } = useUnreadTickets();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passStatus, setPassStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [isResetSending, setIsResetSending] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    getUserOrders(user.id).then(setOrders).catch(console.error);
    getProducts().then(setAllProducts).catch(console.error);
  }, [user, navigate]);

  if (!user) return null;

  const favoriteProducts = allProducts.filter(p => favorites.includes(p.id));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser(profileData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      setPassStatus({ type: 'error', msg: 'Yeni şifreler eşleşmiyor.' });
      return;
    }
    if (passwordData.new.length < 6) {
      setPassStatus({ type: 'error', msg: 'Yeni şifre en az 6 karakter olmalıdır.' });
      return;
    }

    setIsChangingPass(true);
    setPassStatus(null);
    try {
      await changePasswordApi({
        currentPassword: passwordData.current,
        newPassword: passwordData.new
      });
      setPassStatus({ type: 'success', msg: 'Şifreniz başarıyla güncellendi.' });
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      setPassStatus({ type: 'error', msg: err.message || 'Şifre değiştirilemedi.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleForgotPass = async () => {
    if (!user?.email) return;
    setIsResetSending(true);
    try {
      await forgotPassword(user.email);
      setPassStatus({ type: 'success', msg: 'Sıfırlama bağlantısı e-posta adresinize gönderildi.' });
    } catch (err: any) {
      setPassStatus({ type: 'error', msg: 'E-posta gönderilemedi.' });
    } finally {
      setIsResetSending(false);
    }
  };

  const statusIcons: Record<string, any> = {
    pending: <Clock size={16} className="text-orange-500" />,
    confirmed: <Package size={16} className="text-blue-500" />,
    shipped: <Truck size={16} className="text-purple-500" />,
    delivered: <CheckCircle2 size={16} className="text-green-500" />,
    cancelled: <X size={16} className="text-red-500" />
  };

  const statusTexts: Record<string, string> = {
    pending: 'Bekliyor',
    confirmed: 'Hazırlanıyor',
    shipped: 'Kargoda',
    delivered: 'Teslim Edildi',
    cancelled: 'İptal Edildi'
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-500">
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 pt-6 sm:pt-10 pb-12 sm:pb-20">
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
              <span className="text-brand-600 dark:text-brand-400">Hesabım</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-surface-900 dark:text-white tracking-tighter leading-tight">Hoş geldin, {user.name}</h1>
            <p className="text-surface-500 dark:text-surface-400 text-sm font-medium mt-1">{user.email}</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="px-8 py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={18} /> Çıkış Yap
          </button>
        </div>

        <div className="grid grid-cols-4 sm:flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-surface-900 p-1.5 sm:p-2 rounded-2xl w-full sm:w-fit mb-8 shadow-sm border border-surface-100 dark:border-surface-800 relative z-10">
          {(['orders', 'favorites', 'support', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-1 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold transition-all ${activeTab === tab ? 'bg-surface-900 dark:bg-white text-white dark:text-surface-900 shadow-lg' : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'}`}
            >
              {tab === 'orders' && <Package size={16} />}
              {tab === 'favorites' && <Heart size={16} className={activeTab === 'favorites' ? 'fill-current' : ''} />}
              {tab === 'support' && (
                <span className="relative">
                  <LifeBuoy size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-black">{unreadCount}</span>
                  )}
                </span>
              )}
              {tab === 'settings' && <Settings size={16} />}
              <span className="text-[9px] sm:text-sm whitespace-nowrap">
                {tab === 'orders' ? 'Siparişlerim' : tab === 'favorites' ? 'Favorilerim' : tab === 'support' ? 'Destek' : 'Ayarlar'}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'orders' ? (
            <motion.div key="orders" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-surface-900 rounded-[3rem] border border-surface-100 dark:border-surface-800">
                  <Package size={64} className="mx-auto text-surface-200 dark:text-surface-800 mb-6" />
                  <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Henüz siparişiniz yok</h3>
                  <p className="text-surface-500 mb-8 max-w-sm mx-auto">Sipariş vererek başlayın.</p>
                  <button onClick={() => navigate('/')} className="px-8 py-3 bg-brand-500 text-white rounded-xl font-bold">Alışverişe Başla</button>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-white dark:bg-surface-900 p-6 sm:p-8 rounded-[2.5rem] border border-surface-100 dark:border-surface-800 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl transition-all group cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-surface-50 dark:bg-surface-800 rounded-2xl flex items-center justify-center text-surface-400 group-hover:text-brand-500 transition-colors"><ShoppingBag size={24} /></div>
                      <div>
                        <div className="flex items-center gap-3 mb-1"><span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">SİPARİŞ NO:</span><span className="font-bold text-surface-900 dark:text-white group-hover:text-brand-500 transition-colors">#{order.id}</span></div>
                        <p className="text-sm font-medium text-surface-500">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                    <div className="flex flex-col md:items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                      <div className="flex items-center gap-2 bg-surface-100/50 dark:bg-surface-800/50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-surface-700 dark:text-surface-300">
                        {statusIcons[order.status]} {statusTexts[order.status]}
                      </div>
                      <p className="font-black text-xl text-surface-900 dark:text-white tracking-tighter">₺{order.total.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          ) : activeTab === 'support' ? (
            <motion.div key="support" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-surface-500 font-medium">{myTickets.length} talep</p>
                <Link to="/destek" className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-brand-500/20">
                  <Plus size={13} /> Yeni Talep
                </Link>
              </div>
              {myTickets.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-surface-900 rounded-[3rem] border border-surface-100 dark:border-surface-800">
                  <LifeBuoy size={64} className="mx-auto text-surface-200 dark:text-surface-800 mb-6" />
                  <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Destek talebiniz yok</h3>
                  <p className="text-surface-500 mb-8 max-w-sm mx-auto">Bir sorunuz mu var? Destek ekibimize ulaşın.</p>
                  <Link to="/destek" className="inline-flex items-center gap-2 px-8 py-3 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-400 transition-colors">
                    <Plus size={16} /> Talep Oluştur
                  </Link>
                </div>
              ) : myTickets.map((ticket: SupportTicket) => {
                const unread = hasUnread(user.id, ticket);
                return (
                <div key={ticket.id} onClick={async () => {
                  setTicketLoading(true);
                  markTicketSeen(user.id, ticket);
                  try { const detail = await getMyTicket(ticket.id); setSelectedTicket(detail); } catch {}
                  finally { setTicketLoading(false); }
                }} className={`bg-white dark:bg-surface-900 p-6 rounded-[2.5rem] border flex items-start justify-between gap-4 cursor-pointer hover:shadow-md transition-all group ${unread ? 'border-brand-300 dark:border-brand-700 ring-1 ring-brand-200 dark:ring-brand-800' : 'border-surface-100 dark:border-surface-800 hover:border-brand-300 dark:hover:border-brand-600'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl ${ticket.status === 'open' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : ticket.status === 'in_progress' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : ticket.status === 'resolved' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-surface-100 text-surface-400'}`}>
                        {ticket.status === 'open' ? 'Açık' : ticket.status === 'in_progress' ? 'İşlemde' : ticket.status === 'resolved' ? 'Çözüldü' : 'Kapalı'}
                      </span>
                      <span className="text-[10px] text-surface-400 font-semibold">#{ticket.id}</span>
                      {unread && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-lg">
                          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse inline-block" />
                          Yeni yanıt
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-bold ${unread ? 'text-brand-700 dark:text-brand-300' : 'text-surface-900 dark:text-white'}`}>{ticket.subject}</p>
                    <p className="text-xs text-surface-400 mt-1">{new Date(ticket.created_at).toLocaleDateString('tr-TR')} · {ticket.category}</p>
                  </div>
                  <ChevronRight size={16} className="text-surface-300 group-hover:text-brand-500 shrink-0 mt-1 transition-colors" />
                </div>
                );
              })}

              {/* Ticket Detail Modal */}
              <AnimatePresence>
                {(selectedTicket || ticketLoading) && (
                  <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTicket(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white dark:bg-surface-900 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                      {ticketLoading ? (
                        <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-brand-500" /></div>
                      ) : selectedTicket && (
                        <>
                          <div className="p-5 border-b border-surface-100 dark:border-surface-800 flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${selectedTicket.status === 'open' ? 'bg-amber-50 text-amber-600' : selectedTicket.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : selectedTicket.status === 'resolved' ? 'bg-green-50 text-green-600' : 'bg-surface-100 text-surface-400'}`}>
                                  {selectedTicket.status === 'open' ? 'Açık' : selectedTicket.status === 'in_progress' ? 'İşlemde' : selectedTicket.status === 'resolved' ? 'Çözüldü' : 'Kapalı'}
                                </span>
                                <span className="text-xs text-surface-400">#{selectedTicket.id} · {selectedTicket.category}</span>
                              </div>
                              <h3 className="text-lg font-black text-surface-900 dark:text-white">{selectedTicket.subject}</h3>
                              <p className="text-xs text-surface-400 mt-0.5">{new Date(selectedTicket.created_at).toLocaleString('tr-TR')}</p>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors shrink-0"><X size={16} /></button>
                          </div>
                          <div className="overflow-y-auto flex-1 p-5 space-y-4">
                            {/* Orijinal mesaj */}
                            <div className="bg-surface-50 dark:bg-surface-800 rounded-2xl p-4">
                              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">Talebiniz</p>
                              <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                            </div>
                            {/* Yanıtlar */}
                            {(selectedTicket.replies || []).length === 0 ? (
                              <div className="text-center py-8 text-surface-400">
                                <MessageCircle size={24} className="mx-auto mb-2 opacity-40" />
                                <p className="text-xs">Henüz yanıt yok. En kısa sürede dönüş yapacağız.</p>
                              </div>
                            ) : (selectedTicket.replies || []).map((reply: TicketReply) => (
                              <div key={reply.id} className={`rounded-2xl p-4 ${reply.is_admin ? 'bg-brand-50 dark:bg-brand-900/20 ml-4' : 'bg-surface-50 dark:bg-surface-800 mr-4'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">
                                    {reply.is_admin ? '🛡 MesoPro Destek' : 'Siz'}
                                  </p>
                                  <p className="text-[10px] text-surface-400">{new Date(reply.created_at).toLocaleString('tr-TR')}</p>
                                </div>
                                <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : activeTab === 'favorites' ? (
            <motion.div key="favorites" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {favoriteProducts.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-surface-900 rounded-[3rem] border border-surface-100 dark:border-surface-800">
                  <Heart size={64} className="mx-auto text-surface-200 dark:text-surface-800 mb-6" />
                  <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Favori Ürününüz Yok</h3>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {favoriteProducts.map(product => (
                    <div key={product.id} className="bg-white dark:bg-surface-900 rounded-2xl sm:rounded-[2.5rem] border border-surface-100 dark:border-surface-800 overflow-hidden relative group hover:shadow-2xl transition-all">
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }} className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 dark:bg-surface-800/90 backdrop-blur rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group/fav">
                        <Heart size={14} className="fill-red-500 text-red-500 group-hover/fav:scale-110 transition-transform sm:w-[18px] sm:h-[18px]" />
                      </button>
                      <div className="aspect-[4/5] overflow-hidden"><img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /></div>
                      <div className="p-3 sm:p-6">
                        <div className="mb-3 sm:mb-4">
                          <h3 className="font-bold text-surface-900 dark:text-white text-xs sm:text-lg line-clamp-1 mb-0.5 sm:mb-1">{product.name}</h3>
                          <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-surface-400">{product.brand}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="font-black text-sm sm:text-xl tracking-tighter">₺{product.basePrice.toLocaleString()}</p>
                          <button onClick={() => navigate(`/product/${product.id}`)} className="p-2 sm:p-3 bg-surface-50 dark:bg-surface-800 rounded-lg sm:rounded-xl hover:bg-brand-500 hover:text-white transition-all">
                            <ChevronRight size={14} strokeWidth={3} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
             <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
               <div className="bg-white dark:bg-surface-900 p-8 sm:p-10 rounded-[2.5rem] border border-surface-100 dark:border-surface-800 transition-colors duration-500">
                 <div className="flex items-center gap-4 mb-10"><div className="w-12 h-12 bg-surface-50 dark:bg-surface-800 rounded-2xl flex items-center justify-center text-surface-900 dark:text-white"><User size={20} /></div><h3 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">Profil Bilgileri</h3></div>
                 <form onSubmit={handleUpdateProfile} className="space-y-6">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div><label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">Ad Soyad</label><div className="relative group"><User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" /><input type="text" value={profileData.name} onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))} className="w-full pl-12 pr-6 py-4 bg-surface-50 dark:bg-surface-950 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all" /></div></div>
                     <div><label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">E-posta (Sabit)</label><div className="relative"><Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 opacity-30" size={16} /><input type="email" readOnly value={user.email} className="w-full pl-12 pr-6 py-4 bg-surface-100 dark:bg-surface-800 border-none rounded-2xl text-sm text-surface-500 dark:text-surface-400 outline-none cursor-not-allowed" /></div></div>
                   </div>
                   <div><label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">Telefon Numarası</label><div className="relative group"><Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" /><input type="tel" value={profileData.phone} onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} className="w-full pl-12 pr-6 py-4 bg-surface-50 dark:bg-surface-950 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all" /></div></div>
                   <div><label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">Adres Bilgisi</label><div className="relative group"><MapPin size={16} className="absolute left-4 top-5 text-surface-400 group-focus-within:text-brand-500 transition-colors" /><textarea rows={4} value={profileData.address} onChange={e => setProfileData(p => ({ ...p, address: e.target.value }))} className="w-full pl-12 pr-6 py-5 bg-surface-50 dark:bg-surface-950 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500 dark:text-white outline-none resize-none transition-all" /></div></div>
                   <div className="flex items-center gap-4 pt-4"><button type="submit" disabled={isSaving} className="flex-1 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50">{isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Profil Bilgilerini Güncelle</button>{saveSuccess && <div className="hidden sm:flex text-green-600 text-sm font-black items-center gap-2"><CheckCircle2 size={16} /> BAŞARILI</div>}</div>
                 </form>
               </div>
               <div className="bg-white dark:bg-surface-900 p-8 sm:p-10 rounded-[2.5rem] border border-surface-100 dark:border-surface-800 transition-colors duration-500">
                 <div className="flex items-center gap-4 mb-10"><div className="w-12 h-12 bg-surface-50 dark:bg-surface-800 rounded-2xl flex items-center justify-center text-surface-900 dark:text-white"><ShieldCheck size={20} /></div><h3 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">Güvenlik & Şifre</h3></div>
                 <form onSubmit={handleChangePassword} className="space-y-6">
                    <div><label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">Mevcut Şifre</label><div className="relative group"><input type={showPass.current ? "text" : "password"} required value={passwordData.current} onChange={e => setPasswordData(d => ({ ...d, current: e.target.value }))} className="w-full pl-6 pr-12 py-4 bg-surface-50 dark:bg-surface-950 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all" /><button type="button" onClick={() => setShowPass(p => ({ ...p, current: !p.current }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-brand-500 transition-colors">{showPass.current ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div><label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">Yeni Şifre</label><div className="relative group"><input type={showPass.new ? "text" : "password"} required value={passwordData.new} onChange={e => setPasswordData(d => ({ ...d, new: e.target.value }))} className="w-full pl-6 pr-12 py-4 bg-surface-50 dark:bg-surface-950 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all" /><button type="button" onClick={() => setShowPass(p => ({ ...p, new: !p.new }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-brand-500 transition-colors">{showPass.new ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
                      <div><label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">Yeni Şifre (Tekrar)</label><div className="relative group"><input type={showPass.confirm ? "text" : "password"} required value={passwordData.confirm} onChange={e => setPasswordData(d => ({ ...d, confirm: e.target.value }))} className="w-full pl-6 pr-12 py-4 bg-surface-50 dark:bg-surface-950 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all" /><button type="button" onClick={() => setShowPass(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-brand-500 transition-colors">{showPass.confirm ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
                    </div>
                    {passStatus && <div className={`p-4 rounded-xl text-xs font-bold ${passStatus.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{passStatus.msg}</div>}
                    <div className="pt-4 flex flex-col gap-4">
                      <button type="submit" disabled={isChangingPass} className="w-full px-8 py-4 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50">{isChangingPass ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />} Şifreyi Güncelle</button>
                      <button type="button" onClick={handleForgotPass} disabled={isResetSending} className="w-full px-8 py-4 bg-surface-50 dark:bg-surface-800 text-surface-600 rounded-2xl font-bold text-sm border-2 border-transparent hover:border-brand-500 transition-all flex items-center justify-center gap-3">Şifremi Unuttum (E-posta ile)</button>
                    </div>
                 </form>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
             <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-surface-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 sm:p-10 relative" onClick={e => e.stopPropagation()}>
               <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 p-2 bg-surface-100 dark:bg-surface-800 rounded-full transition-all text-surface-900 dark:text-white"><X size={20} /></button>
               <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2">Sipariş Detayı</h2>
               <p className="text-surface-500 font-medium mb-8">#{selectedOrder.id}</p>
               <div className="relative pt-4 pb-12">
                 <div className="absolute top-[34px] left-[10%] right-[10%] h-1 bg-surface-200 dark:bg-surface-800 -z-10 rounded-full"></div>
                 <div className="absolute top-[34px] left-[10%] h-1 bg-brand-500 -z-10 rounded-full transition-all duration-1000" style={{ width: selectedOrder.status === 'pending' ? '0%' : selectedOrder.status === 'confirmed' ? '33%' : selectedOrder.status === 'shipped' ? '66%' : selectedOrder.status === 'delivered' ? '100%' : '0%' }}></div>
                 <div className="flex justify-between relative z-10">
                   {['pending', 'confirmed', 'shipped', 'delivered'].map((s, i) => (
                     <div key={s} className="flex flex-col items-center w-1/4">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${selectedOrder.status === s || (i === 0 && selectedOrder.status !== 'cancelled') || (i === 1 && ['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status)) || (i === 2 && ['shipped', 'delivered'].includes(selectedOrder.status)) || (i === 3 && selectedOrder.status === 'delivered') ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-400'}`}>
                         {i === 0 && <Clock size={16} />}
                         {i === 1 && <Package size={16} />}
                         {i === 2 && <Truck size={16} />}
                         {i === 3 && <CheckCircle2 size={16} />}
                       </div>
                       <span className="text-[10px] font-bold text-center mt-3 text-surface-900 dark:text-white">{statusTexts[s]}</span>
                     </div>
                   ))}
                 </div>
               </div>
               <div className="bg-surface-50 dark:bg-surface-800 p-6 rounded-2xl max-h-60 overflow-y-auto">
                 <h3 className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-4">Ürünler</h3>
                 <div className="space-y-3">
                   {selectedOrder.items.map(item => (
                     <div key={item.productId} className="flex justify-between items-center text-sm font-medium"><span className="text-surface-900 dark:text-white">{item.quantity}x {item.productName}</span><span className="text-surface-500">₺{(item.price * item.quantity).toLocaleString()}</span></div>
                   ))}
                   <div className="pt-4 mt-4 border-t border-surface-200 flex justify-between font-black text-base text-surface-900 dark:text-white"><span>Toplam Tutar</span><span>₺{selectedOrder.total.toLocaleString()}</span></div>
                 </div>
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
