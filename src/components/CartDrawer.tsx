import React from 'react';
import { CartItem } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const freeShippingThreshold = 499;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const deliveryFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 40;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="bg-[#FFFDF9] w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-[#EED4A8]">
        {/* Header */}
        <div className="p-4 bg-[#78350F] text-[#FEF3C7] flex items-center justify-between border-b border-[#92400E]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="font-serif font-bold text-base">🛒 {t.cartTitle} • {items.length} {t.itemsInCart}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#FEF3C7] hover:bg-[#92400E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="bg-[#FEF3C7] p-3 border-b border-[#EED4A8] text-xs">
          {remainingForFreeShipping > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between font-bold text-[#78350F]">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#D97706]" />
                  Add ₹{remainingForFreeShipping} more for FREE Shipping!
                </span>
                <span>₹{subtotal}/₹499</span>
              </div>
              <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-[#FDE68A]">
                <div
                  className="h-full bg-[#D97706] transition-all duration-300"
                  style={{ width: `${Math.min(100, (subtotal / 499) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-emerald-900 font-bold flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-700" />
              🎉 You unlocked FREE Express Shipping across India!
            </div>
          )}
        </div>

        {/* Item List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3 text-[#92400E]">
              <ShoppingBag className="w-12 h-12 mx-auto text-[#D97706] opacity-60" />
              <p className="font-serif font-bold text-base text-[#451A03]">{t.emptyCart}</p>
              <p className="text-xs max-w-xs mx-auto">
                Explore our authentic Khakhra, Bandhani Hing, and Surti Farshan to add delicious snacks!
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cartItemId}
                className="flex gap-3 p-3 bg-white rounded-xl border border-[#EED4A8] relative group shadow-xs"
              >
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="w-16 h-16 object-cover rounded-xl bg-[#FEFBF2] border border-[#EED4A8] shrink-0"
                />

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-serif font-bold text-xs text-[#451A03] line-clamp-1">
                      {item.productName}
                    </h4>
                    <button
                      onClick={() => onRemoveItem(item.cartItemId)}
                      className="text-[#92400E] hover:text-red-700 p-0.5 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[11px] text-[#92400E] space-y-0.5 font-medium">
                    <div>Size: <span className="font-bold text-[#78350F]">{item.selectedOption.label}</span></div>
                    {item.selectedFlavor && (
                      <div>{t.flavorLabel} <span className="font-bold text-[#78350F]">{item.selectedFlavor}</span></div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center border border-[#EED4A8] rounded-lg bg-[#FEFBF2]">
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs font-bold text-[#78350F] hover:bg-[#FEF3C7]"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-[#451A03]">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                        className="px-2 py-0.5 text-xs font-bold text-[#78350F] hover:bg-[#FEF3C7]"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-serif font-bold text-sm text-[#78350F]">
                      ₹{item.totalPrice}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {items.length > 0 && (
          <div className="p-4 bg-[#FEFBF2] border-t border-[#EED4A8] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#92400E]">
                <span>Items Subtotal:</span>
                <span className="font-bold text-[#451A03]">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-[#92400E]">
                <span>Delivery Charge:</span>
                <span className="font-bold text-[#451A03]">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>

              <div className="flex justify-between font-serif font-bold text-base text-[#451A03] pt-2 border-t border-[#EED4A8]">
                <span>{t.totalPayable}:</span>
                <span className="text-[#78350F] text-xl">₹{subtotal + deliveryFee}</span>
              </div>
            </div>

            <p className="text-[10px] text-[#78350F] bg-[#FEF3C7] p-2.5 rounded-xl border border-[#FDE68A] text-center font-medium">
              ℹ️ No online payment required right now. Pay when confirmed by owner!
            </p>

            <button
              onClick={onProceedToCheckout}
              className="w-full py-3.5 bg-[#065F46] hover:bg-[#047857] text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {t.proceedToCheckout}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

