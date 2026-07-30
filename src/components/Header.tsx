import React from 'react';
import { ShoppingBag, Search, ShieldCheck, Truck, PhoneCall, LayoutDashboard, Clock, Globe } from 'lucide-react';
import { useLanguage, Language } from '../context/LanguageContext';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenTrackOrder: () => void;
  onOpenBulkOrder: () => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentView: 'shop' | 'admin';
  onToggleAdmin: (view: 'shop' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onOpenTrackOrder,
  onOpenBulkOrder,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  currentView,
  onToggleAdmin,
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EED4A8] shadow-xs">
      {/* Top Banner */}
      <div className="bg-[#78350F] text-[#FEF3C7] px-4 py-1.5 text-xs font-medium flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 mx-auto md:mx-0">
          <span className="flex items-center gap-1.5 text-[#FDE68A]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
            {t.pureHingAndKhakhra}
          </span>
          <span className="hidden md:inline text-[#F59E0B]">•</span>
          <span className="hidden md:flex items-center gap-1 text-[#FEF3C7]">
            <Truck className="w-3.5 h-3.5 text-[#F59E0B]" /> {t.freeShipping}
          </span>
          <span className="hidden lg:inline text-[#F59E0B]">•</span>
          <span className="hidden lg:inline text-[#FDE68A] font-serif italic">
            {t.swaadTagline}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs mx-auto md:mx-0">
          {/* Language Switcher Button Bar */}
          <div className="flex items-center gap-1 bg-[#451A03]/80 p-0.5 rounded-full border border-[#92400E]">
            <Globe className="w-3.5 h-3.5 text-[#F59E0B] ml-1.5 shrink-0" />
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                language === 'en'
                  ? 'bg-[#F59E0B] text-[#451A03] shadow-xs'
                  : 'text-[#FEF3C7] hover:text-white'
              }`}
              title="Convert to English"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('gu')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                language === 'gu'
                  ? 'bg-[#F59E0B] text-[#451A03] shadow-xs'
                  : 'text-[#FEF3C7] hover:text-white'
              }`}
              title="Convert to Gujarati"
            >
              ગુજરાતી
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                language === 'hi'
                  ? 'bg-[#F59E0B] text-[#451A03] shadow-xs'
                  : 'text-[#FEF3C7] hover:text-white'
              }`}
              title="Convert to Hindi"
            >
              हिंदी
            </button>
          </div>

          <button 
            onClick={onOpenTrackOrder} 
            className="flex items-center gap-1 text-[#FDE68A] hover:text-white transition-colors bg-[#451A03]/60 px-2.5 py-0.5 rounded-full border border-[#92400E]/50"
          >
            <Clock className="w-3 h-3 text-[#F59E0B]" />
            {t.trackOrderStatus}
          </button>
          
          <button
            onClick={() => onToggleAdmin(currentView === 'admin' ? 'shop' : 'admin')}
            className="flex items-center gap-1 text-[10px] text-[#FEF3C7]/40 hover:text-white transition-all opacity-40 hover:opacity-100 ml-1"
            title="Store Admin Login"
          >
            <LayoutDashboard className="w-2.5 h-2.5" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* Main Nav Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onToggleAdmin('shop')}>
          <div className="w-10 h-10 bg-[#D97706] rounded-full flex items-center justify-center text-white font-serif italic text-xl shadow-sm">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold italic text-[#78350F] tracking-tight leading-none">
                Swaad Gujarat Nu <span className="text-[#D97706] font-normal text-sm not-italic">(Giriraj)</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-[#FEF3C7] text-[#78350F] rounded-full border border-[#FDE68A]">
                {t.authenticBadge}
              </span>
            </div>
            <p className="text-xs text-[#92400E] font-medium tracking-wide mt-0.5">
              {t.brandTagline}
            </p>
          </div>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D97706]" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#FEFBF2] border border-[#EED4A8] rounded-full focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all text-[#451A03] placeholder-[#92400E]/50"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenBulkOrder}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#78350F] bg-[#FEF3C7] hover:bg-[#FDE68A] rounded-xl transition-colors border border-[#EED4A8]"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#D97706]" />
            {t.bulkOrderBtn}
          </button>

          <button
            onClick={onOpenTrackOrder}
            className="flex sm:hidden items-center justify-center p-2 text-[#78350F] hover:bg-[#FEF3C7] rounded-xl border border-[#EED4A8]"
            title={t.trackOrderStatus}
          >
            <Clock className="w-5 h-5 text-[#D97706]" />
          </button>

          {/* Cart Icon Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-4 py-2 bg-[#B45309] hover:bg-[#92400E] text-white rounded-full shadow-md shadow-amber-900/10 transition-all font-medium text-sm active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline font-semibold">🛒 {t.cartBtn}</span>
            {cartCount > 0 ? (
              <span className="bg-[#FEF3C7] text-[#78350F] text-xs font-bold px-2 py-0.5 rounded-full border border-[#FDE68A]">
                {cartCount} {t.itemsInCart}
              </span>
            ) : (
              <span className="hidden md:inline text-xs opacity-80">• {t.emptyCart}</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Input */}
      <div className="px-4 pb-2.5 md:hidden">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D97706]" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#FEFBF2] border border-[#EED4A8] rounded-xl text-[#451A03] placeholder-[#92400E]/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Category Pills Bar (Shop mode only) */}
      {currentView === 'shop' && (
        <div className="border-t border-[#EED4A8] bg-[#FFFDF9] px-4 py-2 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap">
            {[
              { id: 'all', label: t.catAll },
              { id: 'khakhra', label: t.catKhakhra },
              { id: 'hing', label: t.catHing },
              { id: 'farshan', label: t.catFarshan },
              { id: 'combos', label: t.catCombos },
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#FEF3C7] border border-[#FDE68A] text-[#78350F] font-bold shadow-xs'
                      : 'bg-white text-[#92400E] border border-[#EED4A8] hover:bg-[#FEF3C7]/60'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

