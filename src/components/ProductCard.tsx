import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Star, ShoppingCart, Check, Info, Tag, PackageCheck, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  FALLBACK_IMAGES,
  resolveProductImage,
  calculateProductOfferPricing,
} from '../services/api';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, flavor: string | undefined, quantity: number) => void;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onOpenDetails,
}) => {
  const { t } = useLanguage();

  // Selected flavor if product has flavors
  const [selectedFlavor, setSelectedFlavor] = useState<string | undefined>(
    product.flavors && product.flavors.length > 0 ? product.flavors[0] : undefined
  );

  useEffect(() => {
    setSelectedFlavor(
      product.flavors && product.flavors.length > 0 ? product.flavors[0] : undefined
    );
  }, [product]);

  // Selected quantity (capped by stockQuantity)
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  const maxStock = Math.max(0, Number(product.stockQuantity) || 0);
  const isAvailable = product.inStock && maxStock > 0;

  useEffect(() => {
    if (maxStock > 0 && quantity > maxStock) {
      setQuantity(maxStock);
    }
  }, [maxStock, quantity]);

  const pricing = calculateProductOfferPricing(product, quantity);
  const singleUnitPricing = calculateProductOfferPricing(product, 1);

  const handleAdd = () => {
    if (!isAvailable) return;
    onAddToCart(product, selectedFlavor, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const displayImageUrl = resolveProductImage(product.imageUrl, product.category);

  // Live Offer Badge Text based on Admin's chosen badgeMode ('claimed' vs 'left')
  const offerBadgeText =
    pricing.hasActiveOffer && product.offer
      ? product.offer.badgeMode === 'claimed'
        ? `🔥 Special Offer: ${product.offer.unitsSold}/${product.offer.unitLimit} claimed`
        : `🔥 Special Offer: ${pricing.remainingOfferUnits} units left`
      : null;

  const discountLabel =
    pricing.hasActiveOffer && product.offer
      ? product.offer.discountType === 'percentage'
        ? `${product.offer.discountValue}% OFF`
        : `₹${product.offer.discountValue} OFF`
      : null;

  return (
    <div className="group bg-[#FFFDF9] rounded-2xl border border-[#EED4A8] shadow-xs hover:shadow-xl hover:border-[#D97706] transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-1.5 pointer-events-none">
        <div className="flex flex-col gap-1.5">
          {offerBadgeText && (
            <span className="px-2.5 py-1 text-[10px] font-extrabold bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-full shadow-md flex items-center gap-1">
              {offerBadgeText}
            </span>
          )}
          {product.isBestSeller && (
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#B45309] text-white rounded-full shadow-md w-fit">
              ⭐ Best Seller
            </span>
          )}
        </div>

        {discountLabel && (
          <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-600 text-white rounded-full shadow-md">
            {discountLabel}
          </span>
        )}
      </div>

      {/* Image Container */}
      <div
        className="relative aspect-[4/3] bg-[#FEFBF2] overflow-hidden cursor-pointer"
        onClick={() => onOpenDetails(product)}
      >
        <img
          src={displayImageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            const fallback = FALLBACK_IMAGES[product.category] || FALLBACK_IMAGES.default;
            if (target.src !== fallback) {
              target.src = fallback;
            }
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span className="text-xs text-white font-medium flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
            <Info className="w-3.5 h-3.5 text-[#F59E0B]" /> {t.viewDetails}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Rating & Stock Status Bar */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <button
              onClick={() => onOpenDetails(product)}
              className="flex items-center gap-1 font-semibold text-[#78350F] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A] hover:bg-[#FDE68A] transition-colors"
            >
              <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#D97706]" />
              <span>{product.rating}</span>
              <span className="text-[#92400E] font-normal">({product.reviewCount})</span>
            </button>

            {isAvailable ? (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  maxStock <= 10
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                <PackageCheck className="w-3 h-3" />
                {maxStock <= 10 ? `Only ${maxStock} left!` : `${maxStock} in stock`}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                Out of Stock
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3
            onClick={() => onOpenDetails(product)}
            className="font-serif font-bold text-[#451A03] text-base sm:text-lg group-hover:text-[#D97706] transition-colors line-clamp-1 cursor-pointer"
          >
            {product.name}
          </h3>

          {/* Gujarati Subtitle */}
          {product.gujaratiName && (
            <p className="text-xs text-[#92400E] font-bold font-serif mb-1">
              {product.gujaratiName}
            </p>
          )}

          <p className="text-xs text-[#78350F]/80 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price, Flavor & Quantity Controls */}
        <div className="space-y-2.5 pt-2 border-t border-[#EED4A8]">
          {/* Unit Price Display */}
          <div className="flex items-center justify-between bg-[#FEFBF2] px-3 py-2 rounded-xl border border-[#EED4A8]">
            <span className="text-[11px] font-bold text-[#92400E] flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#D97706]" />
              Unit Price:
            </span>
            <div className="flex items-center gap-2">
              {singleUnitPricing.hasActiveOffer ? (
                <>
                  <span className="text-xs text-stone-400 line-through font-medium">
                    ₹{singleUnitPricing.regularUnitPrice}
                  </span>
                  <span className="font-serif font-bold text-base text-emerald-700">
                    ₹{singleUnitPricing.offerUnitPrice}
                  </span>
                </>
              ) : (
                <span className="font-serif font-bold text-base text-[#78350F]">
                  ₹{singleUnitPricing.regularUnitPrice}
                </span>
              )}
            </div>
          </div>

          {/* Flavor Dropdown (if applicable) */}
          {product.flavors && product.flavors.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#92400E] mb-1">
                {t.flavorLabel}
              </label>
              <select
                value={selectedFlavor}
                onChange={(e) => setSelectedFlavor(e.target.value)}
                className="w-full text-xs bg-[#FEFBF2] border border-[#EED4A8] rounded-xl p-2 text-[#451A03] font-semibold focus:ring-2 focus:ring-amber-200 focus:outline-none"
              >
                {product.flavors.map((flv) => (
                  <option key={flv} value={flv}>
                    {flv}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Partial Offer Split Notice when quantity > remainingOfferUnits */}
          {pricing.isPartialOfferSplit && (
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-[10px] text-amber-950 leading-snug space-y-0.5">
              <div className="font-bold flex items-center gap-1 text-amber-800">
                <Zap className="w-3 h-3 text-amber-600 shrink-0" />
                Only {pricing.remainingOfferUnits} offer unit(s) left!
              </div>
              <div>
                <strong>{pricing.offerUnitsApplied}</strong> @ ₹{pricing.offerUnitPrice} (Offer) +{' '}
                <strong>{pricing.regularUnitsApplied}</strong> @ ₹{pricing.regularUnitPrice}{' '}
                (Regular)
              </div>
            </div>
          )}

          {/* Quantity Counter & Total Price Display */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 bg-[#FEFBF2] border border-[#EED4A8] rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={!isAvailable || quantity <= 1}
                className="w-6 h-6 rounded-lg bg-white text-[#78350F] font-bold hover:bg-[#FEF3C7] disabled:opacity-40 flex items-center justify-center transition-colors text-sm border border-[#EED4A8]"
              >
                -
              </button>
              <span className="w-6 text-center text-xs font-bold text-[#451A03]">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                disabled={!isAvailable || quantity >= maxStock}
                className="w-6 h-6 rounded-lg bg-white text-[#78350F] font-bold hover:bg-[#FEF3C7] disabled:opacity-40 flex items-center justify-center transition-colors text-sm border border-[#EED4A8]"
              >
                +
              </button>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-500 block uppercase font-bold">
                Total ({quantity} {quantity === 1 ? 'unit' : 'units'})
              </span>
              <div className="flex items-center justify-end gap-1.5">
                {pricing.discountSaved > 0 && (
                  <span className="text-xs text-stone-400 line-through">
                    ₹{pricing.regularUnitPrice * quantity}
                  </span>
                )}
                <span className="font-serif text-xl font-bold text-[#78350F]">
                  ₹{pricing.totalPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            disabled={!isAvailable}
            className={`w-full py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
              isAdded
                ? 'bg-emerald-700 text-white'
                : isAvailable
                ? 'bg-[#B45309] hover:bg-[#92400E] text-white shadow-amber-900/10'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 animate-bounce" /> {t.addedToCart}!
              </>
            ) : isAvailable ? (
              <>
                <ShoppingCart className="w-4 h-4" /> {t.addToCart}
              </>
            ) : (
              'Out of Stock'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
