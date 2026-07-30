import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'gu' | 'hi';

export interface Translations {
  // Top Banner & Header
  pureHingAndKhakhra: string;
  freeShipping: string;
  swaadTagline: string;
  trackOrderStatus: string;
  adminPanel: string;
  backToStorefront: string;
  searchPlaceholder: string;
  bulkOrderBtn: string;
  cartBtn: string;
  emptyCart: string;
  itemsInCart: string;
  authenticBadge: string;
  brandTagline: string;

  // Categories
  catAll: string;
  catKhakhra: string;
  catHing: string;
  catFarshan: string;
  catCombos: string;

  // Hero Section
  heroWelcome: string;
  heroTitle: string;
  heroDesc: string;
  zeroPreservatives: string;
  freshBatchDaily: string;
  pureHingBadge: string;
  royalResin: string;
  storeDirect: string;
  ownerConfirmation: string;
  buyFreshBtn: string;
  bulkInquiryBtn: string;
  specialAttraction: string;
  heroSpecialTitle: string;
  heroSpecialDesc: string;

  // Main Grid & Card
  showingItems: string;
  selectWeightTitle: string;
  noMatchTitle: string;
  noMatchDesc: string;
  resetFilters: string;
  addToCart: string;
  addedToCart: string;
  viewDetails: string;
  chooseWeight: string;
  ingredientsLabel: string;
  customerReviews: string;
  flavorLabel: string;

  // Cart & Checkout
  cartTitle: string;
  totalPayable: string;
  proceedToCheckout: string;
  checkoutTitle: string;
  customerDetails: string;
  fullName: string;
  mobileNumber: string;
  address: string;
  city: string;
  pincode: string;
  confirmOrderBtn: string;
  placingOrder: string;

  // Order Status Modal
  awaitingConfirmation: string;
  awaitingDesc: string;
  checkStatusBtn: string;
  closeBtn: string;
  searchOrderPlaceholder: string;
  findOrderBtn: string;

  // Bulk Order Section
  bulkSectionTag: string;
  bulkSectionTitle: string;
  bulkSectionDesc: string;
  requestQuoteTitle: string;
  yourName: string;
  eventOrBusiness: string;
  quantityRequired: string;
  submitInquiryBtn: string;

  // Footer
  footerTagline: string;
  quickLinks: string;
  storeLocation: string;
  rightsReserved: string;
}

const translations: Record<Language, Translations> = {
  en: {
    pureHingAndKhakhra: "100% Pure Bandhani Hing & Handmade Khakhra",
    freeShipping: "Free Shipping Above ₹499",
    swaadTagline: "Authentic Gujarati Taste • Quality Assured",
    trackOrderStatus: "Track Order Status",
    adminPanel: "Admin Panel",
    backToStorefront: "← Back to Storefront",
    searchPlaceholder: "Search Khakhra, Bandhani Hing, Gathiya, Sev...",
    bulkOrderBtn: "Bulk Orders",
    cartBtn: "Cart",
    emptyCart: "Empty",
    itemsInCart: "items",
    authenticBadge: "100% Authentic",
    brandTagline: "Crispy, Sweet & Spicy Snacks & Pure Hing",

    catAll: "All Items",
    catKhakhra: "Khakhra",
    catHing: "Bandhani Hing",
    catFarshan: "Farshan & Sev",
    catCombos: "Festive Gift Packs",

    heroWelcome: "Welcome • Swaad Gujarat Nu",
    heroTitle: "Handcrafted Khakhra, Pure Bandhani Hing & Authentic Farshan",
    heroDesc: "Made with 100% pure besan, fresh groundnut oil, aromatic ajwain, and hand-ground spices. Select your desired weight (250g, 500g, 1kg) or packets & flavors. Order now without advance online payment!",
    zeroPreservatives: "Zero Preservatives",
    freshBatchDaily: "Fresh batch daily",
    pureHingBadge: "100% Pure Hing",
    royalResin: "Royal Bandhani resin",
    storeDirect: "Store Direct",
    ownerConfirmation: "Owner confirmation",
    buyFreshBtn: "Buy Fresh Farshan & Hing",
    bulkInquiryBtn: "Bulk & Wholesale Orders",
    specialAttraction: "Special Attraction",
    heroSpecialTitle: "Surti Vanela Gathiya & Strong Bandhani Hing",
    heroSpecialDesc: "Freshly ground and handmade with age-old family recipes.",

    showingItems: "Showing authentic Gujarati delicacies",
    selectWeightTitle: "Select Weight & Flavors to Buy Fresh",
    noMatchTitle: "No items match your search",
    noMatchDesc: "Try searching for 'Khakhra', 'Bandhani Hing', 'Gathiya' or clear filter settings.",
    resetFilters: "Reset Filters",
    addToCart: "Add to Cart",
    addedToCart: "Added",
    viewDetails: "View Details",
    chooseWeight: "Choose Weight / Pack:",
    ingredientsLabel: "Ingredients:",
    customerReviews: "Customer Reviews",
    flavorLabel: "Flavor:",

    cartTitle: "Your Shopping Cart",
    totalPayable: "Total Payable Amount",
    proceedToCheckout: "Proceed to Checkout",
    checkoutTitle: "Checkout & Delivery Address",
    customerDetails: "Customer & Shipping Details",
    fullName: "Your Full Name *",
    mobileNumber: "Mobile Phone Number *",
    address: "Delivery Street Address *",
    city: "City / Town *",
    pincode: "PIN Code *",
    confirmOrderBtn: "Confirm & Submit Order",
    placingOrder: "Submitting Order...",

    awaitingConfirmation: "Awaiting Store Confirmation:",
    awaitingDesc: "Your order is safely registered in our system! The owner of Giriraj Farshan will review item stock and click 'Confirm Order'. No online payment is required right now.",
    checkStatusBtn: "Check Owner Confirmation Status",
    closeBtn: "Close & Keep Browsing",
    searchOrderPlaceholder: "Enter Mobile Number or Order ID...",
    findOrderBtn: "Find Order",

    bulkSectionTag: "Bulk Orders & Wedding Catering",
    bulkSectionTitle: "Weddings, Navratri Festival & Corporate Bulk Orders",
    bulkSectionDesc: "We offer discounted wholesale prices, custom vacuum packaging, and fresh batch preparation across India.",
    requestQuoteTitle: "Request Wholesale Quote",
    yourName: "Your Name *",
    eventOrBusiness: "Business / Event Name",
    quantityRequired: "Approx. Quantity Required *",
    submitInquiryBtn: "Submit Bulk Inquiry",

    footerTagline: "Authentic Gujarati snacks, handcrafted crispy Khakhra, and 100% pure Royal Bandhani Hing.",
    quickLinks: "Quick Links & Services",
    storeLocation: "Store Location & Hours",
    rightsReserved: "All rights reserved. Thank you!"
  },
  gu: {
    pureHingAndKhakhra: "૧૦૦% શુદ્ધ બાંધણી હીંગ અને હસ્તનિર્મિત ખાખરા",
    freeShipping: "₹૪૯૯ ઉપર ફ્રી શિપિંગ",
    swaadTagline: "અસલી ગુર્જર સ્વાદ • શુદ્ધતાની ખાતરી",
    trackOrderStatus: "ઓર્ડર સ્ટેટસ ટ્રેક કરો",
    adminPanel: "એડમિન પેનલ",
    backToStorefront: "← સ્ટોર પર પાછા જાઓ",
    searchPlaceholder: "શોધો ખાખરા, બાંધણી હીંગ, ગાંઠિયા, સેવ...",
    bulkOrderBtn: "જથ્થાબંધ ઓર્ડર",
    cartBtn: "કાર્ટ",
    emptyCart: "ખાલી",
    itemsInCart: "આઇટમ્સ",
    authenticBadge: "૧૦૦% અસલી",
    brandTagline: "ખારા, ગળ્યા ને ચટપટા ફરસાણ & શુદ્ધ હિંગ",

    catAll: "બધી વાનગીઓ",
    catKhakhra: "ખાખરા",
    catHing: "બાંધણી હીંગ",
    catFarshan: "ફરસાણ અને સેવ",
    catCombos: "ગિફ્ટ પેક",

    heroWelcome: "સ્વાગતમ્ • Swaad Gujarat Nu",
    heroTitle: "હસ્તનિર્મિત ખાખરા, શુદ્ધ બાંધણી હીંગ અને અસલી ફરસાણ",
    heroDesc: "૧૦૦% શુદ્ધ બેસન, મગફળી તેલ અને પૌરાણિક રેસિપીથી તાજા બનાવવામાં આવે છે. તમારી પસંદગી મુજબ વજન (૨૫૦ગ્રા, ૫૦૦ગ્રા, ૧કિલો) પસંદ કરો. કોઈ ઓનલાઇન એડવાન્સ પેમેન્ટ વગર ઓર્ડર કરો!",
    zeroPreservatives: "ઝીરો પ્રિઝર્વેટિવ્સ",
    freshBatchDaily: "રોજ તાજી બનાવટ",
    pureHingBadge: "૧૦૦% શુદ્ધ હીંગ",
    royalResin: "રાયલ બાંધણી હીંગ",
    storeDirect: "સ્ટોર ડાયરેક્ટ",
    ownerConfirmation: "માલિક કન્ફર્મેશન",
    buyFreshBtn: "તાજી વાનગીઓ ખરીદો",
    bulkInquiryBtn: "જથ્થાબંધ ઓર્ડર પૂછપરછ",
    specialAttraction: "ખાસ આકર્ષણ",
    heroSpecialTitle: "સુરતી વણેલા ગાંઠિયા & તીવ્ર બંધાણી હીંગ",
    heroSpecialDesc: "પરંપરાગત રીતે હાથેથી વણેલા અને તાજા મસાલાથી સજ્જ.",

    showingItems: "અસલી ગુજરાતી ફરસાણ વાનગીઓ",
    selectWeightTitle: "તાજી વાનગીઓ ખરીદવા વજન અને સ્વાદ પસંદ કરો",
    noMatchTitle: "કોઈ વાનગી મળી નથી",
    noMatchDesc: "'ખાખરા', 'બાંધણી હીંગ' અથવા 'ગાંઠિયા' શોધી જુઓ.",
    resetFilters: "ફિલ્ટર રીસેટ કરો",
    addToCart: "કાર્ટમાં ઉમેરો",
    addedToCart: "ઉમેરાઈ ગયું",
    viewDetails: "વિગત જુઓ",
    chooseWeight: "વજન / પેક પસંદ કરો:",
    ingredientsLabel: "વાનગીના ઘટકો:",
    customerReviews: "ગ્રાહકોના અભિપ્રાય",
    flavorLabel: "સ્વાદ (ફ્લેવર):",

    cartTitle: "તમારું શોપિંગ કાર્ટ",
    totalPayable: "કુલ ચૂકવવાપાત્ર રકમ",
    proceedToCheckout: "ચેકઆઉટ કરો",
    checkoutTitle: "ચેકઆઉટ અને ડિલિવરી સરનામું",
    customerDetails: "ગ્રાહક અને સરનામા વિગત",
    fullName: "તમારું પૂરું નામ *",
    mobileNumber: "મોબાઈલ નંબર *",
    address: "ડિલિવરી સરનામું *",
    city: "શહેર *",
    pincode: "પિનકોડ *",
    confirmOrderBtn: "ઓર્ડર કન્ફર્મ કરો",
    placingOrder: "ઓર્ડર મોકલાઈ રહ્યો છે...",

    awaitingConfirmation: "દુકાનદાર કન્ફર્મેશન બાકી:",
    awaitingDesc: "તમારો ઓર્ડર રજિસ્ટર થઈ ગયો છે! ગિરીરાજ ફરસાણના માલિક સ્ટોક ચકાસીને 'ઓર્ડર કન્ફર્મ' કરશે. અત્યારે કોઈ ઓનલાઇન પેમેન્ટ કરવાની જરૂર નથી.",
    checkStatusBtn: "કન્ફર્મેશન સ્ટેટસ ચકાસો",
    closeBtn: "બંધ કરો અને ખરીદી ચાલુ રાખો",
    searchOrderPlaceholder: "મોબાઈલ નંબર અથવા ઓર્ડર આઈડી ઉમેરો...",
    findOrderBtn: "ઓર્ડર શોધો",

    bulkSectionTag: "જથ્થાબંધ ઓર્ડર & લગ્ન પ્રસંગ કેટરિંગ",
    bulkSectionTitle: "લગ્ન પ્રસંગ, નવરાત્રિ અને જથ્થાબંધ ઓર્ડર",
    bulkSectionDesc: "અમે જથ્થાબંધ હોલસેલ ભાવે, સ્પેશિયલ વેક્યુમ પેકિંગ સાથે ભારતભરમાં સપ્લાય કરીએ છીએ.",
    requestQuoteTitle: "જથ્થાબંધ ક્વોટેશન મેળવો",
    yourName: "તમારું નામ *",
    eventOrBusiness: "બિઝનેસ અથવા પ્રસંગનું નામ",
    quantityRequired: "અંદાજિત જથ્થો (કિલો) *",
    submitInquiryBtn: "ઈન્ક્વાયરી મોકલો",

    footerTagline: "પરંપરાગત ગુજરાતી ફરસાણ, ક્રિસ્પી ખાખરા અને ૧૦૦% શુદ્ધ રાયલ બાંધણી હીંગ.",
    quickLinks: "ઝડપી લિંક્સ",
    storeLocation: "દુકાન સરનામું & સમય",
    rightsReserved: "સર્વ હક સ્વાધીન. આભાર - આવજો!"
  },
  hi: {
    pureHingAndKhakhra: "100% शुद्ध बांधणी हींग एवं हस्तनिर्मित खाखरा",
    freeShipping: "₹499 से ऊपर मुफ्त डिलीवरी",
    swaadTagline: "असली गुजराती स्वाद • शुद्धता का भरोसा",
    trackOrderStatus: "ऑर्डर स्टेटस ट्रैक करें",
    adminPanel: "एडमिन पैनल",
    backToStorefront: "← दुकान पर लौटें",
    searchPlaceholder: "खोजें खाखरा, बांधणी हींग, गांठिया, सेव...",
    bulkOrderBtn: "थोक ऑर्डर",
    cartBtn: "कार्ट",
    emptyCart: "खाली",
    itemsInCart: "सामान",
    authenticBadge: "100% प्रामाणिक",
    brandTagline: "नमकीन, मीठे व चटपटे फरसाण और शुद्ध हींग",

    catAll: "सभी व्यंजन",
    catKhakhra: "खाखरा",
    catHing: "बांधणी हींग",
    catFarshan: "फरसाण एवं सेव",
    catCombos: "गिफ़्ट पैक्स",

    heroWelcome: "स्वागतम् • Swaad Gujarat Nu",
    heroTitle: "ताज़ा हस्तनिर्मित खाखरा, शुद्ध बांधणी हींग और असली फरसाण",
    heroDesc: "100% शुद्ध बेसन, मूंगफली तेल और पारंपरिक मसालों से निर्मित। अपनी पसंद का वज़न (250g, 500g, 1kg) और फ्लेवर चुनें। बिना किसी एडवांस ऑनलाइन पेमेंट के ऑर्डर करें!",
    zeroPreservatives: "बिना मिलावट",
    freshBatchDaily: "रोज़ ताज़ा निर्माण",
    pureHingBadge: "100% शुद्ध हींग",
    royalResin: "रॉयल बांधणी हींग",
    storeDirect: "स्टोर डायरेक्ट",
    ownerConfirmation: "स्टोर मालिक द्वारा पुष्टि",
    buyFreshBtn: "ताज़ा फरसाण व हींग खरीदें",
    bulkInquiryBtn: "थोक व शादी के ऑर्डर",
    specialAttraction: "विशेष आकर्षण",
    heroSpecialTitle: "सूरीती वणेला गांठिया और कड़क बांधणी हींग",
    heroSpecialDesc: "पारंपरिक तरीके से हाथों से तैयार और सुगंधित मसालों से भरपूर।",

    showingItems: "असली गुजराती फरसाण उत्पाद",
    selectWeightTitle: "ताज़ा व्यंजन खरीदने हेतु वज़न व फ्लेवर चुनें",
    noMatchTitle: "कोई व्यंजन नहीं मिला",
    noMatchDesc: "'खाखरा', 'बांधणी हींग' या 'गांठिया' खोजकर देखें।",
    resetFilters: "फ़िल्टर रीसेट करें",
    addToCart: "कार्ट में जोड़ें",
    addedToCart: "जोड़ दिया गया",
    viewDetails: "विवरण देखें",
    chooseWeight: "वज़न / पैक चुनें:",
    ingredientsLabel: "सामग्री:",
    customerReviews: "ग्राहकों की समीक्षाएं",
    flavorLabel: "फ्लेवर:",

    cartTitle: "आपकी शॉपिंग कार्ट",
    totalPayable: "कुल देय राशि",
    proceedToCheckout: "चेकआउट करें",
    checkoutTitle: "चेकआउट एवं डिलीवरी का पता",
    customerDetails: "ग्राहक एवं डिलीवरी विवरण",
    fullName: "आपका पूरा नाम *",
    mobileNumber: "मोबाइल नंबर *",
    address: "डिलीवरी का पता *",
    city: "शहर *",
    pincode: "पिनकोड *",
    confirmOrderBtn: "ऑर्डर कन्फ़र्म करें",
    placingOrder: "ऑर्डर भेजा जा रहा है...",

    awaitingConfirmation: "दुकानदार की पुष्टि प्रतीक्षित:",
    awaitingDesc: "आपका ऑर्डर दर्ज कर लिया गया है! गिरिराज फरसाण के मालिक स्टॉक चेक करके 'ऑर्डर कन्फर्म' करेंगे। अभी कोई ऑनलाइन भुगतान आवश्यक नहीं है।",
    checkStatusBtn: "पुष्टि स्थिति जांचें",
    closeBtn: "बंद करें और खरीदारी जारी रखें",
    searchOrderPlaceholder: "मोबाइल नंबर या ऑर्डर आईडी दर्ज करें...",
    findOrderBtn: "ऑर्डर खोजें",

    bulkSectionTag: "थोक ऑर्डर एवं शादी कैटरिंग",
    bulkSectionTitle: "शादी-ब्याह, नवरात्रि उत्सव व कॉर्पोरेट थोक ऑर्डर",
    bulkSectionDesc: "हम थोक रियायती दरों पर, वैक्यूम पैकेजिंग के साथ पूरे भारत में ताज़ा माल सप्लाई करते हैं।",
    requestQuoteTitle: "थोक दर पूछताछ फ़ॉर्म",
    yourName: "आपका नाम *",
    eventOrBusiness: "व्यापार या कार्यक्रम का नाम",
    quantityRequired: "अनुमानित मात्रा (किग्रा) *",
    submitInquiryBtn: "पूछताछ भेजें",

    footerTagline: "पारंपरिक गुजराती फरसाण, क्रिस्पी खाखरा और 100% शुद्ध रॉयल बांधणी हींग।",
    quickLinks: "त्वरित लिंक",
    storeLocation: "स्टोर का पता एवं समय",
    rightsReserved: "सर्वाधिकार सुरक्षित। धन्यवाद!"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('giriraj_language') as Language;
      if (saved && (saved === 'en' || saved === 'gu' || saved === 'hi')) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('giriraj_language', lang);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
