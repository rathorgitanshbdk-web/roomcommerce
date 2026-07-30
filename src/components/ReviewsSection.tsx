import React, { useEffect, useState } from 'react';
import { Review } from '../types';
import { Star, CheckCircle2, HeartHandshake } from 'lucide-react';
import { fetchReviews } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const ReviewsSection: React.FC = () => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews()
      .then((data) => setReviews(data))
      .catch((err) => console.error('Error fetching reviews:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-12 bg-[#FEFBF2] border-t border-[#EED4A8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FEF3C7] text-[#78350F] text-xs font-bold uppercase tracking-wider border border-[#FDE68A]">
            <HeartHandshake className="w-3.5 h-3.5 text-[#D97706]" />
            {t.customerReviews}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#451A03]">
            Loved by 10,000+ Families Across Gujarat & India
          </h2>
          <p className="text-xs sm:text-sm text-[#78350F]">
            Hear what our happy foodies say about our fresh crunchy Khakhra, melt-in-mouth Gathiya, and aromatic Royal Bandhani Hing.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-xs text-[#92400E]">Loading reviews...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reviews.slice(0, 8).map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-2xl border border-[#EED4A8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex text-[#D97706]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-[#D97706] text-[#D97706]' : 'text-stone-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#92400E] font-medium">{rev.date}</span>
                  </div>

                  <p className="text-xs text-[#451A03] font-serif leading-relaxed italic relative">
                    &quot;{rev.comment}&quot;
                  </p>
                </div>

                <div className="pt-2 border-t border-[#EED4A8] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#451A03] block">{rev.customerName}</span>
                    <span className="text-[10px] text-[#78350F]">{rev.productName}</span>
                  </div>
                  {rev.isVerifiedPurchase && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" title="Verified Buyer" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

