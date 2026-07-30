import React, { useState, useEffect } from 'react';
import { Product, Order, BulkInquiry, OrderStatus } from '../types';
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
  Filter,
  DollarSign,
  TrendingUp,
  ArrowLeft,
  Truck,
  RefreshCw,
  UserCheck,
  Building,
  Database,
  Copy,
  Check,
  Server
} from 'lucide-react';
import {
  fetchProducts,
  deleteProduct,
  fetchOrders,
  updateOrderStatus,
  fetchBulkInquiries,
  updateBulkInquiryStatus,
  fetchStats
} from '../services/api';
import { AddProductModal } from './AddProductModal';

import { SUPABASE_SQL_SCHEMA } from '../lib/supabase';

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

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'bulk' | 'database'>('overview');

  const [supabaseInfo, setSupabaseInfo] = useState<{ configured: boolean; supabaseUrl: string | null; pingSuccess?: boolean; pingError?: string | null; sqlSchema: string }>({
    configured: false,
    supabaseUrl: ((import.meta as any).env?.VITE_SUPABASE_URL as string) || null,
    sqlSchema: SUPABASE_SQL_SCHEMA
  });
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Manual Supabase Connect State
  const [manualUrl, setManualUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectMsg, setConnectMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stats state
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalBulkInquiries: 0,
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);

  // Bulk inquiries state
  const [bulkInquiries, setBulkInquiries] = useState<BulkInquiry[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string>('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes, bulkRes] = await Promise.all([
        fetchStats(),
        fetchOrders(),
        fetchProducts(),
        fetchBulkInquiries(),
      ]);

      setStats(statsRes);
      setOrders(ordersRes);
      setProducts(productsRes);
      setBulkInquiries(bulkRes);

      try {
        const supRes = await fetch('/api/supabase/status');
        if (supRes.ok) {
          const supData = await supRes.json();
          setSupabaseInfo({
            configured: Boolean(supData.configured),
            supabaseUrl: supData.supabaseUrl || ((import.meta as any).env?.VITE_SUPABASE_URL as string) || null,
            pingSuccess: supData.pingSuccess,
            pingError: supData.pingError,
            sqlSchema: supData.sqlSchema || SUPABASE_SQL_SCHEMA
          });
        }
      } catch (e) {
        console.error('Failed to load Supabase status:', e);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl || !manualKey) {
      setConnectMsg({ type: 'error', text: 'Please enter both Supabase URL and Key.' });
      return;
    }

    setConnectLoading(true);
    setConnectMsg(null);

    try {
      const res = await fetch('/api/supabase/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseUrl: manualUrl, supabaseKey: manualKey }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConnectMsg({
          type: data.pingSuccess ? 'success' : 'error',
          text: data.message
        });
        setSupabaseInfo({
          configured: Boolean(data.configured),
          supabaseUrl: data.supabaseUrl,
          pingSuccess: data.pingSuccess,
          pingError: data.pingError,
          sqlSchema: SUPABASE_SQL_SCHEMA
        });
        loadAllData();
      } else {
        setConnectMsg({ type: 'error', text: data.error || 'Failed to connect' });
      }
    } catch (err: any) {
      setConnectMsg({ type: 'error', text: err.message || 'Connection request failed' });
    } finally {
      setConnectLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'confirmed');
      showNotification(`Order #${orderId} CONFIRMED! Customer status updated to Green Checkmark.`);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'cancelled');
      showNotification(`Order #${orderId} marked as Cancelled.`);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispatchOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'dispatched');
      showNotification(`Order #${orderId} marked as Dispatched.`);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) return;
    try {
      await deleteProduct(productId);
      showNotification(`Deleted product "${name}".`);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBulkStatus = async (inquiryId: string, status: string) => {
    try {
      await updateBulkInquiryStatus(inquiryId, status);
      showNotification(`Bulk Inquiry #${inquiryId} updated.`);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 3500);
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
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

  // Filtered products
  const filteredProducts = products.filter(
    (p) =>
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.gujaratiName && p.gujaratiName.toLowerCase().includes(productSearch.toLowerCase())) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

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
              Default Credentials: <code className="text-cyan-400 font-bold">admin</code> / <code className="text-cyan-400 font-bold">admin</code>
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
            <button
              onClick={loadAllData}
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
                label: `Orders (${stats.pendingOrders > 0 ? `${stats.pendingOrders} Pending Action` : stats.totalOrders})`,
                icon: ShoppingBag,
                badge: stats.pendingOrders,
              },
              { id: 'products', label: `Inventory Products (${stats.totalProducts})`, icon: Package },
              { id: 'bulk', label: `Wholesale Inquiries (${stats.totalBulkInquiries})`, icon: PhoneCall },
              { id: 'database', label: 'Supabase Storage', icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all ${
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
                  <p className="text-xs text-slate-400 font-semibold uppercase">Pending Owner Confirmation</p>
                  <h3 className="text-2xl font-bold font-serif text-amber-400 mt-1">
                    {stats.pendingOrders}
                  </h3>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">Orders waiting for owner action</p>
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
                  <p className="text-[11px] text-emerald-300/80 mt-0.5">Across {stats.totalOrders} total orders</p>
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
                  <p className="text-[11px] text-cyan-300/80 mt-0.5">Khakhra, Hing & Farshan</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Package className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Bulk & Event Inquiries</p>
                  <h3 className="text-2xl font-bold font-serif text-purple-400 mt-1">
                    {stats.totalBulkInquiries}
                  </h3>
                  <p className="text-[11px] text-purple-300/80 mt-0.5">Weddings & Wholesale</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <PhoneCall className="w-6 h-6" />
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
                    Click &quot;Confirm Order&quot; below to approve the customer&apos;s request. This flips their status from Yellow Circle to Green Confirmed Checkmark.
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
                            {ord.items.map((i) => `${i.quantity}x ${i.productName} (${i.optionLabel})`).join(', ')}
                          </div>
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

                        {/* Status Label */}
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
                              <XCircle className="w-3.5 h-3.5" /> Cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Customer Details & Items */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          <p className="font-bold text-slate-200">Customer Details:</p>
                          <p className="text-white font-serif text-sm font-bold">{ord.customerName}</p>
                          <p className="text-slate-300 font-mono">📱 {ord.phone}</p>
                          {ord.email && <p className="text-slate-400">✉️ {ord.email}</p>}
                        </div>

                        <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          <p className="font-bold text-slate-200">Shipping Address:</p>
                          <p className="text-slate-300 leading-relaxed">{ord.address}</p>
                          <p className="text-slate-400">{ord.city}, Pincode: {ord.pincode}</p>
                          {ord.notes && <p className="text-amber-400 italic">Note: {ord.notes}</p>}
                        </div>

                        <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          <p className="font-bold text-slate-200">Items Breakdown:</p>
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-[11px]">
                              <span>
                                {it.quantity}x {it.productName} ({it.optionLabel})
                              </span>
                              <span className="font-bold text-slate-200">₹{it.totalPrice}</span>
                            </div>
                          ))}
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
                            Cancel Order
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

        {/* TAB 3: PRODUCTS INVENTORY */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
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
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative"
                >
                  <div className="flex gap-3">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-20 h-20 object-cover rounded-xl bg-slate-950 border border-slate-800 shrink-0"
                    />

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {prod.category}
                      </span>
                      <h4 className="font-serif font-bold text-white text-sm line-clamp-1">{prod.name}</h4>
                      {prod.gujaratiName && (
                        <p className="text-xs text-slate-400 font-serif">{prod.gujaratiName}</p>
                      )}
                      <p className="text-[11px] text-slate-400 line-clamp-2">{prod.description}</p>
                    </div>
                  </div>

                  {/* Options & Price List */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                    <span className="font-bold text-slate-300 text-[11px] block">
                      Options ({prod.saleType === 'weight' ? 'Weight' : 'Packets'}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {prod.options.map((opt) => (
                        <span
                          key={opt.id}
                          className="px-2 py-0.5 bg-slate-900 text-slate-200 text-[10px] rounded border border-slate-800 font-medium"
                        >
                          {opt.label}: <strong className="text-cyan-400">₹{opt.price}</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span
                      className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                        prod.inStock ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                      }`}
                    >
                      {prod.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingProduct(prod);
                          setIsAddProductOpen(true);
                        }}
                        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
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
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BULK INQUIRIES */}
        {activeTab === 'bulk' && (
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-white">Wholesale & Wedding Catering Requests</h3>

            {bulkInquiries.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
                No wholesale inquiries submitted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {bulkInquiries.map((inq) => (
                  <div key={inq.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-purple-400">#{inq.id}</span>
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
                        <span className="text-slate-400 block font-semibold">Products Interested:</span>
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

        {/* 5. SUPABASE DATABASE TAB */}
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
                      Store customer details, orders, products, reviews, and wholesale inquiries in a production PostgreSQL database.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    supabaseInfo?.configured 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    <Server className="w-3.5 h-3.5" />
                    {supabaseInfo?.configured ? 'Connected to Supabase' : 'Waiting for Credentials'}
                  </span>
                </div>
              </div>

              {/* Status & Diagnostics Banner */}
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
                      ✅ <b>Database Table Ping Succeeded!</b> Your Supabase database is active, and tables are responding.
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-950/80 border border-amber-800/60 rounded-lg text-amber-200 text-xs space-y-1">
                      <div className="font-bold text-amber-300">⚠️ Table Ping Warning:</div>
                      <p>{supabaseInfo.pingError || 'Could not query "products" table.'}</p>
                      <p className="text-[11px] text-amber-300/80">
                        <b>Fix:</b> Please copy the SQL Script below and run it in your <b>Supabase SQL Editor</b> tab to create the required tables.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs space-y-2 text-amber-200">
                  <div className="font-bold text-amber-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Supabase Credentials Not Yet Active
                  </div>
                  <p className="text-slate-300">
                    Enter your Supabase Project URL and API Key in the form below to connect directly, or configure Environment Variables in AI Studio Settings.
                  </p>
                </div>
              )}

              {/* Direct Connect Form */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Server className="w-4 h-4 text-cyan-400" />
                      Option A: Connect Supabase Directly (Instant Setup)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Paste your Project URL & Key here to connect immediately without waiting for environment re-deployments.
                    </p>
                  </div>
                </div>

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
                    <div className={`p-3 rounded-lg border text-xs ${
                      connectMsg.type === 'success' 
                        ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' 
                        : 'bg-rose-950/80 border-rose-800 text-rose-200'
                    }`}>
                      {connectMsg.text}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={connectLoading}
                      className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition-all"
                    >
                      {connectLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Connecting & Verifying...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Connect & Verify Supabase Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Troubleshooting Breakdown */}
              <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3 text-xs">
                <h3 className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Option B: Environment Variables Breakdown & Troubleshooting
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 leading-relaxed">
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1.5">
                    <div className="font-bold text-cyan-300">1. Environment Target Selection in Settings</div>
                    <p className="text-[11px] text-slate-400">
                      In the AI Studio Settings Environment Variables tab, check the <b>Environments</b> dropdown. You MUST check <b>Development</b> in addition to Production & Preview. If <i>Development</i> is unchecked, the active live preview container won't receive the variables.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1.5">
                    <div className="font-bold text-cyan-300">2. Supabase SQL Schema Table Creation</div>
                    <p className="text-[11px] text-slate-400">
                      Supabase requires tables to exist before accepting reads/writes. If the URL and Key are set but tables haven't been created, queries will fail. Copy the SQL script below and paste it into your <b>Supabase SQL Editor</b>.
                    </p>
                  </div>
                </div>
              </div>

              {/* SQL Schema Copy Block */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-200 flex items-center gap-2">
                    <span>Database Tables DDL Script (run in Supabase SQL Editor)</span>
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
          showNotification('Product saved successfully to store catalog!');
          loadAllData();
        }}
      />
    </div>
  );
};
