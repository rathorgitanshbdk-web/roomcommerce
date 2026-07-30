import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { X, CheckCircle2, Clock, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { trackOrder } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({ order: initialOrder, onClose }) => {
  const { t } = useLanguage();

  if (!initialOrder) return null;

  const [currentOrder, setCurrentOrder] = useState<Order>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Poll server for live status updates every 4 seconds
  useEffect(() => {
    let interval: any;
    if (currentOrder && currentOrder.status === 'pending_confirmation') {
      interval = setInterval(async () => {
        try {
          const results = await trackOrder(currentOrder.id);
          if (results && results.length > 0) {
            setCurrentOrder(results[0]);
          }
        } catch (err) {
          console.error('Error polling order status:', err);
        }
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [currentOrder.id, currentOrder.status]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const results = await trackOrder(currentOrder.id);
      if (results && results.length > 0) {
        setCurrentOrder(results[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(currentOrder.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConfirmed = currentOrder.status === 'confirmed' || currentOrder.status === 'dispatched';
  const isCancelled = currentOrder.status === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#FFFDF9] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#EED4A8] relative my-8">
        {/* Modal Top Accent Header */}
        <div className={`p-6 text-center ${
          isConfirmed 
            ? 'bg-gradient-to-b from-emerald-800 to-emerald-900 text-emerald-50' 
            : isCancelled 
            ? 'bg-gradient-to-b from-red-800 to-red-900 text-red-50'
            : 'bg-gradient-to-b from-[#78350F] to-[#451A03] text-[#FEF3C7]'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full text-white/80 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* STATUS CIRCLE INDICATOR */}
          <div className="flex justify-center mb-3">
            {isConfirmed ? (
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-4 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-xl animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-emerald-300" />
              </div>
            ) : isCancelled ? (
              <div className="w-20 h-20 rounded-full bg-red-500/20 border-4 border-red-400 flex items-center justify-center text-red-300 shadow-xl">
                <AlertCircle className="w-12 h-12 text-red-300" />
              </div>
            ) : (
              /* Yellow / Amber Uncheck Circular Status */
              <div className="w-20 h-20 rounded-full bg-[#FEF3C7]/20 border-4 border-[#FDE68A] flex items-center justify-center text-[#FDE68A] shadow-xl relative">
                <Clock className="w-10 h-10 text-[#FDE68A] animate-spin" style={{ animationDuration: '6s' }} />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#F59E0B] text-[#451A03] font-bold text-xs flex items-center justify-center border-2 border-[#78350F]">
                  !
                </span>
              </div>
            )}
          </div>

          {/* STATUS TITLE */}
          <h2 className="font-serif font-bold text-2xl tracking-tight">
            {isConfirmed
              ? `${t.confirmedStatus}! 🎉`
              : isCancelled
              ? 'Order Cancelled'
              : t.unconfirmedStatus}
          </h2>

          {/* ORDER ID BADGE */}
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-black/30 rounded-full text-xs font-mono font-bold tracking-wider text-[#FDE68A] border border-white/20">
            <span>{t.orderId}: {currentOrder.id}</span>
            <button onClick={copyOrderId} className="hover:text-white transition-colors" title="Copy Order ID">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Modal Body Info */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Explanation Banner */}
          {!isConfirmed && !isCancelled && (
            <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl space-y-1 text-[#451A03]">
              <div className="font-bold text-[#78350F] flex items-center gap-1.5 text-xs">
                <Clock className="w-4 h-4 text-[#D97706]" />
                Awaiting Store Confirmation:
              </div>
              <p className="text-[11px] leading-relaxed text-[#78350F]">
                Your order is safely registered in our system! The owner of Giriraj Farshan is reviewing item stock and will click <strong className="text-[#451A03]">&quot;Confirm Order&quot;</strong> in the admin panel. No online payment is required right now.
              </p>
            </div>
          )}

          {isConfirmed && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Great News! Your Order is Approved:
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-900/90">
                The owner has verified your farshan & hing items and confirmed the order! Preparation is underway. Fresh dispatch will occur shortly.
              </p>
            </div>
          )}

          {/* Customer Summary */}
          <div className="bg-[#FEFBF2] p-3 rounded-xl border border-[#EED4A8] space-y-2">
            <h4 className="font-bold text-[#451A03] text-xs border-b border-[#EED4A8] pb-1">
              Customer & Shipping Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#92400E] font-medium block">{t.fullName}:</span>
                <span className="font-bold text-[#451A03]">{currentOrder.customerName}</span>
              </div>
              <div>
                <span className="text-[#92400E] font-medium block">{t.phone}:</span>
                <span className="font-bold text-[#451A03]">{currentOrder.phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[#92400E] font-medium block">{t.fullAddress}:</span>
                <span className="font-medium text-[#451A03]">{currentOrder.address}, {currentOrder.city} ({currentOrder.pincode})</span>
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-[#451A03] text-xs">Ordered Items ({currentOrder.items.length}):</h4>
            <div className="bg-[#FEFBF2] border border-[#EED4A8] rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5">
              {currentOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] pb-1 border-b border-[#EED4A8] last:border-0">
                  <div>
                    <span className="font-bold text-[#451A03]">{it.productName}</span>
                    <span className="text-[#D97706] font-medium ml-1">({it.optionLabel})</span>
                    {it.flavor && <span className="text-[#92400E] font-medium block text-[10px]">{t.flavorLabel} {it.flavor}</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-[#92400E]">{it.quantity} x ₹{it.unitPrice}</span>
                    <span className="font-bold text-[#78350F] block">₹{it.totalPrice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="flex justify-between font-serif font-bold text-sm text-[#451A03] p-3 bg-[#FEF3C7] rounded-xl border border-[#FDE68A]">
            <span>{t.totalPayable}:</span>
            <span className="text-[#78350F]">₹{currentOrder.totalAmount}</span>
          </div>

          {/* Action Footer */}
          <div className="flex gap-2 pt-2">
            {!isConfirmed && !isCancelled && (
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex-1 py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Check Owner Confirmation Status
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#78350F] font-bold rounded-xl text-xs transition-colors border border-[#EED4A8]"
            >
              Close & Keep Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

