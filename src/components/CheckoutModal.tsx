import React, { useState, useEffect } from 'react';
import { CartItem, Order, Coupon } from '../types';
import {
  X,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  Mail,
  ArrowRight,
  Ticket,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { createOrder, validateCouponCode } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderSuccess: (createdOrder: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
}) => {
  const { t } = useLanguage();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Ahmedabad');
  const [pincode, setPincode] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Coupon Code State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalOfferSavings = items.reduce((sum, item) => sum + (item.discountSaved || 0), 0);

  // Re-validate coupon if cart subtotal changes
  useEffect(() => {
    if (appliedCoupon) {
      if (subtotal < appliedCoupon.minCartValue) {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponFeedback({
          type: 'error',
          text: `Coupon removed because cart subtotal dropped below ₹${appliedCoupon.minCartValue}.`,
        });
      } else {
        const rawDisc =
          appliedCoupon.discountType === 'flat'
            ? appliedCoupon.discountValue
            : Math.round((subtotal * appliedCoupon.discountValue) / 100);
        setCouponDiscount(Math.max(0, Math.min(subtotal, rawDisc)));
      }
    }
  }, [subtotal, appliedCoupon]);

  if (!isOpen) return null;

  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const deliveryFee = subtotal >= 499 || subtotal === 0 ? 0 : 40;
  const totalAmount = discountedSubtotal + deliveryFee;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponFeedback(null);
    try {
      const res = await validateCouponCode(couponInput, subtotal);
      if (res.valid && res.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponDiscount(res.discountAmount);
        setCouponFeedback({ type: 'success', text: res.message });
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponFeedback({ type: 'error', text: res.message });
      }
    } catch {
      setCouponFeedback({ type: 'error', text: 'Failed to validate coupon. Please try again.' });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponInput('');
    setCouponFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setErrorMessage('Please fill in Name, Phone Number, and Full Address.');
      return;
    }

    if (phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // Re-verify coupon usage limit right before placing order
      let finalCouponCode: string | undefined = undefined;
      let finalCouponDiscount = 0;

      if (appliedCoupon) {
        const check = await validateCouponCode(appliedCoupon.code, subtotal);
        if (!check.valid) {
          setAppliedCoupon(null);
          setCouponDiscount(0);
          setErrorMessage(check.message);
          setIsSubmitting(false);
          return;
        }
        finalCouponCode = appliedCoupon.code;
        finalCouponDiscount = check.discountAmount;
      }

      const orderItems = items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        flavor: i.selectedFlavor,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        offerUnitPrice: i.offerUnitPrice,
        offerUnitsApplied: i.offerUnitsApplied,
        regularUnitsApplied: i.regularUnitsApplied,
        discountSaved: i.discountSaved,
        totalPrice: i.totalPrice,
      }));

      const finalTotal = Math.max(0, subtotal - finalCouponDiscount) + deliveryFee;

      const newOrder = await createOrder({
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        email: email.trim(),
        items: orderItems,
        subtotal,
        couponCode: finalCouponCode,
        couponDiscount: finalCouponDiscount,
        deliveryFee,
        totalAmount: finalTotal,
        notes: notes.trim(),
      });

      onOrderSuccess(newOrder);
    } catch (err: any) {
      console.error('Error creating order:', err);
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-start sm:items-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#FFFDF9] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-[#EED4A8] relative my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-[#78350F] text-[#FEF3C7] flex items-center justify-between border-b border-[#92400E]">
          <div>
            <h2 className="font-serif font-bold text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#F59E0B]" />
              {t.checkoutTitle}
            </h2>
            <p className="text-xs text-[#FDE68A]/80 mt-0.5">
              Enter your shipping details. Payment after owner confirmation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#FEF3C7] hover:bg-[#92400E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl font-medium">
              ⚠️ {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Customer Name */}
            <div>
              <label className="block font-bold text-[#451A03] mb-1">{t.fullName} *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#D97706]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Hareshbhai Patel"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#FEFBF2] border border-[#EED4A8] rounded-xl text-[#451A03] font-medium focus:ring-2 focus:ring-amber-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Mobile Phone Number */}
            <div>
              <label className="block font-bold text-[#451A03] mb-1">{t.phone} *</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#D97706]" />
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#FEFBF2] border border-[#EED4A8] rounded-xl text-[#451A03] font-medium focus:ring-2 focus:ring-amber-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block font-bold text-[#451A03] mb-1">{t.emailOptional}</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#D97706]" />
              <input
                type="email"
                placeholder="For instant digital receipt (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FEFBF2] border border-[#EED4A8] rounded-xl text-[#451A03] font-medium focus:ring-2 focus:ring-amber-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block font-bold text-[#451A03] mb-1">{t.fullAddress} *</label>
            <textarea
              required
              rows={2}
              placeholder="Flat/House No., Society Name, Street, Landmark..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-[#FEFBF2] border border-[#EED4A8] rounded-xl text-[#451A03] font-medium focus:ring-2 focus:ring-amber-200 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#451A03] mb-1">{t.city}</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2 bg-[#FEFBF2] border border-[#EED4A8] rounded-xl text-[#451A03] font-medium focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div>
              <label className="block font-bold text-[#451A03] mb-1">{t.pincode}</label>
              <input
                type="text"
                required
                placeholder="6-digit Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full p-2 bg-[#FEFBF2] border border-[#EED4A8] rounded-xl text-[#451A03] font-medium focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>

          {/* Delivery Notes */}
          <div>
            <label className="block font-bold text-[#451A03] mb-1">
              Special Notes / Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Call before delivery, extra crisp packing..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-[#FEFBF2] border border-[#EED4A8] rounded-xl text-[#451A03] font-medium"
            />
          </div>

          {/* Coupon Code Redemption Section */}
          <div className="p-3 bg-[#FEFBF2] rounded-xl border border-[#EED4A8] space-y-2">
            <label className="block font-bold text-[#451A03] flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-[#D97706]" />
              Have a Promo / Coupon Code?
            </label>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-mono font-extrabold text-xs bg-emerald-200/70 px-2 py-0.5 rounded">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-[11px] font-bold ml-2 text-emerald-800">
                      -₹{couponDiscount} OFF Applied!
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-red-600 hover:text-red-800 p-1 rounded transition-colors flex items-center gap-1 text-[11px] font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Coupon Code (e.g. WELCOME100)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 p-2 bg-white border border-[#EED4A8] rounded-xl text-[#451A03] font-mono font-bold uppercase placeholder:font-sans placeholder:normal-case focus:ring-2 focus:ring-amber-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponInput.trim()}
                  className="px-4 py-2 bg-[#B45309] hover:bg-[#92400E] disabled:opacity-50 text-white font-bold rounded-xl transition-colors shrink-0"
                >
                  {applyingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </div>
            )}

            {couponFeedback && !appliedCoupon && (
              <p
                className={`text-[11px] font-medium ${
                  couponFeedback.type === 'success' ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {couponFeedback.text}
              </p>
            )}
          </div>

          {/* Summary Box */}
          <div className="p-3 bg-[#FEF3C7] rounded-xl border border-[#FDE68A] space-y-1">
            <div className="flex justify-between font-medium text-[#78350F]">
              <span>Order Items ({items.reduce((s, i) => s + i.quantity, 0)} units):</span>
              <span>₹{subtotal}</span>
            </div>
            {totalOfferSavings > 0 && (
              <div className="flex justify-between font-bold text-emerald-800 text-[11px]">
                <span>Special Product Offer Savings:</span>
                <span>Saved ₹{totalOfferSavings}</span>
              </div>
            )}
            {couponDiscount > 0 && appliedCoupon && (
              <div className="flex justify-between font-bold text-emerald-800">
                <span>Coupon Discount ({appliedCoupon.code}):</span>
                <span>-₹{couponDiscount}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-[#78350F]">
              <span>Express Delivery:</span>
              <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
            </div>
            <div className="flex justify-between font-serif font-bold text-sm text-[#451A03] pt-1 border-t border-[#EED4A8]">
              <span>{t.totalPayable}:</span>
              <span className="text-[#78350F] text-base">₹{totalAmount}</span>
            </div>
          </div>

          {/* Owner Confirmation Notice */}
          <div className="p-3 bg-[#78350F] text-[#FEF3C7] rounded-xl text-[11px] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#FDE68A] block">Notice on Order Confirmation:</span>
              When you click &quot;{t.placeOrderBtn}&quot;, your status will initially show &quot;
              {t.unconfirmedStatus}&quot;. The store owner will review and confirm your order from
              the Admin panel!
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#065F46] hover:bg-[#047857] text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? t.placingOrder : `${t.placeOrderBtn} • ₹${totalAmount}`}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
