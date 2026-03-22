import { Product, Campaign, Order, Category, User, AdminUser, SupportTicket, TicketReply, FAQ, BlogPost, SEOPage } from './types';
export type { AdminUser };
export type { Order, Category };
export type { SupportTicket, TicketReply, FAQ, BlogPost, SEOPage };

// ── Users & Auth (Real API) ────────────────────────────────────
export const loginUser = async (email: string, pass: string): Promise<{ user: User; token: string }> => {
  const res = await request<{ success: boolean; user: User; token: string }>('/auth/user-login', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass })
  });
  return { user: res.user, token: res.token };
};

export const registerUser = async (data: Partial<User>): Promise<{ user: User; token: string }> => {
  const res = await request<{ success: boolean; user: User; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return { user: res.user, token: res.token };
};

export const forgotPassword = (email: string) =>
  request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });

export const resetPassword = (data: { email: string; token: string; newPassword: string }) =>
  request<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const changePasswordApi = (data: { currentPassword: string; newPassword: string }) =>
  request<{ success: boolean; message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const getUserFavorites = (userId: string | number): Promise<string[]> =>
  request<string[]>(`/users/${userId}/favorites`);

export const toggleFavoriteApi = async (userId: string | number, productId: string): Promise<string[]> => {
  await request(`/users/${userId}/favorites`, {
    method: 'POST',
    body: JSON.stringify({ productId })
  });
  return getUserFavorites(userId);
};

export const updateUserProfile = (userId: string | number, data: Partial<User>) =>
  request<{ success: boolean; user: User }>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });

// Dev: Vite proxies /api → localhost:3001
// Prod: VITE_API_URL env variable ile backend URL'i belirt (örn: https://mesopro-api.onrender.com/api)
const BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('mesopro_auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: res.statusText }));
    const error: any = new Error(errData.error || 'API error');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Creates a caching GET request wrapper. 
 * Consolidates simultaneous identical requests and caches the result for a short duration (2000ms by default)
 * to effectively prevent duplicate network calls on initial page loads/renders.
 */
function memoizeGet<T>(path: string, ttlMs: number = 2000): () => Promise<T> {
  let cachePromise: Promise<T> | null = null;
  let cacheTime = 0;
  return () => {
    const now = Date.now();
    if (cachePromise && now - cacheTime < ttlMs) {
      return cachePromise;
    }
    cachePromise = request<T>(path).catch(err => {
      cachePromise = null;
      throw err;
    });
    cacheTime = now;
    return cachePromise;
  };
}

// ── Upload & Media ────────────────────────────────────────────────────────────
export interface Media {
  id: number;
  url: string;
  created_at: string;
}

export const getMedia = () => request<Media[]>('/media');
export const deleteMedia = (id: number) => request(`/media/${id}`, { method: 'DELETE' });

// ── Messages ──────────────────────────────────────────────────────────────────
export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const getMessages = () => request<ContactMessage[]>('/messages');
export const sendMessage = (data: { name: string; email: string; phone: string; message: string }) => 
  request<ContactMessage>('/messages', { method: 'POST', body: JSON.stringify(data) });
export const deleteMessage = (id: number) => request(`/messages/${id}`, { method: 'DELETE' });
export const markMessageRead = (id: number) => request(`/messages/${id}/read`, { method: 'PATCH' });

// ── Categories ────────────────────────────────────────────────────────────────
// Category type imported from types.ts

export const getCategories = memoizeGet<Category[]>('/categories');
export const createCategory = (data: { name: string; image?: string }) =>
  request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id: number, data: { name?: string; image?: string }) =>
  request<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteCategory = (id: number) =>
  request(`/categories/${id}`, { method: 'DELETE' });

// ── Campaigns ─────────────────────────────────────────────────────────────────
export const getCampaigns = memoizeGet<Campaign[]>('/campaigns');
export const createCampaign = (data: Partial<Campaign>) =>
  request<Campaign>('/campaigns', { method: 'POST', body: JSON.stringify(data) });
export const updateCampaign = (id: number, data: Partial<Campaign>) =>
  request<Campaign>(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteCampaign = (id: number) =>
  request(`/campaigns/${id}`, { method: 'DELETE' });

// ── Brands ────────────────────────────────────────────────────────────────────
export interface Brand {
  id: number;
  name: string;
  logo: string;
  created_at: string;
}

export const getBrands = memoizeGet<Brand[]>('/brands');
export const createBrand = (data: { name: string; logo: string }) => 
  request<Brand>('/brands', { method: 'POST', body: JSON.stringify(data) });
export const deleteBrand = (id: number) => request(`/brands/${id}`, { method: 'DELETE' });
export const updateBrand = (id: number, data: { name: string; logo: string }) => 
  request<Brand>(`/brands/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const uploadImage = async (file: File): Promise<string> => {
  const token = localStorage.getItem('mesopro_auth_token');
  const formData = new FormData();
  formData.append('image', file);
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    body: formData,
    headers: headers,
  });
  
  if (!res.ok) {
    throw new Error('Image upload failed');
  }
  
  const data = await res.json();
  return data.url;
};

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts = memoizeGet<Product[]>('/products');

export const getProductById = (id: string) =>
  request<Product>(`/products/${id}`);

export const saveProduct = (product: Product) =>
  request<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });

export const deleteProduct = (id: string) =>
  request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' });

// ── Orders ────────────────────────────────────────────────────────────────────
// Order type imported from types.ts

export const getOrders = () => request<Order[]>('/orders');

export const getOrderById = (id: string) => request<Order>(`/orders/${id}`);

export const createOrder = (order: Omit<Order, 'id'> & { id: string }) =>
  request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });

export const getUserOrders = (userId: string | number) => 
  request<Order[]>(`/users/${userId}/orders`);

export const updateOrderStatus = (id: string, status: Order['status']) =>
  request<Order>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// ── Admin Users ───────────────────────────────────────────────────────────────
export const getAdminUsers = () => request<AdminUser[]>('/admin/users');

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = () => request<Record<string, string>>('/settings');
export const updateSetting = (key: string, value: string) =>
  request<{ key: string; value: string }>(`/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface AnalyticsKPIs {
  revenue: number; orderCount: number; avgOrder: number; uniqueCustomers: number; newCustomers: number;
  prevRevenue: number; prevOrderCount: number; prevAvgOrder: number; prevNewCustomers: number;
  revenueChange: number; orderChange: number; avgOrderChange: number; newCustomerChange: number;
}
export interface Analytics {
  kpis: AnalyticsKPIs;
  revenueByDay: { day: string; orders: number; revenue: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  statusBreakdown: Record<string, number>;
  campaignStats: { name: string; used_count: number }[];
}
export const getAnalytics = (from: string, to: string) =>
  request<Analytics>(`/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);

// ── Notifications ─────────────────────────────────────────────────────────────
export interface AdminNotifications { newOrders: number; unreadMessages: number; lowStock: number; }
export const getAdminNotifications = () => request<AdminNotifications>('/admin/notifications');

// ── Order Notes ───────────────────────────────────────────────────────────────
export const updateOrderNotes = (id: string, notes: string) =>
  request<{ success: boolean }>(`/orders/${id}/notes`, { method: 'PATCH', body: JSON.stringify({ notes }) });

// ── Audit Log ─────────────────────────────────────────────────────────────────
export interface AuditEntry {
  id: number; adminId: number; adminName: string;
  action: string; resource: string; resourceId: string | null;
  detail: string | null; createdAt: string;
}
export const getAuditLog = () => request<AuditEntry[]>('/admin/audit');

// ── Admin Team ────────────────────────────────────────────────────────────────
export interface AdminTeamMember { id: number; name: string; email: string; createdAt: string; }
export const getAdminTeam = () => request<AdminTeamMember[]>('/admin/team');
export const removeAdminAccess = (id: number) => request<{ success: boolean }>(`/admin/team/${id}`, { method: 'DELETE' });
export const inviteAdmin = (email: string) =>
  request<{ success: boolean; inviteUrl: string }>('/admin/invite', { method: 'POST', body: JSON.stringify({ email }) });

// ── Support Tickets ────────────────────────────────────────────────────────────
export const createTicket = (data: { subject: string; category: string; priority: string; name: string; email: string; phone?: string; message: string }) =>
  request<SupportTicket>('/support', { method: 'POST', body: JSON.stringify(data) });
export const getTickets = () => request<SupportTicket[]>('/support');
export const getTicket = (id: number) => request<SupportTicket>(`/support/${id}`);
export const updateTicketStatus = (id: number, data: { status?: string; priority?: string }) =>
  request<SupportTicket>(`/support/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) });
export const replyTicket = (id: number, message: string) =>
  request<TicketReply>(`/support/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) });
export const deleteTicket = (id: number) => request<{ success: boolean }>(`/support/${id}`, { method: 'DELETE' });
export const getMyTickets = () => request<SupportTicket[]>('/support/my');
export const getMyTicket = (id: number) => request<SupportTicket>(`/support/my/${id}`);

// ── FAQs ──────────────────────────────────────────────────────────────────────
export const getFAQs = () => request<FAQ[]>('/faqs');
export const getAllFAQs = () => request<FAQ[]>('/faqs/all');
export const createFAQ = (data: Partial<FAQ>) => request<FAQ>('/faqs', { method: 'POST', body: JSON.stringify(data) });
export const updateFAQ = (id: number, data: Partial<FAQ>) => request<FAQ>(`/faqs/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteFAQ = (id: number) => request<{ success: boolean }>(`/faqs/${id}`, { method: 'DELETE' });

// ── Blog ──────────────────────────────────────────────────────────────────────
export const getBlogPosts = () => request<BlogPost[]>('/blog');
export const getBlogPost = (slug: string) => request<BlogPost>(`/blog/${slug}`);
export const getAllBlogPosts = () => request<BlogPost[]>('/blog/admin/all');
export const createBlogPost = (data: Partial<BlogPost>) => request<BlogPost>('/blog', { method: 'POST', body: JSON.stringify(data) });
export const updateBlogPost = (id: number, data: Partial<BlogPost>) => request<BlogPost>(`/blog/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteBlogPost = (id: number) => request<{ success: boolean }>(`/blog/${id}`, { method: 'DELETE' });

// ── SEO ───────────────────────────────────────────────────────────────────────
export const getSEOPages = () => request<Record<string, SEOPage>>('/seo');
export const getSEOPage = (page: string) => request<SEOPage>(`/seo/${encodeURIComponent(page)}`);
export const updateSEOPage = (page: string, data: Partial<SEOPage>) =>
  request<SEOPage>(`/seo/${encodeURIComponent(page)}`, { method: 'PUT', body: JSON.stringify(data) });
export const createSEOPage = (page: string) =>
  request<SEOPage>('/seo', { method: 'POST', body: JSON.stringify({ page }) });
export const deleteSEOPage = (page: string) =>
  request<{ success: boolean }>(`/seo/${encodeURIComponent(page)}`, { method: 'DELETE' });
