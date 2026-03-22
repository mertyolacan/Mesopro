import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { CartItem, Product, Campaign } from './types';
import { getCampaigns } from './api';
import { useAuth } from './AuthContext';

export interface CartIncentive {
  campaignId: number;
  name: string;
  type: string;
  neededValue: number;
  unit: 'items' | 'currency';
  benefit: string;
  description: string;
}

export interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  discount: number;
  total: number;
  incentives: CartIncentive[];
  campaigns: Campaign[];
  appliedCoupon: string;
  setAppliedCoupon: (code: string) => void;
  applyCoupon: (code: string) => boolean | void;
  removeCoupon: () => void;
  couponError: string | null;
  appliedDiscounts: { id: number; name: string; amount: number; description?: string }[];
  activeCampaignIds: number[];
  eligibleCampaignIds: number[];
  refreshCampaigns: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mesopro_cart');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Cart parse error:', err);
    }
    return [];
  });

  // Sepet her değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('mesopro_cart', JSON.stringify(cart));
  }, [cart]);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const { user } = useAuth();
  const prevUser = useRef(user);

  useEffect(() => {
    if (prevUser.current !== null && user === null) {
      setCart([]);
      setAppliedCoupon('');
      setCouponError(null);
      localStorage.removeItem('mesopro_cart');
    }
    prevUser.current = user;
  }, [user]);

  const fetchCampaigns = () => {
    getCampaigns().then(data => {
      const now = new Date();
      setCampaigns(data.filter(c => {
        if (!c.isActive) return false;
        if (c.startDate && new Date(c.startDate) > now) return false;
        if (c.endDate && new Date(c.endDate) < now) return false;
        if (c.maxUsage > 0 && c.currentUsage >= c.maxUsage) return false;
        return true;
      }));
    }).catch(console.error);
  };

  useEffect(() => {
    fetchCampaigns();
    // Re-check campaigns every 30 seconds for expiration
    const interval = setInterval(() => {
      setCampaigns(prev => {
        const now = new Date();
        const filtered = prev.filter(c => {
          if (!c.isActive) return false;
          if (c.startDate && new Date(c.startDate) > now) return false;
          if (c.endDate && new Date(c.endDate) < now) return false;
          if (c.maxUsage > 0 && c.currentUsage >= c.maxUsage) return false;
          return true;
        });
        // Only trigger re-render if something changed
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon('');
    setCouponError(null);
  };

  const applyCoupon = (code: string) => {
    setCouponError(null);
    if (!user) {
      setCouponError('Kupon kullanmak için lütfen giriş yapınız.');
      return;
    }
    const coupon = campaigns.find(c => c.couponCode?.toUpperCase() === code.toUpperCase());
    if (coupon) {
      if (coupon.isUsed) {
        setCouponError('Bu kuponu zaten kullandınız.');
        return;
      }
      setAppliedCoupon(code.toUpperCase());
    } else {
      setCouponError('Geçersiz kupon kodu.');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon('');
    setCouponError(null);
  }

  const { subtotal, discount, total, incentives, activeCampaignIds, eligibleCampaignIds, appliedDiscounts } = useMemo(() => {
    let rawSubtotal = 0;
    let totalQuantity = 0;

    cart.forEach(item => {
      rawSubtotal += item.product.basePrice * item.quantity;
      totalQuantity += item.quantity;
    });

    const calculateCampaignDiscount = (c: Campaign): number => {
      if (c.isUsed) return 0;
      const hasCouponCode = c.couponCode && c.couponCode.trim().length > 0;
      if (hasCouponCode && !user) return 0;
      if (hasCouponCode && c.couponCode!.toUpperCase() !== appliedCoupon.toUpperCase()) return 0;
      if (rawSubtotal < c.minAmount) return 0;

      if (c.type === 'cart_total') {
        return c.discountType === 'percentage' ? (rawSubtotal * c.discountValue / 100) : c.discountValue;
      }

      if (c.type === 'volume') {
        if (totalQuantity < c.minQuantity) return 0;
        return c.discountType === 'percentage' ? (rawSubtotal * c.discountValue / 100) : c.discountValue;
      }

      if (c.type === 'product' || c.type === 'category') {
        let itemDiscountSum = 0;
        cart.forEach(item => {
          const isMatch = c.type === 'product' ? (c.targetValue === item.product.id) : (c.targetValue === item.product.category);
          if (isMatch && item.quantity >= c.minQuantity) {
            const itemTotal = item.product.basePrice * item.quantity;
            itemDiscountSum += c.discountType === 'percentage' ? (itemTotal * c.discountValue / 100) : c.discountValue;
          }
        });
        return itemDiscountSum;
      }

      if (c.type === 'bogo') {
        const matchingItems: { price: number, qty: number }[] = [];
        cart.forEach(item => {
          const isMatch = !c.targetValue || c.targetValue === item.product.id || c.targetValue === item.product.category;
          if (isMatch) matchingItems.push({ price: item.product.basePrice, qty: item.quantity });
        });

        const expanded: number[] = [];
        matchingItems.forEach(i => {
          for (let k = 0; k < i.qty; k++) expanded.push(i.price);
        });

        const setSize = c.minQuantity || 1;
        if (expanded.length < setSize || setSize <= 0) return 0;

        expanded.sort((a, b) => b - a); // descending (expensive to cheap)

        let bogoDiscount = 0;
        const freeItemsPerSet = c.bogoFreeQuantity || 1;
        const totalSets = Math.floor(expanded.length / setSize);

        // Loop through grouped sets — free items are always 100% off
        for (let s = 0; s < totalSets; s++) {
          const setStartIndex = s * setSize;
          for (let f = 0; f < freeItemsPerSet; f++) {
            const itemIndex = setStartIndex + (setSize - 1 - f);
            if (itemIndex < expanded.length) {
              bogoDiscount += expanded[itemIndex];
            }
          }
        }
        return bogoDiscount;
      }

      return 0;
    };

    const appliedDiscountsDetailed: { id: number; name: string; amount: number; description?: string }[] = [];
    let totalStackable = 0;

    // Non-stackables: we track all that *could* apply, but will only pick the best one for the final total.
    const nonStackableOptions: { id: number; name: string; amount: number; description?: string }[] = [];

    const eligibleIds: number[] = [];

    campaigns.forEach(c => {
      const d = calculateCampaignDiscount(c);
      if (d > 0) {
        eligibleIds.push(c.id);
        // Treat campaigns without a coupon code as stackable by default for a better customer experience.
        // Campaigns WITH a coupon code or explicitly marked as isStackable=true will also stack.
        // If it MUST be exclusive, it must have a coupon code or we'd need a third state (exclusive flag).
        const hasCouponCode = c.couponCode && c.couponCode.trim().length > 0;
        if (c.isStackable || !hasCouponCode) {
          totalStackable += d;
          appliedDiscountsDetailed.push({ id: c.id, name: c.name, amount: d, description: c.description });
        } else {
          nonStackableOptions.push({ id: c.id, name: c.name, amount: d, description: c.description });
        }
      }
    });

    // Pick the best non-stackable
    let bestNonStackable = 0;
    if (nonStackableOptions.length > 0) {
      nonStackableOptions.sort((a, b) => b.amount - a.amount);
      const best = nonStackableOptions[0];
      bestNonStackable = best.amount;
      appliedDiscountsDetailed.push(best);
    }

    const appliedIds = appliedDiscountsDetailed.map(ad => ad.id);
    const discountAmount = Math.min(rawSubtotal, totalStackable + bestNonStackable);

    // Multi-Campaign Incentives (Teşvikler)
    const incentives: CartIncentive[] = [];
    
    campaigns.forEach(c => {
      if (c.isUsed) return;
      const hasCouponCode = c.couponCode && c.couponCode.trim().length > 0;
      
      // If campaign requires a coupon, don't show it as an incentive unless it's applied
      if (hasCouponCode && (!user || c.couponCode!.toUpperCase() !== appliedCoupon.toUpperCase())) return;

      // Don't show incentives for already active campaigns (that aren't tiered)
      if (appliedIds.includes(c.id) && c.type !== 'volume') return;

      if (c.type === 'volume') {
        if (c.minQuantity > totalQuantity) {
          incentives.push({
            campaignId: c.id,
            name: c.name,
            type: c.type,
            neededValue: c.minQuantity - totalQuantity,
            unit: 'items',
            benefit: c.discountType === 'percentage' ? `%${c.discountValue}` : `₺${c.discountValue}`,
            description: c.description
          });
        }
      } else if (c.type === 'cart_total') {
        if (c.minAmount > rawSubtotal) {
          incentives.push({
            campaignId: c.id,
            name: c.name,
            type: c.type,
            neededValue: c.minAmount - rawSubtotal,
            unit: 'currency',
            benefit: c.discountType === 'percentage' ? `%${c.discountValue}` : `₺${c.discountValue}`,
            description: c.description
          });
        }
      } else if (c.type === 'bogo') {
        // Find matching items for this BOGO
        let currentQty = 0;
        cart.forEach(item => {
          const isMatch = !c.targetValue || c.targetValue === item.product.id || c.targetValue === item.product.category;
          if (isMatch) currentQty += item.quantity;
        });

        if (currentQty > 0 && currentQty < c.minQuantity) {
          incentives.push({
            campaignId: c.id,
            name: c.name,
            type: c.type,
            neededValue: c.minQuantity - currentQty,
            unit: 'items',
            benefit: c.discountType === 'percentage' ? `%${c.discountValue}` : `₺${c.discountValue}`,
            description: c.description
          });
        }
      }
    });

    // Sort incentives: prioritize ones closest to completion (normalized % or just absolute items/amount)
    // For now, let's keep it simple: volume first, then cart total.
    incentives.sort((a, b) => {
      if (a.unit === b.unit) return a.neededValue - b.neededValue;
      return a.unit === 'items' ? -1 : 1;
    });

    return {
      subtotal: rawSubtotal,
      discount: discountAmount,
      total: Math.max(0, rawSubtotal - discountAmount),
      incentives: incentives.slice(0, 3), // Show top 3 incentives
      activeCampaignIds: appliedIds,
      eligibleCampaignIds: eligibleIds,
      appliedDiscounts: appliedDiscountsDetailed
    };
  }, [cart, campaigns, appliedCoupon]);

  const contextValue = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    discount,
    total,
    incentives,
    campaigns,
    appliedDiscounts,
    activeCampaignIds,
    eligibleCampaignIds,
    setAppliedCoupon,
    applyCoupon,
    removeCoupon,
    couponError,
    refreshCampaigns: fetchCampaigns
  }), [cart, campaigns, subtotal, discount, total, incentives, appliedCoupon, activeCampaignIds, eligibleCampaignIds, appliedDiscounts, couponError]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
