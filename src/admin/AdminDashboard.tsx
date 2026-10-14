import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Order, BulkInquiry, OrderStatus, Coupon, DiscountType } from '../types';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  PhoneCall,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  DollarSign,
  ArrowLeft,
  Truck,
  RefreshCw,
  Database,
  Copy,
  Check,
  Server,
  Ticket,
  Sparkles,
  Flame,
  RotateCcw,
} from 'lucide-react';
import {
  fetchProducts,
  deleteProduct,
  fetchOrders,
  updateOrderStatus,
  fetchBulkInquiries,
  updateBulkInquiryStatus,
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  calculateStatsFromData,
  calculateProductOfferPricing,
  subscribeToStoreChanges,
  FALLBACK_IMAGES,
} from '../services/api';
import { AddProductModal } from './AddProductModal';
import {
  SUPABASE_SQL_SCHEMA,
  getSupabase,
  getSupabaseCredentials,
  setCustomSupabaseCredentials,
} from '../lib/supabase';

interface AdminDashboardProps {
  onBackToShop: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToShop }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('giriraj_admin_authed') === 'true';
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'products' | 'coupons' | 'bulk' | 'database'
  >('overview');

  const [supabaseInfo, setSupabaseInfo] = useState<{
    configured: boolean;
    supabaseUrl: string | null;
    pingSuccess?: boolean;
    pingError?: string | null;
    sqlSchema: string;
  }>({
    configured: false,
    supabaseUrl: ((import.meta as any).env?.VITE_SUPABASE_URL as string) || null,
    sqlSchema: SUPABASE_SQL_SCHEMA,
  });
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Manual Supabase Connect State
  const [manualUrl, setManualUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectMsg, setConnectMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);

  // Coupons state & Creator Form
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<DiscountType>('flat');
  const [newCouponValue, setNewCouponValue] = useState<number>(100);
  const [newCouponMinCart, setNewCouponMinCart] = useState<number>(499);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<number>(20);
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  // Bulk inquiries state
  const [bulkInquiries, setBulkInquiries] = useState<BulkInquiry[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string>('');

  // Compute live overview stats in memory
  const stats = useMemo(
    () => calculateStatsFromData(orders, products, bulkInquiries),
    [orders, products, bulkInquiries]
  );

  const loadAllData = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const [ordersRes, productsRes, bulkRes, couponsRes] = await Promise.all([
        fetchOrders(),
        fetchProducts(),
        fetchBulkInquiries(),
        fetchCoupons(),
      ]);

      setOrders(ordersRes);
      setProducts(productsRes);
      setBulkInquiries(bulkRes);
      setCoupons(couponsRes);

      const client = getSupabase();
      const creds = getSupabaseCredentials();
      if (client) {
        try {
          const { error } = await client.from('products').select('id').limit(1);
          setSupabaseInfo({
            configured: true,
            supabaseUrl: creds?.url || null,
            pingSuccess: !error,
            pingError: error ? error.message : null,
            sqlSchema: SUPABASE_SQL_SCHEMA,
          });
        } catch (e: any) {
          setSupabaseInfo({
            configured: true,
            supabaseUrl: creds?.url || null,
            pingSuccess: false,
            pingError: e?.message || 'Connection ping failed',
            sqlSchema: SUPABASE_SQL_SCHEMA,
          });
        }
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData(false);

    const unsubscribe = subscribeToStoreChanges({
      onOrdersChange: () => {
        fetchOrders().then(setOrders).catch(console.error);
        fetchProducts().then(setProducts).catch(console.error);
        fetchCoupons().then(setCoupons).catch(console.error);
      },
      onProductsChange: () => {
        fetchProducts().then(setProducts).catch(console.error);
      },
      onInquiriesChange: () => {
        fetchBulkInquiries().then(setBulkInquiries).catch(console.error);
      },
      onCouponsChange: () => {
        fetchCoupons().then(setCoupons).catch(console.error);
      },
    });

    return () => unsubscribe();
  }, [loadAllData]);

  const handleDirectConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl || !manualKey) {
      setConnectMsg({ type: 'error', text: 'Please enter both Supabase URL and Key.' });
      return;
    }

    setConnectLoading(true);
    setConnectMsg(null);

    let cleanUrl = String(manualUrl).trim().replace(/^["']|["']$/g, '');
    const cleanKey = String(manualKey).trim().replace(/^["']|["']$/g, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    setCustomSupabaseCredentials(cleanUrl, cleanKey);

    try {
      await fetch('/api/supabase/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseUrl: cleanUrl, supabaseKey: cleanKey }),
      });
    } catch {
      // Static/direct client mode
    }

    try {
      const client = getSupabase();
      if (client) {
        const { error } = await client.from('products').select('id').limit(1);
        if (error) {
          setConnectMsg({
            type: 'error',
            text: `Connected to Supabase, but test query returned: ${error.message}. Make sure SQL schema is executed in Supabase SQL editor.`,
          });
          setSupabaseInfo({
            configured: true,
            supabaseUrl: cleanUrl,
            pingSuccess: false,
            pingError: error.message,
            sqlSchema: SUPABASE_SQL_SCHEMA,
          });
        } else {
          setConnectMsg({
            type: 'success',
            text: 'Successfully connected and verified Supabase database!',
          });
          setSupabaseInfo({
            configured: true,
            supabaseUrl: cleanUrl,
            pingSuccess: true,
            pingError: null,
            sqlSchema: SUPABASE_SQL_SCHEMA,
          });
          loadAllData(false);
        }
      }
    } catch (err: any) {
      setConnectMsg({ type: 'error', text: err.message || 'Connection request failed' });
    } finally {
      setConnectLoading(false);
    }
  };

  // Optimistic 0ms Order Status Transitions (Restores Stock & Offer Units on Cancel!)
  const handleOrderStatusTransition = async (
    orderId: string,
    newStatus: OrderStatus,
    notificationText: string
  ) => {
    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    showNotification(notificationText);

    try {
      await updateOrderStatus(orderId, newStatus);
      if (newStatus === 'cancelled') {
        const [freshProducts, freshCoupons] = await Promise.all([
          fetchProducts(),
          fetchCoupons(),
        ]);
        setProducts(freshProducts);
        setCoupons(freshCoupons);
      }
    } catch (err) {
      console.error(err);
      setOrders(previousOrders);
      showNotification(`Failed to update Order #${orderId}. Please try again.`);
    }
  };

  const handleConfirmOrder = (orderId: string) =>
    handleOrderStatusTransition(
      orderId,
      'confirmed',
      `Order #${orderId} CONFIRMED! Customer status updated to Green Checkmark.`
    );

  const handleCancelOrder = (orderId: string) =>
    handleOrderStatusTransition(
      orderId,
      'cancelled',
      `Order #${orderId} Cancelled! Product stock, offer units & coupon uses restored.`
    );

  const handleDispatchOrder = (orderId: string) =>
    handleOrderStatusTransition(orderId, 'dispatched', `Order #${orderId} marked as Dispatched.`);

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) return;
    const previousProducts = [...products];
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showNotification(`Deleted product "${name}".`);

    try {
      await deleteProduct(productId);
    } catch (err) {
      console.error(err);
      setProducts(previousProducts);
    }
  };

  const handleUpdateBulkStatus = async (inquiryId: string, status: any) => {
    const previousInquiries = [...bulkInquiries];
    setBulkInquiries((prev) =>
      prev.map((inq) => (inq.id === inquiryId ? { ...inq, status } : inq))
    );
    showNotification(`Bulk Inquiry #${inquiryId} updated.`);

    try {
      await updateBulkInquiryStatus(inquiryId, status);
    } catch (err) {
      console.error(err);
      setBulkInquiries(previousInquiries);
    }
  };

  // Coupon Management Handlers
  const handleAutoGenerateCode = () => {
    const prefixes = ['GIRIRAJ', 'SWAGATAM', 'FARSHAN', 'ROYAL', 'FESTIVE'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(10 + Math.random() * 90);
    setNewCouponCode(`${prefix}${newCouponValue || suffix}`);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCouponCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      showNotification('Please enter or generate a Coupon Code.');
      return;
    }

    setCreatingCoupon(true);
    try {
      const created = await createCoupon({
        code: cleanCode,
        discountType: newCouponType,
        discountValue: Math.max(1, Number(newCouponValue) || 50),
        minCartValue: Math.max(0, Number(newCouponMinCart) || 0),
        maxUses: Math.max(1, Number(newCouponMaxUses) || 10),
        usedCount: 0,
        isActive: true,
      });
      setCoupons((prev) => [
        created,
        ...prev.filter((c) => c.id !== created.id && c.code !== created.code),
      ]);
      setNewCouponCode('');
      showNotification(
        `Coupon "${created.code}" created! Valid for first ${created.maxUses} customers.`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleToggleCouponActive = async (coupon: Coupon) => {
    const nextState = !coupon.isActive;
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isActive: nextState } : c))
    );
    showNotification(
      `Coupon "${coupon.code}" ${nextState ? 'activated' : 'paused'}.`
    );
    await updateCoupon(coupon.id, { isActive: nextState });
  };

  const handleResetCouponUses = async (coupon: Coupon) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, usedCount: 0 } : c))
    );
    showNotification(`Reset usage count for coupon "${coupon.code}" to 0/${coupon.maxUses}.`);
    await updateCoupon(coupon.id, { usedCount: 0 });
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!window.confirm(`Delete coupon code "${coupon.code}"?`)) return;
    setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
    showNotification(`Deleted coupon "${coupon.code}".`);
    await deleteCoupon(coupon.id);
  };

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 3500);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesFilter =
        orderFilter === 'all'
          ? true
          : orderFilter === 'pending'
          ? o.status === 'pending_confirmation'
          : o.status === orderFilter;

      const query = orderSearch.toLowerCase();
      const matchesSearch =
        !query ||
        o.id.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.phone.includes(query) ||
        o.city.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [orders, orderFilter, orderSearch]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        !productSearch ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.gujaratiName && p.gujaratiName.toLowerCase().includes(productSearch.toLowerCase())) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim() === 'admin' && passwordInput.trim() === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('giriraj_admin_authed', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid credentials! Username: admin, Password: admin');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('giriraj_admin_authed');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          <button
            onClick={onBackToShop}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Storefront
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-cyan-950 border border-cyan-700/50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-cyan-400">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h2 className="font-serif font-bold text-xl text-white">Giriraj Admin Portal</h2>
            <p className="text-xs text-slate-400 mt-1">Enter store manager credentials to log in</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="Enter username (admin)"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="Enter password (admin)"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none font-medium"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                Sign In to Admin Panel
              </button>
            </div>

            <div className="text-center pt-2 text-[11px] text-slate-500">
              Default Credentials: <code className="text-cyan-400 font-bold">admin</code> /{' '}
              <code className="text-cyan-400 font-bold">admin</code>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToShop}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Storefront</span>
            </button>
            <div className="h-5 w-px bg-slate-800 hidden sm:block" />
            <div>
              <h1 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-cyan-400" />
                Giriraj Admin Management (એડમિન કંટ્રોલ)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync
            </span>

            <button
              onClick={() => loadAllData(false)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800/50 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Logout from Admin"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="bg-slate-900/80 border-t border-slate-800/80 px-4">
          <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto no-scrollbar text-xs font-bold">
            {[
              { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
              {
                id: 'orders',
                label: `Orders (${
                  stats.pendingOrders > 0 ? `${stats.pendingOrders} Pending Action` : stats.totalOrders
                })`,
                icon: ShoppingBag,
                badge: stats.pendingOrders,
              },
              {
                id: 'products',
                label: `Inventory & Offers (${stats.totalProducts})`,
                icon: Package,
              },
              {
                id: 'coupons',
                label: `Coupons (${coupons.length})`,
                icon: Ticket,
              },
              {
                id: 'bulk',
                label: `Wholesale Inquiries (${stats.totalBulkInquiries})`,
                icon: PhoneCall,
              },
              { id: 'database', label: 'Supabase Storage', icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-cyan-400 text-cyan-400 bg-slate-800/50'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 text-[10px] rounded-full animate-pulse font-extrabold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {actionMessage && (
          <div className="p-3 bg-cyan-950 border border-cyan-500/50 text-cyan-200 rounded-xl text-xs font-bold shadow-lg animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            {actionMessage}
          </div>
        )}

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    Pending Owner Confirmation
                  </p>
                  <h3 className="text-2xl font-bold font-serif text-amber-400 mt-1">
                    {stats.pendingOrders}
                  </h3>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Orders waiting for owner action
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Total Revenue Value</p>
                  <h3 className="text-2xl font-bold font-serif text-emerald-400 mt-1">
                    ₹{stats.totalRevenue}
                  </h3>
                  <p className="text-[11px] text-emerald-300/80 mt-0.5">
                    Across {stats.totalOrders} total orders
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Active Products</p>
                  <h3 className="text-2xl font-bold font-serif text-cyan-400 mt-1">
                    {stats.totalProducts}
                  </h3>
                  <p className="text-[11px] text-cyan-300/80 mt-0.5">
                    {products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0)} total units in stock
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Package className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    Active Promo Coupons
                  </p>
                  <h3 className="text-2xl font-bold font-serif text-purple-400 mt-1">
                    {coupons.filter((c) => c.isActive && c.usedCount < c.maxUses).length}
                  </h3>
                  <p className="text-[11px] text-purple-300/80 mt-0.5">
                    {coupons.reduce((acc, c) => acc + c.usedCount, 0)} total coupon redemptions
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Ticket className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Action Queue for Pending Orders */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Pending Owner Confirmations Queue
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click &quot;Confirm Order&quot; below to approve the customer&apos;s request.
                    Cancelling an order automatically restores stock, offer units, and coupon uses.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  View All Orders →
                </button>
              </div>

              {orders.filter((o) => o.status === 'pending_confirmation').length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                  <p className="font-bold text-slate-200">No Pending Orders</p>
                  <p className="text-xs">All customer orders have been reviewed and confirmed!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders
                    .filter((o) => o.status === 'pending_confirmation')
                    .map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2 font-mono font-bold text-amber-300">
                            <span>#{ord.id}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-white font-serif">{ord.customerName}</span>
                            <span className="text-slate-400">({ord.phone})</span>
                          </div>
                          <div className="text-slate-300">
                            <strong>Items ({ord.items.length}):</strong>{' '}
                            {ord.items
                              .map(
                                (i) =>
                                  `${i.quantity}x ${i.productName}${i.flavor ? ` (${i.flavor})` : ''}`
                              )
                              .join(', ')}
                          </div>
                          {ord.couponCode && (
                            <div className="text-emerald-400 font-bold">
                              🏷️ Coupon Applied: {ord.couponCode} (-₹{ord.couponDiscount})
                            </div>
                          )}
                          <div className="text-slate-400">
                            Address: {ord.address}, {ord.city} ({ord.pincode})
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-0 border-slate-800 pt-2 md:pt-0">
                          <span className="font-serif font-bold text-lg text-emerald-400">
                            ₹{ord.totalAmount}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleConfirmOrder(ord.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Confirm Order (કન્ફર્મ કરો)
                            </button>

                            <button
                              onClick={() => handleCancelOrder(ord.id)}
                              className="px-3 py-2 bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-300 font-bold text-xs rounded-xl transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar text-xs font-bold">
                {[
                  { id: 'all', label: 'All Orders' },
                  { id: 'pending', label: 'Pending Confirmation ⏳' },
                  { id: 'confirmed', label: 'Confirmed ✅' },
                  { id: 'dispatched', label: 'Dispatched 🚚' },
                  { id: 'cancelled', label: 'Cancelled ❌' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                      orderFilter === f.id
                        ? 'bg-cyan-600 border-cyan-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ID, name, phone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
                No orders match your current filter query.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((ord) => {
                  const isPending = ord.status === 'pending_confirmation';
                  const isConfirmed = ord.status === 'confirmed';
                  const isDispatched = ord.status === 'dispatched';
                  const isCancelled = ord.status === 'cancelled';

                  return (
                    <div
                      key={ord.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm text-cyan-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                            #{ord.id}
                          </span>
                          <span className="text-xs text-slate-400">
                            Placed on {new Date(ord.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div>
                          {isPending && (
                            <span className="px-3 py-1 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full flex items-center gap-1.5 animate-pulse">
                              <Clock className="w-3.5 h-3.5" /> Owner Has Not Confirmed Yet
                            </span>
                          )}
                          {isConfirmed && (
                            <span className="px-3 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Order Confirmed by Owner
                            </span>
                          )}
                          {isDispatched && (
                            <span className="px-3 py-1 text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-full flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5" /> Dispatched
                            </span>
                          )}
                          {isCancelled && (
                            <span className="px-3 py-1 text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 rounded-full flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5" /> Cancelled (Stock Restored)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Customer Details & Items */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          <p className="font-bold text-slate-200">Customer Details:</p>
                          <p className="text-white font-serif text-sm font-bold">
                            {ord.customerName}
                          </p>
                          <p className="text-slate-300 font-mono">📱 {ord.phone}</p>
                          {ord.email && <p className="text-slate-400">✉️ {ord.email}</p>}
                        </div>

                        <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          <p className="font-bold text-slate-200">Shipping Address:</p>
                          <p className="text-slate-300 leading-relaxed">{ord.address}</p>
                          <p className="text-slate-400">
                            {ord.city}, Pincode: {ord.pincode}
                          </p>
                          {ord.notes && (
                            <p className="text-amber-400 italic">Note: {ord.notes}</p>
                          )}
                        </div>

                        <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          <p className="font-bold text-slate-200">Items Breakdown:</p>
                          {ord.items.map((it, idx) => {
                            const isPartial =
                              (it.offerUnitsApplied || 0) > 0 &&
                              (it.regularUnitsApplied || 0) > 0;
                            return (
                              <div key={idx} className="space-y-0.5">
                                <div className="flex justify-between text-[11px]">
                                  <span>
                                    {it.quantity}x {it.productName}
                                    {it.flavor ? ` (${it.flavor})` : ''}
                                  </span>
                                  <span className="font-bold text-slate-200">₹{it.totalPrice}</span>
                                </div>
                                {isPartial ? (
                                  <div className="text-[10px] text-amber-400">
                                    ↳ {it.offerUnitsApplied} @ ₹{it.offerUnitPrice} (Offer) +{' '}
                                    {it.regularUnitsApplied} @ ₹{it.unitPrice} (Reg)
                                  </div>
                                ) : (it.offerUnitsApplied || 0) > 0 ? (
                                  <div className="text-[10px] text-emerald-400">
                                    ↳ {it.offerUnitsApplied} unit(s) @ Offer ₹{it.offerUnitPrice}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                          {ord.couponCode && (ord.couponDiscount || 0) > 0 && (
                            <div className="flex justify-between text-[11px] text-emerald-400 font-bold">
                              <span>Coupon ({ord.couponCode}):</span>
                              <span>-₹{ord.couponDiscount}</span>
                            </div>
                          )}
                          {ord.deliveryFee > 0 && (
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>Delivery Fee:</span>
                              <span>₹{ord.deliveryFee}</span>
                            </div>
                          )}
                          <div className="pt-1 border-t border-slate-800 flex justify-between font-bold text-sm text-emerald-400">
                            <span>Total Payable:</span>
                            <span>₹{ord.totalAmount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons for Admin */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        {isPending && (
                          <button
                            onClick={() => handleConfirmOrder(ord.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Confirm Order (ઓર્ડર મંજૂર કરો)
                          </button>
                        )}

                        {isConfirmed && (
                          <button
                            onClick={() => handleDispatchOrder(ord.id)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                          >
                            <Truck className="w-4 h-4" /> Mark Dispatched
                          </button>
                        )}

                        {!isCancelled && (
                          <button
                            onClick={() => handleCancelOrder(ord.id)}
                            className="px-3 py-2 bg-slate-800 hover:bg-red-950/80 text-slate-300 hover:text-red-300 font-bold text-xs rounded-xl transition-all"
                          >
                            Cancel Order & Restore Stock
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRODUCTS INVENTORY & LIMITED-UNIT OFFERS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search inventory products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddProductOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Product Card (નવી પ્રોડક્ટ)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((prod) => {
                const pricing = calculateProductOfferPricing(prod, 1);
                const hasOfferConfig = Boolean(prod.offer?.active);
                const offerCompleted =
                  hasOfferConfig &&
                  prod.offer &&
                  prod.offer.unitsSold >= prod.offer.unitLimit;

                return (
                  <div
                    key={prod.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative"
                  >
                    <div className="flex gap-3">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback =
                            FALLBACK_IMAGES[prod.category] || FALLBACK_IMAGES.default;
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                        className="w-20 h-20 object-cover rounded-xl bg-slate-950 border border-slate-800 shrink-0"
                      />

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                            {prod.category}
                          </span>
                          <span className="font-serif font-bold text-sm text-emerald-400">
                            {pricing.hasActiveOffer ? (
                              <>
                                <span className="text-xs text-slate-500 line-through mr-1">
                                  ₹{prod.price}
                                </span>
                                ₹{pricing.offerUnitPrice}
                              </>
                            ) : (
                              `₹${prod.price}`
                            )}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-white text-sm line-clamp-1">
                          {prod.name}
                        </h4>
                        {prod.gujaratiName && (
                          <p className="text-xs text-slate-400 font-serif">{prod.gujaratiName}</p>
                        )}
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {prod.description}
                        </p>
                      </div>
                    </div>

                    {/* Stock & Limited-Unit Offer Status Box */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Stock Quantity:</span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded ${
                            prod.stockQuantity > 10
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : prod.stockQuantity > 0
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-red-950 text-red-300 border border-red-800'
                          }`}
                        >
                          {prod.stockQuantity} units in stock
                        </span>
                      </div>

                      {hasOfferConfig && prod.offer ? (
                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-400 flex items-center gap-1 text-[11px]">
                              <Flame className="w-3.5 h-3.5" />
                              {prod.offer.discountType === 'percentage'
                                ? `${prod.offer.discountValue}% OFF`
                                : `₹${prod.offer.discountValue} OFF`}{' '}
                              (First {prod.offer.unitLimit} units)
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                offerCompleted
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {offerCompleted
                                ? 'Offer Completed'
                                : `${pricing.remainingOfferUnits} left`}
                            </span>
                          </div>

                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full transition-all ${
                                offerCompleted ? 'bg-rose-500' : 'bg-amber-400'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (prod.offer.unitsSold / Math.max(1, prod.offer.unitLimit)) * 100
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>
                              Claimed: <strong>{prod.offer.unitsSold}</strong> /{' '}
                              {prod.offer.unitLimit} units
                            </span>
                            <span>
                              Badge:{' '}
                              <strong className="text-cyan-300">
                                {prod.offer.badgeMode === 'claimed'
                                  ? `${prod.offer.unitsSold}/${prod.offer.unitLimit} claimed`
                                  : `${pricing.remainingOfferUnits} units left`}
                              </strong>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
                          <span>No active limited-unit offer</span>
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setIsAddProductOpen(true);
                            }}
                            className="text-amber-400 hover:underline font-semibold"
                          >
                            + Add Offer
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <span
                        className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                          prod.inStock && prod.stockQuantity > 0
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-red-950 text-red-400'
                        }`}
                      >
                        {prod.inStock && prod.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingProduct(prod);
                            setIsAddProductOpen(true);
                          }}
                          className="px-2.5 py-1.5 text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                          title="Edit Product, Stock & Offer"
                        >
                          <Edit className="w-3.5 h-3.5 text-cyan-400" /> Edit Stock / Offer
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: COUPONS & PROMO CODES GENERATOR */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            {/* Create / Generate Coupon Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-cyan-400" />
                    Generate Customer Coupon Code
                  </h3>
                  <p className="text-xs text-slate-400">
                    Create promo codes with Flat ₹ Off or % Cart Discount, Minimum Cart Value, and
                    First N Customers limit (e.g., First 10 or 20 orders).
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Coupon Code Input + Auto-Generate */}
                  <div className="lg:col-span-1 space-y-1">
                    <label className="block font-bold text-slate-200">Coupon Code *</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        placeholder="e.g. FIRST20"
                        value={newCouponCode}
                        onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 font-mono font-bold uppercase focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAutoGenerateCode}
                        className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700 shrink-0 flex items-center gap-1 font-bold text-[11px]"
                        title="Auto-Generate Random Code"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Gen
                      </button>
                    </div>
                  </div>

                  {/* Discount Type */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-200">Discount Type *</label>
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value as DiscountType)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="flat">Flat Rupees Off (₹)</option>
                      <option value="percentage">Percentage Off Cart (%)</option>
                    </select>
                  </div>

                  {/* Discount Value */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-200">
                      {newCouponType === 'flat' ? 'Flat Off Amount (₹) *' : 'Discount (%) *'}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={newCouponType === 'percentage' ? 95 : 10000}
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-emerald-300 font-bold focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Minimum Cart Value */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-200">
                      Minimum Cart Value (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="e.g. 499"
                      value={newCouponMinCart}
                      onChange={(e) => setNewCouponMinCart(Math.max(0, Number(e.target.value)))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-bold focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                    <div className="flex gap-1">
                      {[0, 299, 499, 999].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setNewCouponMinCart(v)}
                          className={`px-1.5 py-0.5 text-[10px] rounded border ${
                            newCouponMinCart === v
                              ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {v === 0 ? 'No Min' : `₹${v}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Usage Limit (First N Customers) */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-200">
                      Valid for First X Customers *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 10 or 20"
                      value={newCouponMaxUses}
                      onChange={(e) => setNewCouponMaxUses(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-purple-300 font-bold focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                    <div className="flex gap-1">
                      {[10, 20, 50, 100].map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setNewCouponMaxUses(u)}
                          className={`px-1.5 py-0.5 text-[10px] rounded border ${
                            newCouponMaxUses === u
                              ? 'bg-purple-600 text-white border-purple-500 font-bold'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          First {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={creatingCoupon}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {creatingCoupon ? 'Creating Coupon...' : 'Create & Activate Coupon Code'}
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Coupons List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((c) => {
                const isExhausted = c.usedCount >= c.maxUses;
                const remainingUses = Math.max(0, c.maxUses - c.usedCount);

                return (
                  <div
                    key={c.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-cyan-300 bg-slate-950 px-3 py-1 rounded-lg border border-cyan-800/60">
                          {c.code}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(c.code);
                            setCopiedCouponId(c.id);
                            setTimeout(() => setCopiedCouponId(null), 2000);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Copy Coupon Code"
                        >
                          {copiedCouponId === c.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          !c.isActive
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : isExhausted
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {!c.isActive
                          ? 'Paused'
                          : isExhausted
                          ? 'Limit Reached (Completed)'
                          : 'Active'}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Discount Benefit:</span>
                        <span className="font-bold text-emerald-400">
                          {c.discountType === 'flat'
                            ? `Flat ₹${c.discountValue} OFF`
                            : `${c.discountValue}% OFF Cart Value`}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">Minimum Cart Value:</span>
                        <span className="font-bold text-amber-300">
                          {c.minCartValue > 0 ? `₹${c.minCartValue}` : 'No Minimum (₹0)'}
                        </span>
                      </div>

                      <div className="pt-1 border-t border-slate-800 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">
                            Customer Limit (First {c.maxUses}):
                          </span>
                          <span className="font-bold text-cyan-300">
                            {c.usedCount} / {c.maxUses} claimed ({remainingUses} left)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all ${
                              isExhausted ? 'bg-rose-500' : 'bg-cyan-400'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                (c.usedCount / Math.max(1, c.maxUses)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleCouponActive(c)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-colors ${
                            c.isActive
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                              : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {c.isActive ? 'Pause' : 'Activate'}
                        </button>

                        {c.usedCount > 0 && (
                          <button
                            onClick={() => handleResetCouponUses(c)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-bold flex items-center gap-1"
                            title="Reset used count to 0"
                          >
                            <RotateCcw className="w-3 h-3" /> Reset 0/{c.maxUses}
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteCoupon(c)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg transition-colors"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: BULK INQUIRIES */}
        {activeTab === 'bulk' && (
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-white">
              Wholesale & Wedding Catering Requests
            </h3>

            {bulkInquiries.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
                No wholesale inquiries submitted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {bulkInquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-purple-400">
                          #{inq.id}
                        </span>
                        <span className="font-serif font-bold text-white text-sm">{inq.name}</span>
                        <span className="text-slate-400 text-xs">📱 {inq.phone}</span>
                      </div>

                      <select
                        value={inq.status}
                        onChange={(e) => handleUpdateBulkStatus(inq.id, e.target.value)}
                        className="p-1 text-xs bg-slate-950 border border-slate-700 rounded text-slate-200"
                      >
                        <option value="new">New Inquiry</option>
                        <option value="contacted">Contacted</option>
                        <option value="quoted">Quoted</option>
                        <option value="closed">Completed / Closed</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold">Event / Business:</span>
                        <span className="text-slate-200">{inq.businessOrEvent}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Quantity Needed:</span>
                        <span className="text-cyan-400 font-bold">{inq.expectedQuantity}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">
                          Products Interested:
                        </span>
                        <span className="text-slate-300">{inq.productsInterested.join(', ')}</span>
                      </div>
                    </div>

                    {inq.message && (
                      <div className="p-2.5 bg-slate-950 rounded-xl text-xs text-slate-300 italic border border-slate-800">
                        &quot;{inq.message}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SUPABASE DATABASE TAB */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-950/80 border border-emerald-700/50 rounded-xl flex items-center justify-center text-emerald-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                      Supabase Cloud Storage Integration
                    </h2>
                    <p className="text-xs text-slate-400">
                      Store customer details, orders, products, stock offers, coupons, reviews, and
                      wholesale inquiries in PostgreSQL.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      supabaseInfo?.configured
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5" />
                    {supabaseInfo?.configured ? 'Connected to Supabase' : 'Waiting for Credentials'}
                  </span>
                </div>
              </div>

              {supabaseInfo?.configured ? (
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-400 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Supabase Credentials Configured!
                    </span>
                    <span className="text-[11px] font-mono text-emerald-300/80 bg-emerald-900/60 px-2 py-0.5 rounded">
                      {supabaseInfo.supabaseUrl}
                    </span>
                  </div>

                  {supabaseInfo.pingSuccess ? (
                    <div className="p-2.5 bg-emerald-900/40 border border-emerald-700/50 rounded-lg text-emerald-200 text-xs">
                      ✅ <b>Database Table Ping Succeeded!</b> Your Supabase database is active, and
                      tables are responding.
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-950/80 border border-amber-800/60 rounded-lg text-amber-200 text-xs space-y-1">
                      <div className="font-bold text-amber-300">⚠️ Table Ping Warning:</div>
                      <p>{supabaseInfo.pingError || 'Could not query "products" table.'}</p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Direct Connect Form */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <form onSubmit={handleDirectConnect} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-slate-300 font-semibold">
                        Supabase Project URL:
                      </label>
                      <input
                        type="text"
                        placeholder="https://xyzproject.supabase.co"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-300 font-semibold">
                        Supabase Anon Key or Service Role Key:
                      </label>
                      <input
                        type="password"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                        value={manualKey}
                        onChange={(e) => setManualKey(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {connectMsg && (
                    <div
                      className={`p-3 rounded-lg border text-xs ${
                        connectMsg.type === 'success'
                          ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                          : 'bg-rose-950/80 border-rose-800 text-rose-200'
                      }`}
                    >
                      {connectMsg.text}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={connectLoading}
                      className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {connectLoading ? 'Connecting...' : 'Connect & Verify Supabase Now'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* SQL Schema Copy Block */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-200 flex items-center gap-2">
                    <span>
                      Database Tables, Coupons, Indexes, Realtime & RLS Script (run in Supabase SQL
                      Editor)
                    </span>
                  </h3>
                  <button
                    onClick={() => {
                      if (supabaseInfo?.sqlSchema) {
                        navigator.clipboard.writeText(supabaseInfo.sqlSchema);
                        setCopiedSchema(true);
                        setTimeout(() => setCopiedSchema(false), 2500);
                      }
                    }}
                    className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copiedSchema ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Copy SQL Script</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-80 scrollbar-thin">
                  {supabaseInfo?.sqlSchema || 'Loading schema...'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        editingProduct={editingProduct}
        onSuccess={() => {
          setIsAddProductOpen(false);
          showNotification('Product, stock & offer saved successfully!');
          loadAllData(true);
        }}
      />
    </div>
  );
};
