import React from 'react';
import { Sparkles, Flame, Award, HeartHandshake, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeroSectionProps {
  onExploreClick: () => void;
  onBulkClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick, onBulkClick }) => {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#78350F] via-[#451A03] to-[#78350F] text-[#FEF3C7] py-10 sm:py-16 px-4 sm:px-6">
      {/* Decorative Traditional Gujarati Pattern Background Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Content */}
        <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#78350F] text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            {t.heroWelcome}
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {t.heroTitle}
          </h1>

          <p className="text-[#FEF3C7]/90 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
            {t.heroDesc}
          </p>

          {/* Quick Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 max-w-lg mx-auto lg:mx-0">
            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#451A03]/80 border border-[#92400E]/60 backdrop-blur-sm">
              <Flame className="w-5 h-5 text-[#F59E0B] shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-[#FEF3C7]">{t.zeroPreservatives}</p>
                <p className="text-[10px] text-[#FDE68A]/80">{t.freshBatchDaily}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#451A03]/80 border border-[#92400E]/60 backdrop-blur-sm">
              <Award className="w-5 h-5 text-[#F59E0B] shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-[#FEF3C7]">{t.pureHingBadge}</p>
                <p className="text-[10px] text-[#FDE68A]/80">{t.royalResin}</p>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#451A03]/80 border border-[#92400E]/60 backdrop-blur-sm">
              <HeartHandshake className="w-5 h-5 text-[#F59E0B] shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-[#FEF3C7]">{t.storeDirect}</p>
                <p className="text-[10px] text-[#FDE68A]/80">{t.ownerConfirmation}</p>
              </div>
            </div>
          </div>

          {/* Call to action buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-3">
            <button
              onClick={onExploreClick}
              className="px-8 py-3.5 bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-amber-950/40 transition-all flex items-center gap-2"
            >
              {t.buyFreshBtn}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onBulkClick}
              className="px-6 py-3.5 bg-[#451A03] hover:bg-[#78350F] text-[#FEF3C7] font-medium text-sm rounded-2xl border border-[#92400E] transition-all"
            >
              {t.bulkInquiryBtn}
            </button>
          </div>
        </div>

        {/* Right Feature Showcase Box */}
        <div className="lg:col-span-5 relative">
          <div className="relative mx-auto max-w-sm lg:max-w-none rounded-[32px] p-1.5 bg-gradient-to-b from-[#F59E0B]/30 to-[#78350F]/20 backdrop-blur-md shadow-2xl border border-[#EED4A8]/30">
            <div className="relative rounded-[28px] overflow-hidden aspect-[4/3] bg-[#451A03]">
              <img
                src="https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=1000"
                alt="Gujarati Farshan & Khakhra"
                className="w-full h-full object-cover object-center opacity-90 hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#451A03] via-[#451A03]/30 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 text-left space-y-1">
                <span className="inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold bg-[#FEF3C7] text-[#78350F] rounded-full border border-[#FDE68A]">
                  {t.specialAttraction}
                </span>
                <p className="text-white font-serif font-bold text-lg">
                  {t.heroSpecialTitle}
                </p>
                <p className="text-xs text-[#FEF3C7]/90 font-light">
                  {t.heroSpecialDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

