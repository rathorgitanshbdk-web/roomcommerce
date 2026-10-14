import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, CartItem, Order } from './types';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { BulkOrderSection } from './components/BulkOrderSection';
import { ReviewsSection } from './components/ReviewsSection';
import { Footer } from './components/Footer';
import { AdminDashboard } from './admin/AdminDashboard';
import {
  fetchProducts,
  getCachedProducts,
  filterProductsClientSide,
  subscribeToStoreChanges,
  calculateProductOfferPricing,
} from './services/api';
import { ShoppingBag } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { t } = useLanguage();

  // Navigation / View State ('shop' or 'admin')
  const [currentView, setCurrentView] = useState<'shop' | 'admin'>(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path.startsWith('/admin') || hash === '#admin' ? 'admin' : 'shop';
  });

  // Listen to URL path & hash changes for direct /admin access
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.startsWith('/admin') || hash === '#admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('shop');
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleToggleAdminView = (view: 'shop' | 'admin') => {
    setCurrentView(view);
    if (view === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  // Master Product List (Initialized from localStorage cache for 0ms first paint)
  const [allProducts, setAllProducts] = useState<Product[]>(() => getCachedProducts() || []);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(() => {
    const cached = getCachedProducts();
    return cached === null;
  });
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart State (Persisted in localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('giriraj_cart_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('giriraj_cart_v2', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Modal Controls
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState<boolean>(false);
  const [placedOrderForModal, setPlacedOrderForModal] = useState<Order | null>(null);

  // Load full product catalog from Supabase and keep synced in real time
  const loadProducts = useCallback(
    async (background = false) => {
      if (!background && allProducts.length === 0) {
        setLoadingProducts(true);
      }
      try {
        const list = await fetchProducts();
        setAllProducts(list);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoadingProducts(false);
      }
    },
    [allProducts.length]
  );

  useEffect(() => {
    loadProducts(allProducts.length > 0);

    const unsubscribe = subscribeToStoreChanges({
      onProductsChange: () => {
        loadProducts(true);
      },
    });

    return () => unsubscribe();
  }, []);

  // Re-sync when switching back from Admin to Shop
  useEffect(() => {
    if (currentView === 'shop') {
      loadProducts(true);
    }
  }, [currentView]);

  // Keep cart item prices & offer splits synchronized with live product stock/offers
  useEffect(() => {
    if (allProducts.length === 0 || cartItems.length === 0) return;
    setCartItems((prev) =>
      prev
        .map((item) => {
          const prod = allProducts.find((p) => p.id === item.productId);
          if (!prod) return item;
          if (!prod.inStock || prod.stockQuantity <= 0) return null;
          const cappedQty = Math.min(item.quantity, prod.stockQuantity);
          const calc = calculateProductOfferPricing(prod, cappedQty);
          return {
            ...item,
            quantity: cappedQty,
            unitPrice: calc.regularUnitPrice,
            offerUnitPrice: calc.hasActiveOffer ? calc.offerUnitPrice : undefined,
            offerUnitsApplied: calc.offerUnitsApplied,
            regularUnitsApplied: calc.regularUnitsApplied,
            discountSaved: calc.discountSaved,
            totalPrice: calc.totalPrice,
            imageUrl: prod.imageUrl,
          };
        })
        .filter(Boolean) as CartItem[]
    );
  }, [allProducts]);

  // 0ms Instant Client-Side Filtering
  const filteredProducts = useMemo(() => {
    return filterProductsClientSide(allProducts, activeCategory, searchQuery);
  }, [allProducts, activeCategory, searchQuery]);

  // Cart Operations (No Weight Options; Supports Partial Offer Splits & Stock Caps)
  const handleAddToCart = (
    product: Product,
    flavor: string | undefined,
    quantity: number
  ) => {
    if (!product.inStock || product.stockQuantity <= 0) return;
    const cartItemId = `${product.id}-${flavor || 'standard'}`;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(
          product.stockQuantity,
          updated[existingIndex].quantity + quantity
        );
        const calc = calculateProductOfferPricing(product, newQty);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          unitPrice: calc.regularUnitPrice,
          offerUnitPrice: calc.hasActiveOffer ? calc.offerUnitPrice : undefined,
          offerUnitsApplied: calc.offerUnitsApplied,
          regularUnitsApplied: calc.regularUnitsApplied,
          discountSaved: calc.discountSaved,
          totalPrice: calc.totalPrice,
        };
        return updated;
      } else {
        const cappedQty = Math.min(product.stockQuantity, quantity);
        const calc = calculateProductOfferPricing(product, cappedQty);
        const newItem: CartItem = {
          cartItemId,
          productId: product.id,
          productName: product.name,
          gujaratiName: product.gujaratiName,
          category: product.category,
          selectedFlavor: flavor,
          quantity: cappedQty,
          unitPrice: calc.regularUnitPrice,
          offerUnitPrice: calc.hasActiveOffer ? calc.offerUnitPrice : undefined,
          offerUnitsApplied: calc.offerUnitsApplied,
          regularUnitsApplied: calc.regularUnitsApplied,
          discountSaved: calc.discountSaved,
          totalPrice: calc.totalPrice,
          imageUrl: product.imageUrl,
        };
        return [...prev, newItem];
      }
    });
  };

  const handleUpdateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const prod = allProducts.find((p) => p.id === item.productId);
          const maxStock = prod ? prod.stockQuantity : 999;
          const cappedQty = Math.min(maxStock, newQty);
          if (prod) {
            const calc = calculateProductOfferPricing(prod, cappedQty);
            return {
              ...item,
              quantity: cappedQty,
              unitPrice: calc.regularUnitPrice,
              offerUnitPrice: calc.hasActiveOffer ? calc.offerUnitPrice : undefined,
              offerUnitsApplied: calc.offerUnitsApplied,
              regularUnitsApplied: calc.regularUnitsApplied,
              discountSaved: calc.discountSaved,
              totalPrice: calc.totalPrice,
            };
          }
          return {
            ...item,
            quantity: cappedQty,
            totalPrice: cappedQty * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  // Order Placement Handler
  const handleOrderSuccess = (createdOrder: Order) => {
    setCartItems([]); // Clear cart
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setPlacedOrderForModal(createdOrder);
    loadProducts(true); // Immediately refresh stock & offer counters on storefront
  };

  // Render Admin Dashboard if view is admin
  if (currentView === 'admin') {
    return <AdminDashboard onBackToShop={() => handleToggleAdminView('shop')} />;
  }

  // Render Main Storefront
  return (
    <div className="min-h-screen bg-[#FEFBF2] text-[#451A03] font-sans flex flex-col selection:bg-[#FEF3C7]">
      {/* Header */}
      <Header
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenBulkOrder={() => {
          const bulkEl = document.getElementById('bulk-orders');
          if (bulkEl) bulkEl.scrollIntoView({ behavior: 'smooth' });
        }}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentView={currentView}
        onToggleAdmin={handleToggleAdminView}
      />

      {/* Hero Section */}
      <HeroSection
        onExploreClick={() => {
          const gridEl = document.getElementById('products-grid');
          if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth' });
        }}
        onBulkClick={() => {
          const bulkEl = document.getElementById('bulk-orders');
          if (bulkEl) bulkEl.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Catalog Grid */}
      <main
        id="products-grid"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 space-y-6 w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EED4A8] pb-4">
          <div>
            <span className="text-xs font-bold text-[#92400E] uppercase tracking-wider bg-[#FEF3C7] px-3 py-1 rounded-full border border-[#FDE68A]">
              {activeCategory === 'all' ? t.catAll : activeCategory}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#451A03] mt-2">
              {t.selectWeightTitle}
            </h2>
          </div>
          <p className="text-xs text-[#92400E] font-medium">
            {t.showingItems} ({filteredProducts.length})
          </p>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-80 bg-[#FEF3C7]/40 rounded-2xl animate-pulse border border-[#EED4A8]"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center bg-[#FFFDF9] rounded-2xl border border-[#EED4A8] space-y-3">
            <ShoppingBag className="w-10 h-10 text-[#D97706] mx-auto" />
            <h3 className="font-serif font-bold text-lg text-[#451A03]">{t.noMatchTitle}</h3>
            <p className="text-xs text-[#92400E]">{t.noMatchDesc}</p>
            {(activeCategory !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-xs rounded-xl transition-colors"
              >
                {t.resetFilters}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onOpenDetails={(p) => setSelectedProductForDetail(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Customer Reviews Section */}
      <ReviewsSection />

      {/* Bulk & Wholesale Catering Inquiry Section */}
      <BulkOrderSection />

      {/* Footer */}
      <Footer
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenBulkOrder={() => {
          const bulkEl = document.getElementById('bulk-orders');
          if (bulkEl) bulkEl.scrollIntoView({ behavior: 'smooth' });
        }}
        onToggleAdmin={handleToggleAdminView}
      />

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderConfirmationModal
        order={placedOrderForModal}
        onClose={() => setPlacedOrderForModal(null)}
      />

      <OrderTrackerModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
      />
    </div>
  );
}
