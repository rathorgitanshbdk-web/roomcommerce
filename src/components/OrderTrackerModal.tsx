import React, { useState } from 'react';
import { Order } from '../types';
import { X, Search, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { trackOrder } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const results = await trackOrder(query.trim());
      setOrders(results);
    } catch (err) {
      console.error('Error tracking order:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#FFFDF9] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-[#EED4A8] relative my-8">
        {/* Header */}
        <div className="p-4 bg-[#78350F] text-[#FEF3C7] flex items-center justify-between border-b border-[#92400E]">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="font-serif font-bold text-base">{t.trackOrderBtn}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#FEF3C7] hover:bg-[#92400E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="p-5 space-y-4 text-xs">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#D97706]" />
              <input
                type="text"
                required
                placeholder="Enter Phone Number or Order ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#FEFBF2] border border-[#EED4A8] rounded-xl text-[#451A03] font-medium focus:ring-2 focus:ring-amber-200 focus:outline-none text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Find Order'}
            </button>
          </form>

          {/* Results List */}
          {searched && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-[#92400E] font-medium">Searching for your order...</div>
              ) : !orders || orders.length === 0 ? (
                <div className="p-6 text-center bg-[#FEF3C7] rounded-xl border border-[#FDE68A] space-y-2">
                  <p className="font-bold text-[#451A03] text-sm">No Orders Found</p>
                  <p className="text-[#78350F]">
                    We could not find any orders matching &quot;{query}&quot;. Please verify your phone number or Order ID.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {orders.map((ord) => {
                    const isConfirmed = ord.status === 'confirmed' || ord.status === 'dispatched';
                    const isCancelled = ord.status === 'cancelled';

                    return (
                      <div
                        key={ord.id}
                        className="p-4 bg-white rounded-xl border border-[#EED4A8] shadow-xs space-y-3"
                      >
                        {/* Status Header Badge */}
                        <div className="flex items-center justify-between border-b border-[#EED4A8] pb-2">
                          <div className="font-mono font-bold text-xs text-[#78350F]">
                            {t.orderId}: #{ord.id}
                          </div>

                          {/* Status Badge */}
                          {isConfirmed ? (
                            <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {t.confirmedStatus}
                            </span>
                          ) : isCancelled ? (
                            <span className="px-2.5 py-1 text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                              Cancelled
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-[11px] font-bold bg-[#FEF3C7] text-[#78350F] border border-[#FDE68A] rounded-full flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#D97706] animate-spin" />
                              {t.unconfirmedStatus}
                            </span>
                          )}
                        </div>

                        {/* Customer & Address */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-[#92400E] font-medium block">Customer:</span>
                            <span className="font-bold text-[#451A03]">{ord.customerName} ({ord.phone})</span>
                          </div>
                          <div>
                            <span className="text-[#92400E] font-medium block">Order Date:</span>
                            <span className="font-bold text-[#451A03]">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="bg-[#FEFBF2] p-2.5 rounded-lg border border-[#EED4A8] space-y-1">
                          <span className="font-bold text-[#451A03] text-[11px] block">Items:</span>
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-[#78350F]">
                              <span>
                                {it.quantity}x {it.productName} ({it.optionLabel})
                                {it.flavor ? ` - ${it.flavor}` : ''}
                              </span>
                              <span className="font-bold">₹{it.totalPrice}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between font-serif font-bold text-xs text-[#451A03] pt-1">
                          <span>{t.totalPayable}:</span>
                          <span className="text-[#78350F] text-sm">₹{ord.totalAmount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

