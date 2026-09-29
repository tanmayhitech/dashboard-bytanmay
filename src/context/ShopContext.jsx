import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';
import { fetchActiveProducts, buildFallbackVariants } from '../services/productService';
import { validateCartItems } from '../services/inventoryService';
import { validateCoupon, calculateCouponDiscount } from '../services/couponService';
import { lookupPincode } from '../services/pincodeService';
import { supabase, isSupabaseConfigured } from '../supabase/client';

const ShopContext = createContext();

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

export const ShopProvider = ({ children }) => {
  // Navigation State with URL, Admin & Influencer Route Detection
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const search = new URLSearchParams(window.location.search);
      if (path === '/admin' || path.startsWith('/admin') || search.get('view') === 'admin' || window.location.hash === '#admin') {
        return 'admin';
      }
      if (
        path === '/influencer' || 
        path.startsWith('/influencer') || 
        path === '/creator' || 
        path.startsWith('/creator') || 
        search.get('view') === 'influencer' || 
        search.get('view') === 'creator' || 
        window.location.hash === '#influencer' || 
        window.location.hash === '#creator'
      ) {
        return 'influencer';
      }
      if (
        path === '/login' || 
        path.startsWith('/login') || 
        path === '/signin' || 
        path.startsWith('/signin') || 
        path === '/auth' || 
        search.get('view') === 'login' || 
        search.get('view') === 'auth' || 
        window.location.hash === '#login' || 
        window.location.hash === '#auth'
      ) {
        return 'login';
      }
    }
    return 'home';
  });
  const [activeProductId, setActiveProductId] = useState('lzr-velo-07');
  
  // Catalog / Product Data State
  const [products, setProducts] = useState(() => {
    return STATIC_PRODUCTS.map(p => {
      const variants = buildFallbackVariants(p);
      const stock = variants.reduce((acc, v) => {
        acc[v.size] = v.availableStock;
        return acc;
      }, {});
      return {
        ...p,
        basePrice: p.price,
        salePrice: null,
        isSale: false,
        formattedBasePrice: p.formattedPrice,
        stock,
        totalStock: variants.reduce((sum, v) => sum + v.availableStock, 0),
        variants
      };
    });
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [productsSource, setProductsSource] = useState('static_initial');

  // Load Authoritative Catalog from Supabase (or fallback)
  const loadCatalog = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const result = await fetchActiveProducts();
      if (result.data && result.data.length > 0) {
        setProducts(result.data);
      }
      setProductsSource(result.source);
      setProductsError(result.error);
    } catch (err) {
      console.warn('[ShopContext] Catalog loading encountered error, keeping active fallback:', err);
      setProductsError(err.message);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Real-time synchronization: listen for admin broadcasts, storage events, and Supabase changes
  useEffect(() => {
    const handleCatalogUpdate = () => {
      console.info('[ShopContext] Live catalog update detected, syncing latest prices and inventory...');
      loadCatalog();
    };

    window.addEventListener('loozars_catalog_updated', handleCatalogUpdate);
    
    const handleStorage = (e) => {
      if (e.key === 'loozars_catalog_version') {
        handleCatalogUpdate();
      }
    };
    window.addEventListener('storage', handleStorage);

    let realtimeChannel = null;
    if (isSupabaseConfigured) {
      realtimeChannel = supabase
        .channel('public:storefront_catalog_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, handleCatalogUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, handleCatalogUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, handleCatalogUpdate)
        .subscribe();
    }

    return () => {
      window.removeEventListener('loozars_catalog_updated', handleCatalogUpdate);
      window.removeEventListener('storage', handleStorage);
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [loadCatalog]);

  // Capture and persist Creator Referral Link (?ref=XYZ10 or ?ref=xyz)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref') || params.get('referral');
      if (refCode && refCode.trim()) {
        const cleanRef = refCode.trim().toUpperCase();
        localStorage.setItem('loozars_referral_code', cleanRef);
        console.info('[ShopContext] Creator referral code captured:', cleanRef);
      }
    } catch (e) {
      console.warn('[ShopContext] Referral capture error:', e);
    }
  }, []);

  // Cart State (stored in localStorage with backward-compatible migration)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('loozarss_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      return parsed.map(item => {
        const product = item.product || {};
        const size = item.size || 'M';
        const variantId = item.variantId || item.variant?.id || `var-${product.id}-${size}`;
        return {
          ...item,
          productId: item.productId || product.db_id || product.id,
          productSlug: item.productSlug || product.id,
          variantId,
          size,
          quantity: Math.max(1, item.quantity || 1)
        };
      });
    } catch {
      return [];
    }
  });

  // Applied Promo Coupon State
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = sessionStorage.getItem('loozars_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Delivery Pincode & City/State Auto-Detection State
  const [deliveryPincode, setDeliveryPincode] = useState(() => {
    try {
      return localStorage.getItem('loozars_delivery_pincode') || '';
    } catch {
      return '';
    }
  });

  const [deliveryInfo, setDeliveryInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('loozars_delivery_info');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCheckingPincode, setIsCheckingPincode] = useState(false);

  const checkDeliveryPincode = async (pincode) => {
    if (!pincode || String(pincode).trim().length < 6) {
      return { valid: false, error: 'Please enter a valid 6-digit Indian PIN code' };
    }
    setIsCheckingPincode(true);
    try {
      const res = await lookupPincode(pincode);
      if (res.valid) {
        setDeliveryPincode(res.pincode);
        setDeliveryInfo(res);
        try {
          localStorage.setItem('loozars_delivery_pincode', res.pincode);
          localStorage.setItem('loozars_delivery_info', JSON.stringify(res));
        } catch {}
      }
      return res;
    } finally {
      setIsCheckingPincode(false);
    }
  };

  const clearDeliveryInfo = () => {
    setDeliveryPincode('');
    setDeliveryInfo(null);
    try {
      localStorage.removeItem('loozars_delivery_pincode');
      localStorage.removeItem('loozars_delivery_info');
    } catch {}
  };

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [lastCompletedOrder, setLastCompletedOrder] = useState(null);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('loozarss_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to sync cart', e);
    }
  }, [cart]);

  // Sync appliedCoupon to sessionStorage
  useEffect(() => {
    try {
      if (appliedCoupon) {
        sessionStorage.setItem('loozars_applied_coupon', JSON.stringify(appliedCoupon));
      } else {
        sessionStorage.removeItem('loozars_applied_coupon');
      }
    } catch (e) {
      console.error('Failed to sync coupon', e);
    }
  }, [appliedCoupon]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, activeProductId]);

  // Browser History & URL synchronization
  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname.toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();

      if (path === '/admin' || path.startsWith('/admin') || search.get('view') === 'admin' || hash === '#admin') {
        setCurrentView('admin');
        return;
      }
      if (path === '/influencer' || path.startsWith('/influencer') || path === '/creator' || path.startsWith('/creator') || search.get('view') === 'influencer' || hash === '#influencer') {
        setCurrentView('influencer');
        return;
      }
      if (path === '/checkout' || search.get('view') === 'checkout' || hash === '#checkout') {
        setCurrentView('checkout');
        return;
      }
      if (path === '/cart' || search.get('view') === 'cart' || hash === '#cart') {
        setCurrentView('cart');
        return;
      }
      if (path === '/shop' || search.get('view') === 'shop' || hash === '#shop') {
        setCurrentView('shop');
        return;
      }
      if (path === '/confirmation' || search.get('view') === 'confirmation' || hash === '#confirmation') {
        setCurrentView('confirmation');
        return;
      }
      if (path === '/login' || search.get('view') === 'login' || hash === '#login') {
        setCurrentView('login');
        return;
      }
      if (path === '/' || path === '') {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateTo = (view, productId = null) => {
    if (productId) {
      setActiveProductId(productId);
    }
    setCurrentView(view);
    setIsCartOpen(false);
    setIsSearchOpen(false);
    setActiveModal(null);

    if (typeof window !== 'undefined' && window.history?.pushState) {
      const targetPath = view === 'home' ? '/' : `/${view}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view }, '', targetPath);
      }
    }
  };

  /**
   * Adds an item to the cart with live price and variant synchronization
   */
  const addToCart = (product, size, quantity = 1, explicitVariant = null) => {
    const liveProduct = products.find(p => p.id === product.id || p.db_id === product.db_id) || product;
    const variant = explicitVariant || liveProduct.variants?.find(v => v.size === size) || null;
    const variantId = variant?.id || `var-${liveProduct.id}-${size}`;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        (item.variantId && item.variantId === variantId) ||
        (item.product?.id === liveProduct.id && item.size === size)
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          variantId,
          quantity: newQty,
          product: liveProduct,
          variant: variant || updated[existingIndex].variant
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: liveProduct.db_id || liveProduct.id,
            productSlug: liveProduct.id,
            variantId,
            size,
            quantity: Math.max(1, quantity),
            product: liveProduct,
            variant
          }
        ];
      }
    });
    setIsCartOpen(true);
  };

  /**
   * Removes an item by variantId or (productId + size)
   */
  const removeFromCart = (variantIdOrProductId, size = null) => {
    setCart(prev => prev.filter(item => {
      if (size !== null) {
        const matchesSize = item.size === size;
        const matchesId = item.product?.id === variantIdOrProductId || 
                          item.productId === variantIdOrProductId || 
                          item.variantId === variantIdOrProductId ||
                          item.product?.db_id === variantIdOrProductId;
        return !(matchesId && matchesSize);
      }
      return item.variantId !== variantIdOrProductId && 
             item.product?.id !== variantIdOrProductId && 
             item.productId !== variantIdOrProductId &&
             item.product?.db_id !== variantIdOrProductId;
    }));
  };

  /**
   * Updates quantity by variantId or (productId + size)
   */
  const updateQuantity = (variantIdOrProductId, sizeOrDelta, maybeDelta = null) => {
    let targetSize = null;
    let delta = 0;

    if (maybeDelta !== null) {
      targetSize = sizeOrDelta;
      delta = maybeDelta;
    } else {
      delta = sizeOrDelta;
    }

    setCart(prev => {
      return prev.map(item => {
        const isMatch = targetSize !== null
          ? ((item.product?.id === variantIdOrProductId || item.productId === variantIdOrProductId || item.variantId === variantIdOrProductId || item.product?.db_id === variantIdOrProductId) && item.size === targetSize)
          : (item.variantId === variantIdOrProductId || item.product?.id === variantIdOrProductId || item.productId === variantIdOrProductId || item.product?.db_id === variantIdOrProductId);

        if (isMatch) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  /**
   * Validates cart against live Supabase stock (UX layer)
   */
  const validateCart = async () => {
    return await validateCartItems(cart);
  };

  /**
   * Authoritative Stale Cart Detection & Refresh:
   * Checks if catalog prices changed while user had items in cart
   */
  const checkAndRefreshCartPrices = useCallback(() => {
    let hasPriceChanges = false;
    const priceChangeNotices = [];

    const updatedCart = cart.map(item => {
      const liveProduct = products.find(p => p.id === item.product?.id || p.db_id === item.product?.db_id || p.id === item.productId || p.db_id === item.productId);
      if (!liveProduct) return item;

      const liveVariant = liveProduct.variants?.find(v => v.id === item.variantId || v.size === item.size);
      const currentAuthoritativePrice = liveVariant?.priceOverride ?? liveProduct.salePrice ?? liveProduct.price ?? 899;
      const oldPrice = item.product?.price ?? item.price ?? 899;

      if (currentAuthoritativePrice !== oldPrice) {
        hasPriceChanges = true;
        priceChangeNotices.push(`Price for ${liveProduct.name} (${item.size}) updated to ₹${currentAuthoritativePrice.toLocaleString('en-IN')}`);
        return {
          ...item,
          product: {
            ...liveProduct,
            price: currentAuthoritativePrice
          },
          variant: liveVariant || item.variant,
          unitPrice: currentAuthoritativePrice
        };
      }
      return item;
    });

    if (hasPriceChanges) {
      setCart(updatedCart);
      return { updated: true, notices: priceChangeNotices };
    }

    return { updated: false, notices: [] };
  }, [cart, products]);

  /**
   * Dynamically evaluates cart subtotal using latest authoritative prices from live catalog
   */
  const cartSubtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const liveProd = products.find(p => p.id === item.product?.id || p.db_id === item.product?.db_id || p.id === item.productId || p.db_id === item.productId);
      const liveVariant = liveProd?.variants?.find(v => v.id === item.variantId || v.size === item.size);
      const unitPrice = liveVariant?.priceOverride ?? liveProd?.salePrice ?? liveProd?.price ?? item.product?.price ?? 899;
      return total + (unitPrice * item.quantity);
    }, 0);
  }, [cart, products]);

  /**
   * Authoritative coupon validation and application
   */
  const applyCoupon = async (code) => {
    if (!code || !code.trim()) {
      return { success: false, error: 'Please enter a coupon code.' };
    }

    const res = await validateCoupon(code, cartSubtotal);
    if (res.valid) {
      setAppliedCoupon(res);
      return { success: true, coupon: res };
    } else {
      return { success: false, error: res.error || 'Invalid coupon code.' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Re-verify coupon discount against live subtotal
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return calculateCouponDiscount(appliedCoupon, cartSubtotal);
  }, [appliedCoupon, cartSubtotal]);

  const netSubtotal = Math.max(0, cartSubtotal - couponDiscount);
  const freeShippingThreshold = 2000;
  const shippingCost = (netSubtotal >= freeShippingThreshold || cartSubtotal === 0) ? 0 : 99;
  const cartTotal = netSubtotal + shippingCost;
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Active product resolution
  const currentProduct = products.find(p => p.id === activeProductId) || products[0] || STATIC_PRODUCTS[0];

  return (
    <ShopContext.Provider value={{
      currentView,
      setCurrentView,
      navigateTo,
      activeProductId,
      currentProduct,
      products,
      isLoadingProducts,
      productsError,
      productsSource,
      refreshProducts: loadCatalog,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      validateCart,
      checkAndRefreshCartPrices,
      cartCount,
      cartSubtotal,
      appliedCoupon,
      applyCoupon,
      removeCoupon,
      couponDiscount,
      netSubtotal,
      shippingCost,
      freeShippingThreshold,
      cartTotal,
      isCartOpen,
      setIsCartOpen,
      isSearchOpen,
      setIsSearchOpen,
      activeModal,
      setActiveModal,
      deliveryPincode,
      deliveryInfo,
      isCheckingPincode,
      checkDeliveryPincode,
      clearDeliveryInfo,
      lastCompletedOrder,
      setLastCompletedOrder
    }}>
      {children}
    </ShopContext.Provider>
  );
};
