import React, { useState } from 'react';
import { Product, WeightPriceOption } from '../types';
import { Star, ShoppingCart, Check, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, option: WeightPriceOption, flavor: string | undefined, quantity: number) => void;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onOpenDetails }) => {
  const { t } = useLanguage();

  // Default selected weight/packet option
  const [selectedOption, setSelectedOption] = useState<WeightPriceOption>(
    product.options[0] || { id: 'default', label: 'Standard', price: 100 }
  );

  // Selected flavor if product has flavors
  const [selectedFlavor, setSelectedFlavor] = useState<string | undefined>(
    product.flavors && product.flavors.length > 0 ? product.flavors[0] : undefined
  );

  // Selected quantity
  const [quantity, setQuantity] = useState<number>(1);

  // Added animation state
  const [isAdded, setIsAdded] = useState<boolean>(false);

  const handleAdd = () => {
    onAddToCart(product, selectedOption, selectedFlavor, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const currentTotalPrice = selectedOption.price * quantity;

  return (
    <div className="group bg-[#FFFDF9] rounded-2xl border border-[#EED4A8] shadow-xs hover:shadow-xl hover:border-[#D97706] transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {product.isBestSeller && (
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#B45309] text-white rounded-full shadow-md">
            🔥 Best Seller
          </span>
        )}
        {product.isPureGujarati && (
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#FEF3C7] text-[#78350F] border border-[#FDE68A] rounded-full">
            અસલી વાનગી
          </span>
        )}
      </div>

      {/* Image Container */}
      <div 
        className="relative aspect-[4/3] bg-[#FEFBF2] overflow-hidden cursor-pointer"
        onClick={() => onOpenDetails(product)}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
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
          {/* Rating & Review trigger */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <button
              onClick={() => onOpenDetails(product)}
              className="flex items-center gap-1 font-semibold text-[#78350F] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A] hover:bg-[#FDE68A] transition-colors"
            >
              <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#D97706]" />
              <span>{product.rating}</span>
              <span className="text-[#92400E] font-normal">({product.reviewCount})</span>
            </button>

            <span className="text-[11px] font-bold text-[#92400E] uppercase tracking-wide">
              {product.saleType === 'weight' ? 'By Weight' : 'By Packet'}
            </span>
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

        {/* Dynamic Selectors */}
        <div className="space-y-2.5 pt-2 border-t border-[#EED4A8]">
          {/* 1. Weight / Packet Option Pills */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#92400E] mb-1">
              {t.chooseWeight}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {product.options.map((opt) => {
                const isSelected = selectedOption.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedOption(opt)}
                    className={`px-1.5 py-1.5 text-xs rounded-xl font-bold border text-center transition-all ${
                      isSelected
                        ? 'bg-[#FEF3C7] text-[#78350F] border-2 border-[#D97706] shadow-xs'
                        : 'bg-white text-[#92400E] border-[#EED4A8] hover:bg-[#FEF3C7]/50'
                    }`}
                  >
                    <div className="truncate">{opt.label}</div>
                    <div className={isSelected ? 'text-[#D97706] text-[10px]' : 'text-gray-500 text-[10px]'}>
                      ₹{opt.price}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Flavor Dropdown (if applicable) */}
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

          {/* 3. Quantity Counter & Price Display */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 bg-[#FEFBF2] border border-[#EED4A8] rounded-xl p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-6 h-6 rounded-lg bg-white text-[#78350F] font-bold hover:bg-[#FEF3C7] flex items-center justify-center transition-colors text-sm border border-[#EED4A8]"
              >
                -
              </button>
              <span className="w-6 text-center text-xs font-bold text-[#451A03]">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-6 h-6 rounded-lg bg-white text-[#78350F] font-bold hover:bg-[#FEF3C7] flex items-center justify-center transition-colors text-sm border border-[#EED4A8]"
              >
                +
              </button>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-500 block uppercase font-bold">Total Price</span>
              <span className="font-serif text-xl font-bold text-[#78350F]">
                ₹{currentTotalPrice}
              </span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className={`w-full py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
              isAdded
                ? 'bg-emerald-700 text-white'
                : product.inStock
                ? 'bg-[#B45309] hover:bg-[#92400E] text-white shadow-amber-900/10'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 animate-bounce" /> {t.addedToCart}!
              </>
            ) : product.inStock ? (
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
