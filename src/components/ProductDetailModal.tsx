import React, { useState, useEffect } from 'react';
import { Product, Review } from '../types';
import { X, Star, Check, ShoppingCart, User, PackageCheck, Zap } from 'lucide-react';
import {
  fetchReviews,
  submitReview,
  FALLBACK_IMAGES,
  resolveProductImage,
  calculateProductOfferPricing,
} from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, flavor: string | undefined, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const { t } = useLanguage();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);

  // Review Form state
  const [newRating, setNewRating] = useState<number>(5);
  const [customerName, setCustomerName] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);

  // Selection state
  const [selectedFlavor, setSelectedFlavor] = useState<string | undefined>(
    product?.flavors && product.flavors.length > 0 ? product.flavors[0] : undefined
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setSelectedFlavor(
        product.flavors && product.flavors.length > 0 ? product.flavors[0] : undefined
      );
      setQuantity(1);
      setIsAdded(false);
      setLoadingReviews(true);
      fetchReviews(product.id)
        .then((data) => setReviews(data))
        .catch((err) => console.error('Failed to load reviews:', err))
        .finally(() => setLoadingReviews(false));
    }
  }, [product]);

  if (!product) return null;

  const maxStock = Math.max(0, Number(product.stockQuantity) || 0);
  const isAvailable = product.inStock && maxStock > 0;
  const pricing = calculateProductOfferPricing(product, quantity);
  const singleUnitPricing = calculateProductOfferPricing(product, 1);

  const offerBadgeText =
    pricing.hasActiveOffer && product.offer
      ? product.offer.badgeMode === 'claimed'
        ? `🔥 Special Offer: ${product.offer.unitsSold}/${product.offer.unitLimit} units claimed`
        : `🔥 Special Offer: ${pricing.remainingOfferUnits} units left at offer price`
      : null;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !comment.trim()) return;

    setSubmitting(true);
    try {
      const created = await submitReview({
        productId: product.id,
        productName: product.name,
        customerName: customerName.trim(),
        rating: newRating,
        comment: comment.trim(),
      });
      setReviews([created, ...reviews]);
      setCustomerName('');
      setComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdd = () => {
    if (!isAvailable) return;
    onAddToCart(product, selectedFlavor, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const displayImageUrl = resolveProductImage(product.imageUrl, product.category);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-start sm:items-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#FFFDF9] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-[#EED4A8] relative my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#EED4A8] bg-[#FEF3C7] sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#D97706] animate-pulse" />
            <h2 className="font-serif font-bold text-[#451A03] text-lg">
              {t.viewDetails} & {t.customerReviews}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#78350F] hover:bg-[#FDE68A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Top Grid: Image + Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Image */}
            <div className="rounded-xl overflow-hidden aspect-[4/3] bg-[#FEFBF2] border border-[#EED4A8] relative">
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
                className="w-full h-full object-cover"
              />
              {offerBadgeText && (
                <span className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                  {offerBadgeText}
                </span>
              )}
              <span className="absolute bottom-2 left-2 bg-[#451A03]/90 text-[#FEF3C7] text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                100% Homemade Recipe
              </span>
            </div>

            {/* Product Info & Direct Buy */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-[#78350F] uppercase tracking-wider bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FDE68A]">
                    {product.category}
                  </span>
                  {isAvailable ? (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <PackageCheck className="w-3.5 h-3.5" />
                      {maxStock} units in stock
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
                      Out of Stock
                    </span>
                  )}
                </div>

                <h3 className="font-serif font-bold text-xl text-[#451A03] mt-1">
                  {product.name}
                </h3>
                {product.gujaratiName && (
                  <p className="font-serif text-sm font-semibold text-[#D97706]">
                    {product.gujaratiName}
                  </p>
                )}
              </div>

              {/* Rating Summary */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex text-[#D97706]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(product.rating)
                          ? 'fill-[#D97706] text-[#D97706]'
                          : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-[#451A03]">{product.rating} / 5</span>
                <span className="text-[#78350F]">({product.reviewCount} customer ratings)</span>
              </div>

              {/* Price Display Box */}
              <div className="p-3 rounded-xl bg-[#FEF3C7]/70 border border-[#FDE68A] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#78350F] block">Price per Unit:</span>
                  {singleUnitPricing.hasActiveOffer && product.offer && (
                    <span className="text-[10px] font-bold text-emerald-800">
                      {product.offer.discountType === 'percentage'
                        ? `${product.offer.discountValue}% Special Discount`
                        : `Flat ₹${product.offer.discountValue} OFF per unit`}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {singleUnitPricing.hasActiveOffer ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-400 line-through">
                        ₹{singleUnitPricing.regularUnitPrice}
                      </span>
                      <span className="font-serif font-bold text-2xl text-emerald-700">
                        ₹{singleUnitPricing.offerUnitPrice}
                      </span>
                    </div>
                  ) : (
                    <span className="font-serif font-bold text-2xl text-[#451A03]">
                      ₹{singleUnitPricing.regularUnitPrice}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#78350F] leading-relaxed">{product.description}</p>

              {product.ingredients && (
                <div className="p-2.5 rounded-xl bg-[#FEFBF2] border border-[#EED4A8] text-xs">
                  <span className="font-bold text-[#451A03] block mb-0.5">
                    {t.ingredientsLabel}:
                  </span>
                  <span className="text-[#78350F]">{product.ingredients}</span>
                </div>
              )}

              {/* Flavor Selector if applicable */}
              {product.flavors && product.flavors.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-[#451A03] mb-1">
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

              {/* Partial Offer Split Explanation */}
              {pricing.isPartialOfferSplit && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-800">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    Only {pricing.remainingOfferUnits} offer unit(s) remaining!
                  </div>
                  <p className="text-[11px]">
                    <strong>{pricing.offerUnitsApplied} unit(s)</strong> at Offer Price (₹
                    {pricing.offerUnitPrice}) +{' '}
                    <strong>{pricing.regularUnitsApplied} unit(s)</strong> at Regular Price (₹
                    {pricing.regularUnitPrice}) = <strong>₹{pricing.totalPrice}</strong>
                  </p>
                </div>
              )}

              {/* Add to Cart */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center border border-[#EED4A8] rounded-xl p-1 bg-[#FEFBF2]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={!isAvailable || quantity <= 1}
                    className="w-7 h-7 bg-white rounded-lg font-bold text-[#451A03] hover:bg-[#FEF3C7] disabled:opacity-40 text-sm"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-[#451A03]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    disabled={!isAvailable || quantity >= maxStock}
                    className="w-7 h-7 bg-white rounded-lg font-bold text-[#451A03] hover:bg-[#FEF3C7] disabled:opacity-40 text-sm"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={!isAvailable}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all ${
                    isAdded
                      ? 'bg-emerald-600'
                      : isAvailable
                      ? 'bg-[#B45309] hover:bg-[#92400E]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                  {isAdded
                    ? t.addedToCart
                    : isAvailable
                    ? `${t.addToCart} • ₹${pricing.totalPrice}`
                    : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>

          <hr className="border-[#EED4A8]" />

          {/* Write a Review Section */}
          <div className="bg-[#FEF3C7] p-4 rounded-2xl border border-[#FDE68A] space-y-3">
            <h4 className="font-serif font-bold text-[#451A03] text-sm flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-[#D97706] text-[#D97706]" />
              {t.writeReview}
            </h4>

            {reviewSuccess && (
              <div className="p-2.5 bg-emerald-100 text-emerald-900 text-xs rounded-xl font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-700" /> Thank you! Your review has been
                published.
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <label className="font-bold text-[#451A03] shrink-0">Your Star Rating:</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-0.5 focus:outline-none"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= newRating ? 'fill-[#D97706] text-[#D97706]' : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name (e.g. Ramesh Patel)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#EED4A8] rounded-xl text-[#451A03] focus:ring-2 focus:ring-amber-200 focus:outline-none"
                  />
                </div>
                <div>
                  <textarea
                    required
                    rows={1}
                    placeholder="Write your review experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#EED4A8] rounded-xl text-[#451A03] focus:ring-2 focus:ring-amber-200 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white font-bold rounded-xl transition-colors"
              >
                {submitting ? 'Submitting Review...' : t.submitReviewBtn}
              </button>
            </form>
          </div>

          {/* Customer Reviews List */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-[#451A03] text-sm">
              {t.customerReviews} ({reviews.length})
            </h4>

            {loadingReviews ? (
              <p className="text-xs text-[#78350F] italic">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-[#78350F] italic">
                No reviews yet for this product. Be the first to review!
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 bg-white rounded-xl border border-[#EED4A8] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[#451A03]">
                        <User className="w-3.5 h-3.5 text-[#D97706]" />
                        {rev.customerName}
                        {rev.isVerifiedPurchase && (
                          <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#78350F]">{rev.date}</span>
                    </div>

                    <div className="flex text-[#D97706]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= rev.rating ? 'fill-[#D97706] text-[#D97706]' : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-[#451A03] leading-relaxed font-serif">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
