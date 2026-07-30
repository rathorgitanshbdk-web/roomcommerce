import React, { useState } from 'react';
import { PhoneCall, CheckCircle2, Sparkles, Building, PackageCheck, Send } from 'lucide-react';
import { submitBulkInquiry } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const BulkOrderSection: React.FC = () => {
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessOrEvent, setBusinessOrEvent] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [expectedQuantity, setExpectedQuantity] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['Handcrafted Methi Khakhra']);
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const productOptions = [
    'Handcrafted Methi Khakhra',
    'Special Masala & Jeera Khakhra',
    'Pure Royal Bandhani Hing',
    'Surti Vanela Gathiya',
    'Ratlami & Tikha Sev',
    'Kathiyawadi Mix Chavanu',
    'Custom Gift Hamper Boxes'
  ];

  const toggleProduct = (prod: string) => {
    if (selectedProducts.includes(prod)) {
      setSelectedProducts(selectedProducts.filter((p) => p !== prod));
    } else {
      setSelectedProducts([...selectedProducts, prod]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !expectedQuantity.trim()) {
      setErrorMsg('Please enter your Name, Mobile Phone Number, and Expected Quantity.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      await submitBulkInquiry({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        businessOrEvent: businessOrEvent.trim() || 'General Bulk Inquiry',
        eventDate,
        expectedQuantity: expectedQuantity.trim(),
        productsInterested: selectedProducts,
        message: message.trim()
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting bulk inquiry:', err);
      setErrorMsg('Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="bulk-orders" className="py-12 bg-[#78350F] text-[#FEF3C7] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Feature Description */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#78350F] text-xs font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              {t.bulkInquiryTitle}
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Weddings, Navratri Festival & Corporate Bulk Orders
            </h2>

            <p className="text-[#FEF3C7]/90 text-xs sm:text-sm leading-relaxed font-light">
              We offer discounted wholesale prices, custom branded vacuum packaging, and fresh batch preparation for marriages, corporate hampers, export consignments, and festival gifting across India.
            </p>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#451A03] border border-[#92400E]">
                <PackageCheck className="w-5 h-5 text-[#F59E0B] shrink-0" />
                <div>
                  <span className="font-bold text-white block">Airtight Vacuum Packing</span>
                  <span className="text-[#FDE68A]/80 text-[11px]">Ensures 6-month shelf freshness during transit</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#451A03] border border-[#92400E]">
                <Building className="w-5 h-5 text-[#F59E0B] shrink-0" />
                <div>
                  <span className="font-bold text-white block">Custom Weight Packages (5 kg to 500 kg+)</span>
                  <span className="text-[#FDE68A]/80 text-[11px]">Special catering packs for Halwai & Event Caterers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-7">
            <div className="bg-[#451A03] border border-[#92400E] rounded-3xl p-6 shadow-2xl backdrop-blur-md">
              <h3 className="font-serif font-bold text-xl text-white mb-1 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-[#F59E0B]" />
                {t.bulkInquiryTitle}
              </h3>
              <p className="text-xs text-[#FEF3C7]/80 mb-4">
                Fill in details below. Our store manager will contact you within 2 hours with discounted pricing.
              </p>

              {submitted ? (
                <div className="p-6 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                  <h4 className="font-serif font-bold text-lg text-white">Bulk Inquiry Received!</h4>
                  <p className="text-xs text-emerald-200/90 max-w-md mx-auto">
                    Thank you! The Giriraj Farshan bulk team has received your inquiry. We will phone you shortly at <strong className="text-white">{phone}</strong> with wholesale rates.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-4 py-2 bg-[#F59E0B] text-[#451A03] font-bold text-xs rounded-xl hover:bg-[#D97706] transition-colors"
                  >
                    Send Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                  {errorMsg && (
                    <div className="p-2.5 bg-red-900/80 text-red-200 border border-red-700 rounded-xl">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#FEF3C7] mb-1">{t.fullName} *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bharatbhai Shah"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2.5 bg-[#78350F] border border-[#92400E] rounded-xl text-white placeholder-[#FEF3C7]/50 focus:ring-2 focus:ring-amber-200 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#FEF3C7] mb-1">{t.phone} *</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-2.5 bg-[#78350F] border border-[#92400E] rounded-xl text-white placeholder-[#FEF3C7]/50 focus:ring-2 focus:ring-amber-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#FEF3C7] mb-1">Business / Event Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Royal Wedding / Garba Night"
                        value={businessOrEvent}
                        onChange={(e) => setBusinessOrEvent(e.target.value)}
                        className="w-full p-2.5 bg-[#78350F] border border-[#92400E] rounded-xl text-white placeholder-[#FEF3C7]/50 focus:ring-2 focus:ring-amber-200 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#FEF3C7] mb-1">Approximate Quantity Required *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 25 kg Gathiya + 50 kg Khakhra"
                        value={expectedQuantity}
                        onChange={(e) => setExpectedQuantity(e.target.value)}
                        className="w-full p-2.5 bg-[#78350F] border border-[#92400E] rounded-xl text-white placeholder-[#FEF3C7]/50 focus:ring-2 focus:ring-amber-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Select Products of Interest */}
                  <div>
                    <label className="block font-semibold text-[#FEF3C7] mb-1.5">
                      Select Products Needed for Bulk:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {productOptions.map((prod) => {
                        const isSelected = selectedProducts.includes(prod);
                        return (
                          <button
                            key={prod}
                            type="button"
                            onClick={() => toggleProduct(prod)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                              isSelected
                                ? 'bg-[#FEF3C7] text-[#78350F]'
                                : 'bg-[#78350F] text-[#FEF3C7] border border-[#92400E] hover:bg-[#B45309]'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {prod}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#FEF3C7] mb-1">Additional Requirements / Customization</label>
                    <textarea
                      rows={2}
                      placeholder="Special spice level, delivery location, custom gift box packing..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full p-2.5 bg-[#78350F] border border-[#92400E] rounded-xl text-white placeholder-[#FEF3C7]/50 focus:ring-2 focus:ring-amber-200 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Submitting Wholesale Inquiry...' : 'Submit Bulk Inquiry'}
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

