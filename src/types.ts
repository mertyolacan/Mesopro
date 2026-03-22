export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string; // cocktail, pure acid, etc.
  problem: string[]; // spots, anti-aging, hair, etc.
  basePrice: number;
  image: string;
  description: string;
  ingredients: string;
  indications: string;
  applicationArea: string;
  warnings: string;
  featuredBadge?: string | null;
  originalPrice?: number | null;
  inStock?: boolean;
  stockQuantity?: number; // -1=unlimited, 0=out of stock, >0=qty
  seoTitle?: string | null;
  seoDescription?: string | null;
  keywords?: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Campaign {
  id: number;
  name: string;
  type: 'volume' | 'cart_total' | 'product' | 'category' | 'bogo';
  targetValue: string | null;
  minQuantity: number;
  minAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  isActive: boolean;
  isStackable: boolean;
  couponCode?: string;
  startDate?: string;
  endDate?: string;
  maxUsage: number;
  currentUsage: number;
  description?: string;
  bogoFreeQuantity?: number;
  perUserLimit?: number;
  isUsed?: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  appliedCampaigns?: number[];
  createdAt: string;
  userId?: string | number;
  notes?: string;
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  role?: string;
  favorites: string[];
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export interface Category {
  id: number;
  name: string;
  image: string;
}

export interface SupportTicket {
  id: number;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  name: string;
  email: string;
  phone?: string;
  message: string;
  user_id?: number;
  created_at: string;
  updated_at: string;
  replies?: TicketReply[];
  admin_reply_count?: number;
  last_admin_reply_at?: string;
}

export interface TicketReply {
  id: number;
  ticket_id: number;
  message: string;
  is_admin: boolean;
  author_name: string;
  author_email?: string;
  created_at: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  author_name: string;
  tags: string[];
  status: 'draft' | 'published';
  published_at?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  created_at: string;
  updated_at: string;
}

export interface SEOPage {
  page: string;
  title?: string;
  description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  robots?: string;
  canonical?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  meta_keywords?: string;
  updated_at?: string;
}
