import React, { useState, useEffect, useRef } from 'react';
import { Product, SaleType, WeightPriceOption } from '../types';
import { X, Plus, Trash2, Image as ImageIcon, Save, Check } from 'lucide-react';
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
  const [saleType, setSaleType] = useState<SaleType>('weight');
  const [ingredients, setIngredients] = useState('');
  const [flavorsText, setFlavorsText] = useState('');
  const [inStock, setInStock] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Predefined Weights / Packets list
  const [options, setOptions] = useState<WeightPriceOption[]>([
    { id: 'opt-1', label: '250g Pack', weightInGrams: 250, price: 110 },
    { id: 'opt-2', label: '500g Pack', weightInGrams: 500, price: 210 },
    { id: 'opt-3', label: '1 kg Box', weightInGrams: 1000, price: 400 },
  ]);

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
      setSaleType(editingProduct.saleType);
      setIngredients(editingProduct.ingredients || '');
      setFlavorsText(editingProduct.flavors ? editingProduct.flavors.join(', ') : '');
      setInStock(editingProduct.inStock);
      setIsBestSeller(editingProduct.isBestSeller || false);
      setOptions(editingProduct.options && editingProduct.options.length > 0 ? editingProduct.options : []);
    } else {
      setName('');
      setGujaratiName('');
      setCategory('khakhra');
      setDescription('');
      setGujaratiDescription('');
      setImageUrl('https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800');
      setSaleType('weight');
      setIngredients('');
      setFlavorsText('');
      setInStock(true);
      setIsBestSeller(false);
      setOptions([
        { id: `opt-${Date.now()}-1`, label: '250g Pack', weightInGrams: 250, price: 110 },
        { id: `opt-${Date.now()}-2`, label: '500g Pack', weightInGrams: 500, price: 210 },
        { id: `opt-${Date.now()}-3`, label: '1 kg Box', weightInGrams: 1000, price: 400 },
      ]);
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
    { label: 'Khakhra Crisp', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800' },
    { label: 'Hing Spices', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800' },
    { label: 'Gathiya Snack', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800' },
    { label: 'Sev Namkeen', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800' },
  ];

  const handleAddOption = () => {
    setOptions([
      ...options,
      {
        id: `opt-${Date.now()}`,
        label: saleType === 'weight' ? '250g' : '1 Packet',
        weightInGrams: 250,
        price: 100,
      },
    ]);
  };

  const handleUpdateOption = (index: number, field: keyof WeightPriceOption, value: any) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    setOptions(updated);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1) {
      setError('A product must have at least one weight/packet price option.');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !imageUrl.trim()) {
      setError('Product Name, Description, and Image URL are required.');
      return;
    }

    if (options.length === 0) {
      setError('Please add at least one predefined weight or packet price option.');
      return;
    }

    setError('');
    setIsSaving(true);

    const flavorsArray = flavorsText
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const payload: Partial<Product> = {
      name: name.trim(),
      gujaratiName: gujaratiName.trim(),
      category,
      description: description.trim(),
      gujaratiDescription: gujaratiDescription.trim(),
      imageUrl: imageUrl.trim(),
      saleType,
      options,
      flavors: flavorsArray,
      ingredients: ingredients.trim(),
      inStock,
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
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative text-slate-100 my-auto max-h-[88vh] sm:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <h2 className="font-serif font-bold text-lg text-white">
            {editingProduct ? 'Edit Product Card (પ્રોડક્ટમાં સુધારો)' : 'Add New Product Card (નવી પ્રોડક્ટ ઉમેરો)'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 scroll-smooth">
          {error && (
            <div className="p-3 bg-red-900/80 border border-red-700 text-red-200 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Name English */}
            <div>
              <label className="block font-bold text-slate-200 mb-1">Product Name (English) *</label>
              <input
                ref={nameInputRef}
                type="text"
                required
                placeholder="e.g. Special Masala Khakhra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            {/* Gujarati Subtitle */}
            <div>
              <label className="block font-bold text-slate-200 mb-1">Gujarati Title (ગુજરાતી નામ)</label>
              <input
                type="text"
                placeholder="e.g. સ્પેશિયલ મસાલા ખાખરા"
                value={gujaratiName}
                onChange={(e) => setGujaratiName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
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

            {/* Sale Type */}
            <div>
              <label className="block font-bold text-slate-200 mb-1">Sold By Weight or Packet? *</label>
              <select
                value={saleType}
                onChange={(e) => setSaleType(e.target.value as SaleType)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="weight">By Weight (e.g. 250g, 500g, 1kg)</option>
                <option value="packet">By Packet (e.g. 1 Packet, Pack of 3)</option>
              </select>
            </div>
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
            <div className="flex items-center gap-1.5 mt-1.5">
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

          {/* Dynamic Weight / Packet Options Editor */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-cyan-400 text-xs">
                Predefined {saleType === 'weight' ? 'Weight Options & Prices' : 'Packet Options & Prices'}
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Weight Option
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {options.map((opt, idx) => (
                <div key={opt.id || idx} className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Option Label (e.g. 250g Pack)"
                      value={opt.label}
                      onChange={(e) => handleUpdateOption(idx, 'label', e.target.value)}
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-white text-xs"
                    />
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Price ₹"
                      value={opt.price}
                      onChange={(e) => handleUpdateOption(idx, 'price', Number(e.target.value))}
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-white text-xs font-bold text-cyan-300"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Flavors & Ingredients */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-200 mb-1">Available Flavors (Comma separated)</label>
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
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
              <span className="font-bold text-slate-200">In Stock</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="font-bold text-amber-300">Highlight as Best Seller 🔥</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Product...' : 'Save Product to Store Inventory'}
          </button>
        </form>
      </div>
    </div>
  );
};
