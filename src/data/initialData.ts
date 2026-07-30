import { Product, Review } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-khakhra-1',
    name: 'Handcrafted Methi Khakhra',
    gujaratiName: 'હસ્તનિર્મિત મેથી ખાખરા',
    category: 'khakhra',
    description: 'Crispy, ultra-thin roasted wheat crispbread infused with fresh aromatic fenugreek (methi) leaves, ajwain, and authentic Gujarati spices. Roasted manually on earthen tawa.',
    gujaratiDescription: 'શુદ્ધ ઘઉં અને તાજી મેથી સાથે માટીના તવા પર શેકેલા કડક અને સ્વાદિષ્ટ ખાખરા.',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800',
    saleType: 'packet',
    options: [
      { id: 'opt-k1-1', label: '1 Packet (200g)', weightInGrams: 200, price: 75 },
      { id: 'opt-k1-2', label: 'Pack of 3 (600g)', weightInGrams: 600, price: 210 },
      { id: 'opt-k1-3', label: 'Bulk Family Pack (1 kg)', weightInGrams: 1000, price: 340 }
    ],
    flavors: ['Classic Methi', 'Masala Methi', 'Butter Methi'],
    isBestSeller: true,
    isPureGujarati: true,
    inStock: true,
    rating: 4.9,
    reviewCount: 42,
    ingredients: 'Whole Wheat Flour, Fresh Methi, Peanut Oil, Salt, Turmeric, Cumin, Red Chili'
  },
  {
    id: 'prod-khakhra-2',
    name: 'Special Masala & Jeera Khakhra',
    gujaratiName: 'મસાલા અને જીરા ખાખરા',
    category: 'khakhra',
    description: 'Crispy round wheat khakhra seasoned with hand-ground roasted cumin seeds, black salt, and tangy chaat masala. Perfect tea-time healthy crunch.',
    gujaratiDescription: 'શેકેલા જીરા અને ચટપટા મસાલા સાથે મનોહર ચહાની સાથીદાર.',
    imageUrl: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&q=80&w=800',
    saleType: 'packet',
    options: [
      { id: 'opt-k2-1', label: '1 Packet (200g)', weightInGrams: 200, price: 80 },
      { id: 'opt-k2-2', label: 'Pack of 3 (600g)', weightInGrams: 600, price: 225 },
      { id: 'opt-k2-3', label: '1 kg Box', weightInGrams: 1000, price: 360 }
    ],
    flavors: ['Masala Jeera', 'Pani Puri Special', 'Garlic Butter'],
    isBestSeller: false,
    isPureGujarati: true,
    inStock: true,
    rating: 4.8,
    reviewCount: 28,
    ingredients: 'Whole Wheat Flour, Roasted Jeera, Rock Salt, Amchur, Spices, Groundnut Oil'
  },
  {
    id: 'prod-hing-1',
    name: 'Pure Royal Bandhani Hing (Asafoetida)',
    gujaratiName: 'શુદ્ધ રોયલ બંધાણી હિંગ',
    category: 'hing',
    description: '100% Original, intense aroma Bandhani Asafoetida processed using centuries-old traditional recipes. A tiny pinch enriches Dal Fry, Kadhi, Sambhar, and Gujarati Shaak with unmatched digestive goodness.',
    gujaratiDescription: 'અસલી તીવ્ર સુગંધવાળી બંધાણી હિંગ, માત્ર એક ચપટીમાં દાળ-શાકને આપો અમૃત સ્વાદ.',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800',
    saleType: 'weight',
    options: [
      { id: 'opt-h1-1', label: '50 Grams Jar', weightInGrams: 50, price: 160 },
      { id: 'opt-h1-2', label: '100 Grams Pack', weightInGrams: 100, price: 300 },
      { id: 'opt-h1-3', label: '250 Grams Value Box', weightInGrams: 250, price: 720 },
      { id: 'opt-h1-4', label: '500 Grams Catering Pack', weightInGrams: 500, price: 1380 }
    ],
    isBestSeller: true,
    isPureGujarati: true,
    inStock: true,
    rating: 5.0,
    reviewCount: 89,
    ingredients: 'Pure Asafoetida Resin (Ferula Foetida), Edible Gum, Organic Wheat Flour'
  },
  {
    id: 'prod-hing-2',
    name: 'Raw Crystal Hing Nuggets (Khada Asafoetida)',
    gujaratiName: 'કાચુ આખું હિંગડા (ખડા હિંગ)',
    category: 'hing',
    description: 'Unprocessed natural gum resin lump asafoetida. Ground fresh at home or fried in ghee for traditional Ayurvedic tadka. Supreme purity guarantee.',
    gujaratiDescription: 'કુદરતી રાબડીમાંથી બનેલી શુદ્ધ આખી હિંગ, વઘાર માટે સર્વશ્રેષ્ઠ.',
    imageUrl: 'https://images.unsplash.com/photo-1509358217951-4ff270043167?auto=format&fit=crop&q=80&w=800',
    saleType: 'weight',
    options: [
      { id: 'opt-h2-1', label: '50g Pack', weightInGrams: 50, price: 190 },
      { id: 'opt-h2-2', label: '100g Pack', weightInGrams: 100, price: 360 },
      { id: 'opt-h2-3', label: '250g Pack', weightInGrams: 250, price: 850 }
    ],
    isBestSeller: false,
    isPureGujarati: true,
    inStock: true,
    rating: 4.9,
    reviewCount: 19,
    ingredients: '100% Pure Asafoetida Gum Crystals'
  },
  {
    id: 'prod-farshan-1',
    name: 'Surti Melt-in-Mouth Vanela Gathiya',
    gujaratiName: 'સુરતી નરમ વણેલા ગંઠિયા',
    category: 'farshan',
    description: 'Hand-rolled traditional gram flour (besan) Gathiya infused with carom seeds (ajwain) and hing tadka. Extremely soft, airy texture, fried in fresh groundnut oil.',
    gujaratiDescription: 'મોંમાં ઓગળી જાય તેવા સુરતી વણેલા ગંઠિયા - પપૈયાના સંભારા અને લીલા મરચાં સાથે ખાસ.',
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800',
    saleType: 'weight',
    options: [
      { id: 'opt-f1-1', label: '250g Pack', weightInGrams: 250, price: 110 },
      { id: 'opt-f1-2', label: '500g Pack', weightInGrams: 500, price: 210 },
      { id: 'opt-f1-3', label: '1 kg Family Pack', weightInGrams: 1000, price: 400 }
    ],
    flavors: ['Classic Surti Soft', 'Spicy Black Pepper (Tikha)'],
    isBestSeller: true,
    isPureGujarati: true,
    inStock: true,
    rating: 4.9,
    reviewCount: 64,
    ingredients: 'Pure Chana Dal Besan, Groundnut Oil, Ajwain, Black Pepper, Hing, Soda, Salt'
  },
  {
    id: 'prod-farshan-2',
    name: 'Spicy Ratlami & Tikha Lasaniya Sev',
    gujaratiName: 'રતલામી અને સ્પાઇસી લસણીયા સેવ',
    category: 'farshan',
    description: 'Crisp spicy besan noodles heavily flavored with clove, garlic, red chili, and whole black pepper. The ultimate companion for Sev Tameta Shaak, Sev Puri, or direct munching.',
    gujaratiDescription: 'લવિંગ અને મરચાંનો ચટપટો સ્વાદ - સેવ ટામેટાંના શાક માટે શ્રેષ્ઠ.',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800',
    saleType: 'weight',
    options: [
      { id: 'opt-f2-1', label: '250g Pack', weightInGrams: 250, price: 100 },
      { id: 'opt-f2-2', label: '500g Pack', weightInGrams: 500, price: 195 },
      { id: 'opt-f2-3', label: '1 kg Pack', weightInGrams: 1000, price: 380 }
    ],
    flavors: ['Ratlami Laung Sev', 'Garlic Lasan Sev', 'Fine Nylon Sev'],
    isBestSeller: false,
    isPureGujarati: true,
    inStock: true,
    rating: 4.7,
    reviewCount: 31,
    ingredients: 'Gram Flour (Besan), Garlic, Red Chili Powder, Clove, Black Pepper, Asafoetida'
  },
  {
    id: 'prod-farshan-3',
    name: 'Kathiyawadi Special Mix Chavanu (Farsan)',
    gujaratiName: 'કાઠિયાવાડી પંચરત્ન ચવાણું',
    category: 'farshan',
    description: 'Savoury mixture of roasted flattened rice (poha), crispy sev, fried sweet neem leaves, peanuts, cashews, raisins, and aromatic sweet-tangy spices.',
    gujaratiDescription: 'સીંગ, કાજુ, પૌંઆ અને સેવનું ચટપટું મિશ્રણ.',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800',
    saleType: 'weight',
    options: [
      { id: 'opt-f3-1', label: '250g Pack', weightInGrams: 250, price: 120 },
      { id: 'opt-f3-2', label: '500g Pack', weightInGrams: 500, price: 230 },
      { id: 'opt-f3-3', label: '1 kg Box', weightInGrams: 1000, price: 440 }
    ],
    isBestSeller: true,
    isPureGujarati: true,
    inStock: true,
    rating: 4.8,
    reviewCount: 52,
    ingredients: 'Gram Flour, Poha, Peanuts, Cashew, Raisins, Sesame Seeds, Curry Leaves, Spices'
  },
  {
    id: 'prod-combo-1',
    name: 'Gujarati Heritage Festival Feast Hamper',
    gujaratiName: 'ગુજરાતી હેરીટેજ ફાસ્ટ એન્ડ ફેસ્ટિવલ પેક',
    category: 'combos',
    description: 'A delight box containing 500g Vanela Gathiya, 500g Methi Khakhra (2 packets), 250g Special Mix Chavanu, and 50g Royal Bandhani Hing jar.',
    gujaratiDescription: 'તમામ લોકપ્રિય ગુજરાત વાનગીઓનું સુંદર બોક્સ.',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800',
    saleType: 'packet',
    options: [
      { id: 'opt-c1-1', label: '1 Gift Combo Box (1.4 kg total)', weightInGrams: 1400, price: 599 },
      { id: 'opt-c1-2', label: 'Twin Royal Combo Boxes (2.8 kg)', weightInGrams: 2800, price: 1120 }
    ],
    isBestSeller: true,
    isPureGujarati: true,
    inStock: true,
    rating: 5.0,
    reviewCount: 73,
    ingredients: 'Combination of fresh Gathiya, Khakhra, Chavanu, and Pure Hing'
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-hing-1',
    productName: 'Pure Royal Bandhani Hing',
    customerName: 'Kiritbhai Patel (Ahmadabad)',
    rating: 5,
    comment: 'આ હિંગ સાચે જ અદ્ભુત છે! Very strong aroma. Just a tiny pinch makes my Dal Fry and Kadhi taste like home recipe. Packaging is airtight and clean.',
    date: '2026-07-20',
    isVerifiedPurchase: true
  },
  {
    id: 'rev-2',
    productId: 'prod-khakhra-1',
    productName: 'Handcrafted Methi Khakhra',
    customerName: 'Meghna Shah (Mumbai)',
    rating: 5,
    comment: 'Super crisp, non-oily and authentic. We ordered 1kg for morning tea and everybody in my house loved it! Will reorder soon.',
    date: '2026-07-22',
    isVerifiedPurchase: true
  },
  {
    id: 'rev-3',
    productId: 'prod-farshan-1',
    productName: 'Surti Melt-in-Mouth Vanela Gathiya',
    customerName: 'Jignesh Merchant (Surat)',
    rating: 5,
    comment: 'Authentic Surti taste! Gathiya were so fresh and soft. Delivered intact without breaking.',
    date: '2026-07-25',
    isVerifiedPurchase: true
  },
  {
    id: 'rev-4',
    productId: 'prod-combo-1',
    productName: 'Gujarati Heritage Festival Feast Hamper',
    customerName: 'Priya Dave (Vadodara)',
    rating: 5,
    comment: 'Gifted this hamper to my relatives in Delhi for festival. They praised the Hing quality and the crunchiness of Khakhra!',
    date: '2026-07-28',
    isVerifiedPurchase: true
  }
];
