import React from 'react';
import { ShieldCheck, Phone, MapPin, Mail, LayoutDashboard, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onOpenTrackOrder: () => void;
  onOpenBulkOrder: () => void;
  onToggleAdmin: (view: 'shop' | 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenTrackOrder,
  onOpenBulkOrder,
  onToggleAdmin,
}) => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#451A03] text-[#FEF3C7] text-xs border-t border-[#78350F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#D97706] flex items-center justify-center text-white font-serif font-bold text-xl">
              ગિ
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Giriraj Farshan</h3>
              <p className="text-[11px] text-[#FDE68A]">{t.tagline}</p>
            </div>
          </div>
          <p className="text-[#FEF3C7]/80 leading-relaxed font-light text-[11px]">
            Authentic Gujarati snacks, handcrafted crispy Khakhra, and 100% pure Royal Bandhani Hing. Delivered fresh with owner confirmation!
          </p>
          <div className="flex items-center gap-1.5 text-[#FDE68A] font-medium">
            <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
            100% Quality & Hygiene Guaranteed
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-2">
          <h4 className="font-serif font-bold text-white text-sm">Quick Links & Services</h4>
          <ul className="space-y-1.5 text-[#FEF3C7]/90">
            <li>
              <button onClick={onOpenTrackOrder} className="hover:text-amber-300 transition-colors flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#F59E0B]" /> {t.trackOrderBtn}
              </button>
            </li>
            <li>
              <button onClick={onOpenBulkOrder} className="hover:text-amber-300 transition-colors">
                {t.bulkOrdersNav}
              </button>
            </li>
            <li>
              <a href="#products-grid" className="hover:text-amber-300 transition-colors">
                Handcrafted Methi & Masala Khakhra
              </a>
            </li>
            <li>
              <a href="#products-grid" className="hover:text-amber-300 transition-colors">
                Pure Bandhani Hing Jars (50g - 500g)
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Information */}
        <div className="space-y-2">
          <h4 className="font-serif font-bold text-white text-sm">Store Location & Hours</h4>
          <div className="space-y-1.5 text-[#FEF3C7]/90 text-[11px]">
            <div className="flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <span>
                Giriraj Farshan & Hing Bhavan, Opposite Town Hall, Kalupur / Ring Road, Gujarat 380001
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
              <span>Customer Helpline: +91 98250 12345 / 079-22145890</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
              <span>Orders Email: orders@girirajfarshan.com</span>
            </div>
          </div>
        </div>

        {/* Quality Guarantee Section */}
        <div className="space-y-3 bg-[#78350F]/40 p-4 rounded-2xl border border-[#92400E]/60">
          <h4 className="font-serif font-bold text-white text-sm flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
            100% Pure & Fresh Guarantee
          </h4>
          <p className="text-[11px] text-[#FEF3C7]/80 leading-relaxed">
            All our Khakhra, Bandhani Hing, and Farshan items are prepared fresh daily using 100% pure groundnut oil and traditional spices.
          </p>
          <div className="pt-1 text-[11px] text-[#FDE68A] font-medium flex items-center gap-1">
            <span>✨ Pure Vegetarian • Fresh Vacuum Packed</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#78350F] bg-[#321302] py-3 text-center text-[10px] text-[#FDE68A]/80 flex items-center justify-center gap-2">
        <span>© 2026 Giriraj Farshan & Bandhani Hing Store. All rights reserved. • આભાર - આવજો!</span>
        <button
          onClick={() => onToggleAdmin('admin')}
          className="text-[#FEF3C7]/20 hover:text-[#FEF3C7]/60 transition-colors text-[9px] font-mono ml-2 opacity-30 hover:opacity-100"
          title="Admin Login"
        >
          🔒 Admin
        </button>
      </div>
    </footer>
  );
};

