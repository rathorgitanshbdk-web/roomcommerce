import React, { useState, useEffect, useRef } from 'react';
import { Product, DiscountType, OfferBadgeMode, ProductOffer } from '../types';
import { X, Save, Flame, RotateCcw, Package } from 'lucide-react';
import { createProduct, updateProduct } from '../services/api';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  onSuccess: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [gujaratiName, setGujaratiName] = useState('');
  const [category, setCategory] = useState<'khakhra' | 'hing' | 'farshan' | 'combos'>('khakhra');
  const [description, setDescription] = useState('');
  const [gujaratiDescription, setGujaratiDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState<number>(100);
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [ingredients, setIngredients] = useState('');
  const [flavorsText, setFlavorsText] = useState('');
  const [inStock, setInStock] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Special Limited-Unit Offer State
  const [offerActive, setOfferActive] = useState(false);
  const [offerDiscountType, setOfferDiscountType] = useState<DiscountType>('percentage');
  const [offerDiscountValue, setOfferDiscountValue] = useState<number>(20);
  const [offerUnitLimit, setOfferUnitLimit] = useState<number>(50);
  const [offerUnitsSold, setOfferUnitsSold] = useState<number>(0);
  const [offerBadgeMode, setOfferBadgeMode] = useState<OfferBadgeMode>('left');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setGujaratiName(editingProduct.gujaratiName || '');
      setCategory(editingProduct.category);
      setDescription(editingProduct.description);
      setGujaratiDescription(editingProduct.gujaratiDescription || '');
      setImageUrl(editingProduct.imageUrl);
      setPrice(Number(editingProduct.price) || 100);
      setStockQuantity(
        editingProduct.stockQuantity !== undefined ? Number(editingProduct.stockQuantity) : 50
      );
      setIngredients(editingProduct.ingredients || '');
      setFlavorsText(editingProduct.flavors ? editingProduct.flavors.join(', ') : '');
      setInStock(editingProduct.inStock);
      setIsBestSeller(editingProduct.isBestSeller || false);

      if (editingProduct.offer) {
        setOfferActive(Boolean(editingProduct.offer.active));
        setOfferDiscountType(editingProduct.offer.discountType || 'percentage');
        setOfferDiscountValue(Number(editingProduct.offer.discountValue) || 15);
        setOfferUnitLimit(Number(editingProduct.offer.unitLimit) || 50);
        setOfferUnitsSold(Number(editingProduct.offer.unitsSold) || 0);
        setOfferBadgeMode(editingProduct.offer.badgeMode || 'left');
      } else {
        setOfferActive(false);
        setOfferDiscountType('percentage');
        setOfferDiscountValue(20);
        setOfferUnitLimit(50);
        setOfferUnitsSold(0);
        setOfferBadgeMode('left');
      }
    } else {
      setName('');
      setGujaratiName('');
      setCategory('khakhra');
      setDescription('');
      setGujaratiDescription('');
      setImageUrl(
        'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
      );
      setPrice(100);
      setStockQuantity(50);
      setIngredients('');
      setFlavorsText('');
      setInStock(true);
      setIsBestSeller(false);
      setOfferActive(false);
      setOfferDiscountType('percentage');
      setOfferDiscountValue(20);
      setOfferUnitLimit(50);
      setOfferUnitsSold(0);
      setOfferBadgeMode('left');
    }

    if (isOpen) {
      setTimeout(() => {
        formRef.current?.scrollTo({ top: 0, behavior: 'auto' });
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [editingProduct, isOpen]);

  // Image Presets for convenience
  const presets = [
    {
      label: 'Khakhra Crisp',
      url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800',
    },
    {
      label: 'Hing Spices',
      url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800',
    },
    {
      label: 'Gathiya Snack',
      url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800',
    },
    {
      label: 'Sev Namkeen',
      url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800',
    },
  ];

  // Calculate preview offer price
  const previewOfferPrice =
    offerDiscountType === 'percentage'
      ? Math.max(1, Math.round(price * (1 - offerDiscountValue / 100)))
      : Math.max(1, Math.round(price - offerDiscountValue));

  const remainingOfferPreview = Math.max(0, offerUnitLimit - offerUnitsSold);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !imageUrl.trim()) {
      setError('Product Name, Description, and Image URL are required.');
      return;
    }

    if (price <= 0) {
      setError('Please enter a valid unit price greater than ₹0.');
      return;
    }

    setError('');
    setIsSaving(true);

    const flavorsArray = flavorsText
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const offerPayload: ProductOffer | undefined = offerActive
      ? {
          active: true,
          discountType: offerDiscountType,
          discountValue: Math.max(1, Number(offerDiscountValue) || 10),
          unitLimit: Math.max(1, Number(offerUnitLimit) || 50),
          unitsSold: Math.max(0, Number(offerUnitsSold) || 0),
          badgeMode: offerBadgeMode,
        }
      : {
          active: false,
          discountType: offerDiscountType,
          discountValue: Number(offerDiscountValue) || 0,
          unitLimit: Number(offerUnitLimit) || 50,
          unitsSold: Number(offerUnitsSold) || 0,
          badgeMode: offerBadgeMode,
        };

    const safeStock = Math.max(0, Number(stockQuantity) || 0);

    const payload: Partial<Product> = {
      name: name.trim(),
      gujaratiName: gujaratiName.trim(),
      category,
      description: description.trim(),
      gujaratiDescription: gujaratiDescription.trim(),
      imageUrl: imageUrl.trim(),
      price: Number(price),
      stockQuantity: safeStock,
      offer: offerPayload,
      flavors: flavorsArray,
      ingredients: ingredients.trim(),
      inStock: safeStock > 0 && inStock,
      isBestSeller,
      isPureGujarati: true,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex justify-center items-start sm:items-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative text-slate-100 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <h2 className="font-serif font-bold text-lg text-white">
            {editingProduct
              ? 'Edit Product, Stock & Offer (પ્રોડક્ટમાં સુધારો)'
              : 'Add New Product Card (નવી પ્રોડક્ટ ઉમેરો)'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 scroll-smooth"
        >
          {error && (
            <div className="p-3 bg-red-900/80 border border-red-700 text-red-200 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Name English */}
            <div>
              <label className="block font-bold text-slate-200 mb-1">
                Product Name (English) *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                required
                placeholder="e.g. Handcrafted Methi Khakhra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            {/* Gujarati Subtitle */}
            <div>
              <label className="block font-bold text-slate-200 mb-1">
                Gujarati Title (ગુજરાતી નામ)
              </label>
              <input
                type="text"
                placeholder="e.g. હસ્તનિર્મિત મેથી ખાખરા"
                value={gujaratiName}
                onChange={(e) => setGujaratiName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category, Price, and Stock Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-200 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="khakhra">Handcrafted Khakhra</option>
                <option value="hing">Pure Bandhani Hing</option>
                <option value="farshan">Gujarati Farshan & Sev</option>
                <option value="combos">Gift Pack Combos</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-cyan-300 mb-1">
                Regular Price per Unit (₹) *
              </label>
              <input
                type="number"
                required
                min={1}
                placeholder="e.g. 150"
                value={price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                className="w-full p-2.5 bg-slate-950 border border-cyan-700/60 rounded-lg text-cyan-300 font-bold focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-emerald-300 mb-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                Units in Stock *
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="e.g. 60"
                value={stockQuantity}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  setStockQuantity(val);
                  if (val > 0 && !inStock) setInStock(true);
                  if (val === 0) setInStock(false);
                }}
                className="w-full p-2.5 bg-slate-950 border border-emerald-700/60 rounded-lg text-emerald-300 font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Limited-Unit Special Offer Builder */}
          <div className="p-4 bg-slate-950/90 rounded-xl border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offerActive}
                  onChange={(e) => setOfferActive(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Apply Special Limited-Unit Offer (e.g. First 50 or 60 Units Only)
                </span>
              </label>

              {offerActive && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                  Offer Price: ₹{previewOfferPrice}/unit
                </span>
              )}
            </div>

            {offerActive && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Discount Type
                    </label>
                    <select
                      value={offerDiscountType}
                      onChange={(e) => setOfferDiscountType(e.target.value as DiscountType)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="percentage">Percentage Off (%)</option>
                      <option value="flat">Flat Rupees Off (₹/unit)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {offerDiscountType === 'percentage'
                        ? 'Discount Percentage (%)'
                        : 'Flat Discount per Unit (₹)'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={offerDiscountType === 'percentage' ? 95 : Math.max(1, price - 1)}
                      value={offerDiscountValue}
                      onChange={(e) => setOfferDiscountValue(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Offer Valid for First X Units
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 50 or 60"
                      value={offerUnitLimit}
                      onChange={(e) => setOfferUnitLimit(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-bold"
                    />
                    <div className="flex gap-1 mt-1">
                      {[25, 50, 60, 100].map((presetLimit) => (
                        <button
                          key={presetLimit}
                          type="button"
                          onClick={() => setOfferUnitLimit(presetLimit)}
                          className={`px-1.5 py-0.5 text-[10px] rounded border ${
                            offerUnitLimit === presetLimit
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          First {presetLimit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Badge Display Mode & Units Sold Counter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Storefront Live Offer Badge Format
                    </label>
                    <select
                      value={offerBadgeMode}
                      onChange={(e) => setOfferBadgeMode(e.target.value as OfferBadgeMode)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="left">
                        Show Remaining Units (🔥 Special Offer: {remainingOfferPreview} units left)
                      </option>
                      <option value="claimed">
                        Show Claimed Ratio (🔥 Special Offer: {offerUnitsSold}/{offerUnitLimit}{' '}
                        claimed)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Offer Units Claimed So Far
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={offerUnitLimit}
                        value={offerUnitsSold}
                        onChange={(e) => setOfferUnitsSold(Math.max(0, Number(e.target.value)))}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setOfferUnitsSold(0)}
                        className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0 flex items-center gap-1 text-[11px]"
                        title="Reset claimed units counter to 0"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                  ℹ️ <strong>Automatic Cutoff & Split Rule:</strong> Once{' '}
                  <strong>{offerUnitLimit} units</strong> are sold, this offer automatically ends
                  and reverts to ₹{price}/unit. If only 2 offer units are left and a buyer orders 5
                  units, 2 units get ₹{previewOfferPrice} and 3 units get ₹{price}.
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-200 mb-1">Product Description *</label>
            <textarea
              required
              rows={2}
              placeholder="Crispy, roasted with pure groundnut oil and carom seeds..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Image URL & Presets */}
          <div>
            <label className="block font-bold text-slate-200 mb-1">Image URL *</label>
            <input
              type="text"
              required
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-[11px]"
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[10px] text-slate-400">Sample Image Presets:</span>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(p.url)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Flavors & Ingredients */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-200 mb-1">
                Available Flavors (Optional, comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Methi, Masala, Plain Butter"
                value={flavorsText}
                onChange={(e) => setFlavorsText(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-200 mb-1">Ingredients</label>
              <input
                type="text"
                placeholder="Besan, Groundnut Oil, Ajwain, Hing..."
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock && stockQuantity > 0}
                onChange={(e) => {
                  setInStock(e.target.checked);
                  if (e.target.checked && stockQuantity === 0) setStockQuantity(25);
                }}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
              <span className="font-bold text-slate-200">Available for Sale (In Stock)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="font-bold text-amber-300">Highlight as Best Seller ⭐</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Product...' : 'Save Product, Stock & Offer'}
          </button>
        </form>
      </div>
    </div>
  );
};
