import React, { useState, useEffect } from 'react';
import { Product, Review, WeightPriceOption } from '../types';
import { X, Star, Check, ShoppingCart, User } from 'lucide-react';
import { fetchReviews, submitReview } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, option: WeightPriceOption, flavor: string | undefined, quantity: number) => void;
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
  const [selectedOption, setSelectedOption] = useState<WeightPriceOption>(
    product?.options?.[0] || { id: 'default', label: 'Standard', price: 100 }
  );
  const [selectedFlavor, setSelectedFlavor] = useState<string | undefined>(
    product?.flavors && product.flavors.length > 0 ? product.flavors[0] : undefined
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setSelectedOption(product.options?.[0] || { id: 'default', label: 'Standard', price: 100 });
      setSelectedFlavor(product.flavors && product.flavors.length > 0 ? product.flavors[0] : undefined);
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
        comment: comment.trim()
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
    onAddToCart(product, selectedOption, selectedFlavor, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

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
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 bg-[#451A03]/90 text-[#FEF3C7] text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                100% Homemade Recipe
              </span>
            </div>

            {/* Product Info & Direct Buy */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-[#78350F] uppercase tracking-wider bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FDE68A]">
                  {product.category}
                </span>
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
                        s <= Math.round(product.rating) ? 'fill-[#D97706] text-[#D97706]' : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-[#451A03]">{product.rating} / 5</span>
                <span className="text-[#78350F]">({product.reviewCount} customer ratings)</span>
              </div>

              <p className="text-xs text-[#78350F] leading-relaxed">
                {product.description}
              </p>

              {product.ingredients && (
                <div className="p-2.5 rounded-xl bg-[#FEFBF2] border border-[#EED4A8] text-xs">
                  <span className="font-bold text-[#451A03] block mb-0.5">{t.ingredientsLabel}:</span>
                  <span className="text-[#78350F]">{product.ingredients}</span>
                </div>
              )}

              {/* Weight Selector */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-[#451A03] mb-1">
                  {t.chooseWeight}:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {product.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-2 text-xs rounded-xl border text-center transition-all ${
                        selectedOption.id === opt.id
                          ? 'bg-[#78350F] text-white font-bold border-[#92400E]'
                          : 'bg-[#FEFBF2] text-[#451A03] border-[#EED4A8] hover:bg-[#FEF3C7]'
                      }`}
                    >
                      <div>{opt.label}</div>
                      <div className="text-[10px] text-[#D97706] font-bold">₹{opt.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center border border-[#EED4A8] rounded-xl p-1 bg-[#FEFBF2]">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 bg-white rounded-lg font-bold text-[#451A03] hover:bg-[#FEF3C7] text-sm"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-[#451A03]">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-7 h-7 bg-white rounded-lg font-bold text-[#451A03] hover:bg-[#FEF3C7] text-sm"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all ${
                    isAdded ? 'bg-emerald-600' : 'bg-[#B45309] hover:bg-[#92400E]'
                  }`}
                >
                  {isAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                  {isAdded ? t.addedToCart : `${t.addToCart} • ₹${selectedOption.price * quantity}`}
                </button>
              </div>
            </div>
          </div>

          {/* Section Divider */}
          <hr className="border-[#EED4A8]" />

          {/* Write a Review Section */}
          <div className="bg-[#FEF3C7] p-4 rounded-2xl border border-[#FDE68A] space-y-3">
            <h4 className="font-serif font-bold text-[#451A03] text-sm flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-[#D97706] text-[#D97706]" />
              {t.writeReview}
            </h4>

            {reviewSuccess && (
              <div className="p-2.5 bg-emerald-100 text-emerald-900 text-xs rounded-xl font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-700" /> Thank you! Your review has been published.
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
                          star <= newRating
                            ? 'fill-[#D97706] text-[#D97706]'
                            : 'text-stone-300'
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
              <p className="text-xs text-[#78350F] italic">No reviews yet for this product. Be the first to review!</p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-white rounded-xl border border-[#EED4A8] text-xs space-y-1">
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

