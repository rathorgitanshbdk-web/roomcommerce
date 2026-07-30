import React, { useState, useEffect } from 'react';
import { Product, CartItem, WeightPriceOption, Order } from './types';
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
import { fetchProducts } from './services/api';
import { ShoppingBag } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { t } = useLanguage();

  // Navigation / View State ('shop' or 'admin')

  const [currentView, setCurrentView] = useState<'shop' | 'admin'>(() => {
    return window.location.hash === '#admin' ? 'admin' : 'shop';
  });

  // Listen to hash changes in window location for URL differentiation (/ #admin)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('shop');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleToggleAdminView = (view: 'shop' | 'admin') => {
    setCurrentView(view);
    if (view === 'admin') {
      window.location.hash = '#admin';
    } else {
      window.location.hash = '';
    }
  };

  // Products & Filters State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart State (Persisted in localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('giriraj_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('giriraj_cart', JSON.stringify(cartItems));
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

  // Load products from API
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const list = await fetchProducts(activeCategory, searchQuery);
      setProducts(list);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [activeCategory, searchQuery]);

  // Cart Operations
  const handleAddToCart = (
    product: Product,
    option: WeightPriceOption,
    flavor: string | undefined,
    quantity: number
  ) => {
    const cartItemId = `${product.id}-${option.id}-${flavor || 'plain'}`;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          totalPrice: newQty * option.price,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          cartItemId,
          productId: product.id,
          productName: product.name,
          gujaratiName: product.gujaratiName,
          category: product.category,
          selectedOption: option,
          selectedFlavor: flavor,
          quantity,
          unitPrice: option.price,
          totalPrice: option.price * quantity,
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
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.unitPrice,
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
    setPlacedOrderForModal(createdOrder); // Opens Order Confirmation Modal with yellow circle clock status!
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
      <main id="products-grid" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 space-y-6">
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
            {t.showingItems} ({products.length})
          </p>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 bg-[#FEF3C7]/40 rounded-2xl animate-pulse border border-[#EED4A8]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center bg-[#FFFDF9] rounded-2xl border border-[#EED4A8] space-y-3">
            <ShoppingBag className="w-10 h-10 text-[#D97706] mx-auto" />
            <h3 className="font-serif font-bold text-lg text-[#451A03]">{t.noMatchTitle}</h3>
            <p className="text-xs text-[#92400E]">
              {t.noMatchDesc}
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-xs rounded-xl transition-colors"
            >
              {t.resetFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
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

      {/* Product Specification & Reviews Modal */}
      <ProductDetailModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Form Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Confirmation Modal with Yellow Circle Clock Status */}
      <OrderConfirmationModal
        order={placedOrderForModal}
        onClose={() => setPlacedOrderForModal(null)}
      />

      {/* Order Status Tracking Modal */}
      <OrderTrackerModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
      />
    </div>
  );
}
