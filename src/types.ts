export type SaleType = 'weight' | 'packet';

export interface WeightPriceOption {
  id: string;
  label: string; // e.g. "250g", "500g", "1 kg" or "1 Packet (200g)"
  weightInGrams?: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  gujaratiName?: string;
  category: 'khakhra' | 'hing' | 'farshan' | 'combos';
  description: string;
  gujaratiDescription?: string;
  imageUrl: string;
  saleType: SaleType;
  options: WeightPriceOption[];
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
  selectedOption: WeightPriceOption;
  selectedFlavor?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string;
}

export type OrderStatus = 'pending_confirmation' | 'confirmed' | 'dispatched' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  optionLabel: string;
  flavor?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
  adminNotes?: string;
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
  status: 'new' | 'contacted' | 'quoted' | 'closed';
  createdAt: string;
}
