import type { Product, Review, Coupon } from '../types.ts';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-khakhra-1',
    name: 'Handcrafted Methi Khakhra',
    gujaratiName: 'હસ્તનિર્મિત મેથી ખાખરા',
    category: 'khakhra',
    description:
      'Crispy, ultra-thin roasted wheat crispbread infused with fresh aromatic fenugreek (methi) leaves, ajwain, and authentic Gujarati spices. Roasted manually on earthen tawa.',
    gujaratiDescription:
      'શુદ્ધ ઘઉં અને તાજી મેથી સાથે માટીના તવા પર શેકેલા કડક અને સ્વાદિષ્ટ ખાખરા.',
    imageUrl:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800',
    price: 75,
    stockQuantity: 60,
    offer: {
      active: true,
      discountType: 'flat',
      discountValue: 15,
      unitLimit: 50,
      unitsSold: 12,
      badgeMode: 'left',
    },
    flavors: ['Classic Methi', 'Masala Methi', 'Butter Methi'],
    isBestSeller: true,
    isPureGujarati: true,
    inStock: true,
    rating: 4.9,
    reviewCount: 42,
    ingredients: 'Whole Wheat Flour, Fresh Methi, Peanut Oil, Salt, Turmeric, Cumin, Red Chili',
  },
  {
    id: 'prod-khakhra-2',
    name: 'Special Masala & Jeera Khakhra',
    gujaratiName: 'મસાલા અને જીરા ખાખરા',
    category: 'khakhra',
    description:
      'Crispy round wheat khakhra seasoned with hand-ground roasted cumin seeds, black salt, and tangy chaat masala. Perfect tea-time healthy crunch.',
    gujaratiDescription: 'શેકેલા જીરા અને ચટપટા મસાલા સાથે મનોહર ચહાની સાથીદાર.',
    imageUrl:
      'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&q=80&w=800',
    price: 80,
    stockQuantity: 45,
    flavors: ['Masala Jeera', 'Pani Puri Special', 'Garlic Butter'],
    isBestSeller: false,
    isPureGujarati: true,
    inStock: true,
    rating: 4.8,
    reviewCount: 28,
    ingredients: 'Whole Wheat Flour, Roasted Jeera, Rock Salt, Amchur, Spices, Groundnut Oil',
  },
  {
    id: 'prod-hing-1',
    name: 'Pure Royal Bandhani Hing (Asafoetida)',
    gujaratiName: 'શુદ્ધ રોયલ બંધાણી હિંગ',
    category: 'hing',
    description:
      '100% Original, intense aroma Bandhani Asafoetida processed using centuries-old traditional recipes. A tiny pinch enriches Dal Fry, Kadhi, Sambhar, and Gujarati Shaak with unmatched digestive goodness.',
    gujaratiDescription:
      'અસલી તીવ્ર સુગંધવાળી બંધાણી હિંગ, માત્ર એક ચપટીમાં દાળ-શાકને આપો અમૃત સ્વાદ.',
    imageUrl:
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800',
    price: 160,
    stockQuantity: 80,
    offer: {
      active: true,
      discountType: 'percentage',
      discountValue: 15,
      unitLimit: 60,
      unitsSold: 18,
      badgeMode: 'claimed',
    },
    isBestSeller: true,
    isPureGujarati: true,
    inStock: true,
    rating: 5.0,
    reviewCount: 89,
    ingredients: 'Pure Asafoetida Resin (Ferula Foetida), Edible Gum, Organic Wheat Flour',
  },
  {
    id: 'prod-hing-2',
    name: 'Raw Crystal Hing Nuggets (Khada Asafoetida)',
    gujaratiName: 'કાચુ આખું હિંગડા (ખડા હિંગ)',
    category: 'hing',
    description:
      'Unprocessed natural gum resin lump asafoetida. Ground fresh at home or fried in ghee for traditional Ayurvedic tadka. Supreme purity guarantee.',
    gujaratiDescription: 'કુદરતી રાબડીમાંથી બનેલી શુદ્ધ આખી હિંગ, વઘાર માટે સર્વશ્રેષ્ઠ.',
    imageUrl:
      'https://images.unsplash.com/photo-1509358217951-4ff270043167?auto=format&fit=crop&q=80&w=800',
    price: 190,
    stockQuantity: 35,
    isBestSeller: false,
    isPureGujarati: true,
    inStock: true,
    rating: 4.9,
    reviewCount: 19,
    ingredients: '100% Pure Asafoetida Gum Crystals',
  },
  {
    id: 'prod-combo-1',
    name: 'Jolly Jeera Khakhra',
    gujaratiName: 'ગુજરાતી હેરીટેજ ફાસ્ટ એન્ડ ફેસ્ટિવલ પેક',
    category: 'khakhra',
    description: 'Crispy handcrafted Jeera Khakhra roasted with aromatic cumin seeds.',
    gujaratiDescription: 'તમામ લોકપ્રિય ગુજરાત વાનગીઓનું સુંદર બોક્સ.',
    imageUrl: 'https://m.media-amazon.com/images/I/911Jb1CKUnL.jpg',
    price: 100,
    stockQuantity: 50,
    isBestSeller: true,
    isPureGujarati: true,
    inStock: true,
    rating: 5.0,
    reviewCount: 73,
    ingredients: 'Whole Wheat Flour, Cumin Seeds, Groundnut Oil, Spices',
  },
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-welcome100',
    code: 'WELCOME100',
    discountType: 'flat',
    discountValue: 100,
    minCartValue: 499,
    maxUses: 20,
    usedCount: 0,
    isActive: true,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'coup-first10',
    code: 'FIRST10',
    discountType: 'percentage',
    discountValue: 10,
    minCartValue: 250,
    maxUses: 10,
    usedCount: 0,
    isActive: true,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-hing-1',
    productName: 'Pure Royal Bandhani Hing',
    customerName: 'Kiritbhai Patel (Ahmadabad)',
    rating: 5,
    comment:
      'આ હિંગ સાચે જ અદ્ભુત છે! Very strong aroma. Just a tiny pinch makes my Dal Fry and Kadhi taste like home recipe. Packaging is airtight and clean.',
    date: '2026-07-20',
    isVerifiedPurchase: true,
  },
  {
    id: 'rev-2',
    productId: 'prod-khakhra-1',
    productName: 'Handcrafted Methi Khakhra',
    customerName: 'Meghna Shah (Mumbai)',
    rating: 5,
    comment:
      'Super crisp, non-oily and authentic. We ordered for morning tea and everybody in my house loved it! Will reorder soon.',
    date: '2026-07-22',
    isVerifiedPurchase: true,
  },
  {
    id: 'rev-3',
    productId: 'prod-farshan-1',
    productName: 'Surti Melt-in-Mouth Vanela Gathiya',
    customerName: 'Jignesh Merchant (Surat)',
    rating: 5,
    comment:
      'Authentic Surti taste! Gathiya were so fresh and soft. Delivered intact without breaking.',
    date: '2026-07-25',
    isVerifiedPurchase: true,
  },
  {
    id: 'rev-4',
    productId: 'prod-combo-1',
    productName: 'Gujarati Heritage Festival Feast Hamper',
    customerName: 'Priya Dave (Vadodara)',
    rating: 5,
    comment:
      'Gifted this hamper to my relatives in Delhi for festival. They praised the Hing quality and the crunchiness of Khakhra!',
    date: '2026-07-28',
    isVerifiedPurchase: true,
  },
];
