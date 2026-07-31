import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { X, ShieldCheck, MapPin, Phone, User, Mail, ArrowRight } from 'lucide-react';
import { createOrder } from '../services/api';
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = subtotal >= 499 || subtotal === 0 ? 0 : 40;
  const totalAmount = subtotal + deliveryFee;

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
      const orderItems = items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        optionLabel: i.selectedOption.label,
        flavor: i.selectedFlavor,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      }));

      const newOrder = await createOrder({
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        email: email.trim(),
        items: orderItems,
        subtotal,
        deliveryFee,
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl font-medium">
              ⚠️ {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Customer Name */}
            <div>
              <label className="block font-bold text-[#451A03] mb-1">
                {t.fullName} *
              </label>
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
              <label className="block font-bold text-[#451A03] mb-1">
                {t.phone} *
              </label>
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
            <label className="block font-bold text-[#451A03] mb-1">
              {t.emailOptional}
            </label>
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
            <label className="block font-bold text-[#451A03] mb-1">
              {t.fullAddress} *
            </label>
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
              <label className="block font-bold text-[#451A03] mb-1">City / Town</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2 bg-[#FEFBF2] border border-[#EED4A8] rounded-xl text-[#451A03] font-medium focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div>
              <label className="block font-bold text-[#451A03] mb-1">Pincode</label>
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
            <label className="block font-bold text-[#451A03] mb-1">Special Notes / Instructions</label>
            <input
              type="text"
              placeholder="e.g. Call before delivery, extra crisp packing..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-[#FEFBF2] border border-[#EED4A8] rounded-xl text-[#451A03] font-medium"
            />
          </div>

          {/* Summary Box */}
          <div className="p-3 bg-[#FEF3C7] rounded-xl border border-[#FDE68A] space-y-1">
            <div className="flex justify-between font-medium text-[#78350F]">
              <span>Order Items ({items.length}):</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between font-medium text-[#78350F]">
              <span>Express Delivery:</span>
              <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
            </div>
            <div className="flex justify-between font-serif font-bold text-sm text-[#451A03] pt-1 border-t border-[#EED4A8]">
              <span>{t.totalPayable}:</span>
              <span className="text-[#78350F]">₹{totalAmount}</span>
            </div>
          </div>

          {/* Owner Confirmation Notice */}
          <div className="p-3 bg-[#78350F] text-[#FEF3C7] rounded-xl text-[11px] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#FDE68A] block">Notice on Order Confirmation:</span>
              When you click &quot;Place Order&quot;, your status will initially show &quot;{t.unconfirmedStatus}&quot;. The store owner will review and confirm your order from the Admin panel!
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#065F46] hover:bg-[#047857] text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Submitting Order...' : t.placeOrderBtn}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

