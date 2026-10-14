export type DiscountType = 'percentage' | 'flat';
export type OfferBadgeMode = 'claimed' | 'left';

export interface ProductOffer {
  active: boolean;
  discountType: DiscountType;
  discountValue: number; // e.g. 20 for 20% off, or 50 for ₹50 off per unit
  unitLimit: number; // e.g. First 50 or 60 units only
  unitsSold: number; // how many units have been claimed so far
  badgeMode: OfferBadgeMode; // 'claimed' ("18/50 claimed") or 'left' ("32 units left")
}

export interface WeightPriceOption {
  id: string;
  label: string;
  weightInGrams?: number;
  price: number;
  stockQuantity?: number;
  offer?: ProductOffer;
}

export interface Product {
  id: string;
  name: string;
  gujaratiName?: string;
  category: 'khakhra' | 'hing' | 'farshan' | 'combos';
  description: string;
  gujaratiDescription?: string;
  imageUrl: string;
  price: number; // Single direct unit price (₹)
  stockQuantity: number; // Total units available in stock
  offer?: ProductOffer; // Optional limited-unit offer
  options?: WeightPriceOption[]; // Kept internally for Supabase JSONB backwards compatibility
  flavors?: string[];
  isBestSeller?: boolean;
  isPureGujarati?: boolean;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  ingredients?: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  gujaratiName?: string;
  category: string;
  selectedFlavor?: string;
  quantity: number;
  unitPrice: number; // Regular unit price
  offerUnitPrice?: number; // Discounted unit price when offer applies
  offerUnitsApplied?: number; // Number of units in this cart line receiving offer price
  regularUnitsApplied?: number; // Number of units in this cart line at regular price
  discountSaved?: number; // Total ₹ saved on this line from product offer
  totalPrice: number; // Final line total
  imageUrl: string;
}

export type OrderStatus = 'pending_confirmation' | 'confirmed' | 'dispatched' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  optionLabel?: string;
  flavor?: string;
  quantity: number;
  unitPrice: number;
  offerUnitPrice?: number;
  offerUnitsApplied?: number;
  regularUnitsApplied?: number;
  discountSaved?: number;
  totalPrice: number;
   orderCouponCode?: string;
  orderCouponDiscount?: number;
  stockRestored?: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  email?: string;
  items: OrderItem[];
  subtotal: number;
  couponCode?: string;
  couponDiscount?: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
  adminNotes?: string;
  stockRestored?: boolean;
}

export interface Coupon {
  id: string;
  code: string; // e.g. "FIRST20", "GIRIRAJ100"
  discountType: DiscountType; // 'flat' (₹ off) or 'percentage' (% off cart subtotal)
  discountValue: number; // e.g. 100 (₹100) or 15 (15%)
  minCartValue: number; // e.g. 500 (₹500 minimum subtotal)
  maxUses: number; // e.g. First 10 or 20 customers
  usedCount: number; // How many orders have used this coupon
  isActive: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  isVerifiedPurchase?: boolean;
}

export interface BulkInquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  businessOrEvent: string;
  eventDate?: string;
  expectedQuantity: string;
  productsInterested: string[];
  message: string;
  status: 'new' | 'contacted' | 'quoted' | 'closed' | 'system_internal';
  createdAt: string;
}
