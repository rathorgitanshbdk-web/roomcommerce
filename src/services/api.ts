import {
  Product,
  Order,
  Review,
  BulkInquiry,
  OrderStatus,
  OrderItem,
  Coupon,
  ProductOffer,
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS, INITIAL_COUPONS } from '../data/initialData';
import { getSupabase } from '../lib/supabase';

export const FALLBACK_IMAGES: Record<string, string> = {
  khakhra: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800',
  hing: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800',
  farshan: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800',
  combos: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800',
  default: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800',
};

const BROKEN_IMAGE_URLS = new Set([
  'https://i.ibb.co/r2SJgHWB/Gemini-Generated-Image-1.png',
]);

export function resolveProductImage(imageUrl?: string, category?: string): string {
  const trimmed = (imageUrl || '').trim();
  if (!trimmed || BROKEN_IMAGE_URLS.has(trimmed)) {
    return FALLBACK_IMAGES[category || 'default'] || FALLBACK_IMAGES.default;
  }
  return trimmed;
}

const PRODUCTS_CACHE_KEY = 'giriraj_products_cache_v3';
const COUPONS_CACHE_KEY = 'giriraj_coupons_cache_v1';
const SYSTEM_COUPONS_ROW_ID = 'SYSTEM_COUPONS_STORE';

export function getCachedProducts(): Product[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore cache errors
  }
  return null;
}

function setCachedProducts(products: Product[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
  } catch {
    // ignore storage quota errors
  }
}

export function getCachedCoupons(): Coupon[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(COUPONS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore
  }
  return null;
}

function setCachedCoupons(coupons: Coupon[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(COUPONS_CACHE_KEY, JSON.stringify(coupons));
  } catch {
    // ignore
  }
}

function notifyLocalListeners(
  entity: 'products' | 'orders' | 'reviews' | 'inquiries' | 'coupons'
) {
  if (typeof window === 'undefined') return;
  try {
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('giriraj_store_sync');
      bc.postMessage({ entity, timestamp: Date.now() });
      bc.close();
    }
    window.dispatchEvent(new CustomEvent('giriraj_store_sync', { detail: { entity } }));
  } catch {
    // ignore broadcast errors
  }
}

function safeJsonParse(val: any, fallback: any) {
  if (val === null || val === undefined) return fallback;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

async function safeApiCall<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
    return null;
  } catch {
    return null;
  }
}

// ================= PRODUCT OFFER & PARTIAL SPLIT PRICING ENGINE =================
export interface ItemPriceCalculation {
  regularUnitPrice: number;
  offerUnitPrice: number;
  hasActiveOffer: boolean;
  remainingOfferUnits: number;
  offerUnitsApplied: number;
  regularUnitsApplied: number;
  totalPrice: number;
  discountSaved: number;
  isPartialOfferSplit: boolean;
}

export function calculateProductOfferPricing(
  product: Product,
  quantity: number
): ItemPriceCalculation {
  const safeQty = Math.max(1, Number(quantity) || 1);
  const regularUnitPrice = Math.max(1, Number(product.price) || 100);
  const offer = product.offer;

  if (
    !offer ||
    !offer.active ||
    Number(offer.discountValue) <= 0 ||
    Number(offer.unitLimit) <= 0
  ) {
    return {
      regularUnitPrice,
      offerUnitPrice: regularUnitPrice,
      hasActiveOffer: false,
      remainingOfferUnits: 0,
      offerUnitsApplied: 0,
      regularUnitsApplied: safeQty,
      totalPrice: safeQty * regularUnitPrice,
      discountSaved: 0,
      isPartialOfferSplit: false,
    };
  }

  const unitLimit = Math.max(0, Number(offer.unitLimit) || 0);
  const unitsSold = Math.max(0, Number(offer.unitsSold) || 0);
  const remainingOfferUnits = Math.max(0, unitLimit - unitsSold);

  if (remainingOfferUnits <= 0) {
    return {
      regularUnitPrice,
      offerUnitPrice: regularUnitPrice,
      hasActiveOffer: false,
      remainingOfferUnits: 0,
      offerUnitsApplied: 0,
      regularUnitsApplied: safeQty,
      totalPrice: safeQty * regularUnitPrice,
      discountSaved: 0,
      isPartialOfferSplit: false,
    };
  }

  const rawOfferPrice =
    offer.discountType === 'percentage'
      ? Math.round(regularUnitPrice * (1 - Number(offer.discountValue) / 100))
      : Math.round(regularUnitPrice - Number(offer.discountValue));

  const offerUnitPrice = Math.max(1, Math.min(regularUnitPrice, rawOfferPrice));
  const hasActiveOffer = offerUnitPrice < regularUnitPrice && remainingOfferUnits > 0;

  if (!hasActiveOffer) {
    return {
      regularUnitPrice,
      offerUnitPrice: regularUnitPrice,
      hasActiveOffer: false,
      remainingOfferUnits: 0,
      offerUnitsApplied: 0,
      regularUnitsApplied: safeQty,
      totalPrice: safeQty * regularUnitPrice,
      discountSaved: 0,
      isPartialOfferSplit: false,
    };
  }

  // If customer orders 5 units when only 2 offer units are left -> 2 at offer price + 3 at regular price!
  const offerUnitsApplied = Math.min(safeQty, remainingOfferUnits);
  const regularUnitsApplied = Math.max(0, safeQty - offerUnitsApplied);
  const totalPrice =
    offerUnitsApplied * offerUnitPrice + regularUnitsApplied * regularUnitPrice;
  const discountSaved = safeQty * regularUnitPrice - totalPrice;
  const isPartialOfferSplit = offerUnitsApplied > 0 && regularUnitsApplied > 0;

  return {
    regularUnitPrice,
    offerUnitPrice,
    hasActiveOffer: true,
    remainingOfferUnits,
    offerUnitsApplied,
    regularUnitsApplied,
    totalPrice,
    discountSaved,
    isPartialOfferSplit,
  };
}

export function computeOrderAmounts(
  items: OrderItem[],
  rawSubtotal?: any,
  rawDeliveryFee?: any,
  rawTotalAmount?: any,
  rawCouponDiscount?: any
): { subtotal: number; couponDiscount: number; deliveryFee: number; totalAmount: number } {
  const safeItems = Array.isArray(items) ? items : [];
  const itemsSum = safeItems.reduce((sum, it) => {
    const itemTotal =
      Number(it.totalPrice) || Number(it.unitPrice || 0) * Number(it.quantity || 1) || 0;
    return sum + itemTotal;
  }, 0);

  const parsedSub = Number(rawSubtotal);
  const subtotal = parsedSub > 0 ? parsedSub : itemsSum;

  const couponDiscount = Math.max(0, Number(rawCouponDiscount) || 0);
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);

  const parsedFee = Number(rawDeliveryFee);
  const deliveryFee =
    !Number.isNaN(parsedFee) &&
    rawDeliveryFee !== undefined &&
    rawDeliveryFee !== null &&
    parsedSub > 0
      ? parsedFee
      : subtotal >= 499 || subtotal === 0
      ? 0
      : 40;

  const parsedTotal = Number(rawTotalAmount);
  const computedTotal = discountedSubtotal + deliveryFee;
  const totalAmount = parsedTotal > 0 ? parsedTotal : computedTotal;

  return { subtotal, couponDiscount, deliveryFee, totalAmount };
}

function buildOptionsPayloadForSupabase(product: Partial<Product>) {
  const price = Math.max(1, Number(product.price) || 100);
  const stockQuantity =
    product.stockQuantity !== undefined ? Math.max(0, Number(product.stockQuantity)) : 50;
  return [
    {
      id: 'standard',
      label: 'Standard',
      price,
      stockQuantity,
      offer: product.offer || undefined,
    },
  ];
}

export function mapSupabaseProduct(p: any): Product {
  const category = p.category || 'khakhra';
  const options = safeJsonParse(p.options, []);
  const firstOpt = Array.isArray(options) && options.length > 0 ? options[0] : {};

  const price = Math.max(
    1,
    Number(p.price ?? firstOpt?.price ?? 100)
  );

  const rawStock =
    p.stock_quantity ??
    p.stockQuantity ??
    firstOpt?.stockQuantity;

  const explicitInStock =
    p.in_stock !== undefined
      ? Boolean(p.in_stock)
      : p.inStock !== undefined
      ? Boolean(p.inStock)
      : true;

  const stockQuantity =
    rawStock !== undefined && rawStock !== null && !Number.isNaN(Number(rawStock))
      ? Math.max(0, Number(rawStock))
      : explicitInStock
      ? 50
      : 0;

  const rawOffer: ProductOffer | undefined = p.offer ?? firstOpt?.offer ?? undefined;
  const offer: ProductOffer | undefined =
    rawOffer && typeof rawOffer === 'object'
      ? {
          active: Boolean(rawOffer.active),
          discountType: rawOffer.discountType === 'percentage' ? 'percentage' : 'flat',
          discountValue: Math.max(0, Number(rawOffer.discountValue) || 0),
          unitLimit: Math.max(0, Number(rawOffer.unitLimit) || 0),
          unitsSold: Math.max(0, Number(rawOffer.unitsSold) || 0),
          badgeMode: rawOffer.badgeMode === 'claimed' ? 'claimed' : 'left',
        }
      : undefined;

  const inStock = stockQuantity > 0 && explicitInStock;

  return {
    id: p.id,
    name: p.name,
    gujaratiName: p.gujarati_name ?? p.gujaratiName ?? '',
    category,
    description: p.description || '',
    gujaratiDescription: p.gujarati_description ?? p.gujaratiDescription ?? '',
    ingredients: p.ingredients || '',
    imageUrl: resolveProductImage(p.image_url || p.imageUrl || p.image, category),
    price,
    stockQuantity,
    offer,
    options: [
      {
        id: 'standard',
        label: 'Standard',
        price,
        stockQuantity,
        offer,
      },
    ],
    rating: Number(p.rating || 5),
    reviewCount: Number(p.review_count ?? p.reviewCount ?? 0),
    isBestSeller: Boolean(p.is_bestseller ?? p.isBestSeller),
    isPureGujarati: p.is_pure_gujarati !== undefined ? Boolean(p.is_pure_gujarati) : true,
    inStock,
    flavors: safeJsonParse(p.flavors, []),
  };
}

export function mapSupabaseOrder(o: any): Order {
  const rawItems = safeJsonParse(o.items, []);
  let extractedCouponCode = o.coupon_code ?? o.couponCode ?? '';
  let extractedCouponDiscount = Number(o.coupon_discount ?? o.couponDiscount ?? 0);
  let extractedStockRestored = Boolean(o.stock_restored ?? o.stockRestored);

  const items: OrderItem[] = (Array.isArray(rawItems) ? rawItems : []).map((it: any) => {
    if (it.orderCouponCode && !extractedCouponCode) {
      extractedCouponCode = it.orderCouponCode;
    }
    if (it.orderCouponDiscount && !extractedCouponDiscount) {
      extractedCouponDiscount = Number(it.orderCouponDiscount) || 0;
    }
    if (it.stockRestored) {
      extractedStockRestored = true;
    }

    const qty = Number(it.quantity || 1);
    const unitPrice = Number(it.unitPrice ?? it.unit_price ?? it.price ?? 0);
    const totalPrice = Number(it.totalPrice ?? it.total_price ?? unitPrice * qty);
    return {
      productId: it.productId || it.product_id || '',
      productName: it.productName || it.product_name || 'Item',
      optionLabel: it.optionLabel || it.option_label || undefined,
      flavor: it.flavor || undefined,
      quantity: qty,
      unitPrice,
      offerUnitPrice: it.offerUnitPrice !== undefined ? Number(it.offerUnitPrice) : undefined,
      offerUnitsApplied:
        it.offerUnitsApplied !== undefined ? Number(it.offerUnitsApplied) : undefined,
      regularUnitsApplied:
        it.regularUnitsApplied !== undefined ? Number(it.regularUnitsApplied) : undefined,
      discountSaved: it.discountSaved !== undefined ? Number(it.discountSaved) : undefined,
      totalPrice,
      orderCouponCode: it.orderCouponCode,
      orderCouponDiscount: it.orderCouponDiscount,
      stockRestored: it.stockRestored,
    };
  });

  const { subtotal, couponDiscount, deliveryFee, totalAmount } = computeOrderAmounts(
    items,
    o.subtotal,
    o.delivery_fee ?? o.deliveryFee,
    o.total_amount ?? o.totalAmount ?? o.totalPayable ?? o.total,
    extractedCouponDiscount
  );

  return {
    id: o.id,
    customerName: o.customer_name ?? o.customerName ?? 'Customer',
    phone: o.phone || '',
    address: o.address || '',
    city: o.city || '',
    pincode: o.pincode || '',
    email: o.email || '',
    items,
    subtotal,
    couponCode: extractedCouponCode || undefined,
    couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
    deliveryFee,
    totalAmount,
    status: (o.status as OrderStatus) || 'pending_confirmation',
    adminNotes: o.admin_notes ?? o.adminNotes ?? '',
    notes: o.notes || '',
    createdAt: o.created_at ?? o.createdAt ?? new Date().toISOString(),
    stockRestored: extractedStockRestored,
  };
}

export function filterProductsClientSide(
  products: Product[],
  category?: string,
  search?: string
): Product[] {
  let list = products;
  if (category && category !== 'all') {
    list = list.filter((p) => p.category === category);
  }
  if (search && typeof search === 'string' && search.trim()) {
    const query = search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.gujaratiName && p.gujaratiName.toLowerCase().includes(query)) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }
  return list;
}

// 1. Fetch Products
export async function fetchProducts(category?: string, search?: string): Promise<Product[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const allProducts = data.map(mapSupabaseProduct);
        setCachedProducts(allProducts);
        return filterProductsClientSide(allProducts, category, search);
      }
    } catch (err) {
      console.warn('Direct Supabase products fetch failed, falling back to API:', err);
    }
  }

  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (search) params.append('search', search);

  const apiData = await safeApiCall<{ products: Product[] }>(`/api/products?${params.toString()}`);
  if (apiData && Array.isArray(apiData.products)) {
    const mapped = apiData.products.map(mapSupabaseProduct);
    if ((!category || category === 'all') && !search) {
      setCachedProducts(mapped);
    }
    return filterProductsClientSide(mapped, category, search);
  }

  const cached = getCachedProducts();
  const baseList = cached !== null ? cached : INITIAL_PRODUCTS;
  return filterProductsClientSide(baseList, category, search);
}

// 2. Create Product (Admin)
export async function createProduct(product: Partial<Product>): Promise<Product> {
  const category = (product.category as any) || 'farshan';
  const price = Math.max(1, Number(product.price) || 100);
  const stockQuantity =
    product.stockQuantity !== undefined ? Math.max(0, Number(product.stockQuantity)) : 50;
  const inStock = stockQuantity > 0 && (product.inStock !== undefined ? Boolean(product.inStock) : true);

  const newProduct: Product = {
    id: product.id || `prod-${Date.now()}`,
    name: product.name || 'New Product',
    gujaratiName: product.gujaratiName || '',
    category,
    description: product.description || '',
    gujaratiDescription: product.gujaratiDescription || '',
    ingredients: product.ingredients || '',
    imageUrl: resolveProductImage(product.imageUrl, category),
    price,
    stockQuantity,
    offer: product.offer,
    options: buildOptionsPayloadForSupabase({ price, stockQuantity, offer: product.offer }),
    rating: product.rating || 5.0,
    reviewCount: product.reviewCount || 0,
    isBestSeller: Boolean(product.isBestSeller),
    inStock,
    flavors: product.flavors || [],
  };

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('products').upsert({
      id: newProduct.id,
      name: newProduct.name,
      gujarati_name: newProduct.gujaratiName || null,
      category: newProduct.category,
      description: newProduct.description || null,
      ingredients: newProduct.ingredients || null,
      image_url: newProduct.imageUrl,
      rating: newProduct.rating,
      review_count: newProduct.reviewCount,
      is_bestseller: newProduct.isBestSeller,
      in_stock: newProduct.inStock,
      options: newProduct.options,
      flavors: newProduct.flavors,
      sale_type: 'unit',
    });

    if (!error) {
      const cached = getCachedProducts();
      if (cached) {
        setCachedProducts([newProduct, ...cached.filter((p) => p.id !== newProduct.id)]);
      }
      notifyLocalListeners('products');
      safeApiCall('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      return newProduct;
    }
  }

  const apiData = await safeApiCall<{ product: Product }>('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newProduct),
  });
  notifyLocalListeners('products');
  return apiData?.product ? mapSupabaseProduct(apiData.product) : newProduct;
}

// 3. Update Product (Admin & Automatic Stock/Offer Deduction)
export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  const supabase = getSupabase();
  const cached = getCachedProducts() || [];
  const existing = cached.find((p) => p.id === id);

  const mergedPrice =
    product.price !== undefined
      ? Math.max(1, Number(product.price))
      : existing?.price ?? 100;

  const mergedStock =
    product.stockQuantity !== undefined
      ? Math.max(0, Number(product.stockQuantity))
      : existing?.stockQuantity ?? 50;

  const mergedOffer =
    product.offer !== undefined ? product.offer : existing?.offer;

  const mergedInStock =
    mergedStock > 0 &&
    (product.inStock !== undefined ? Boolean(product.inStock) : existing?.inStock ?? true);

  const optionsPayload = buildOptionsPayloadForSupabase({
    price: mergedPrice,
    stockQuantity: mergedStock,
    offer: mergedOffer,
  });

  if (supabase) {
    const payload: any = {
      in_stock: mergedInStock,
      options: optionsPayload,
    };
    if (product.name !== undefined) payload.name = product.name;
    if (product.gujaratiName !== undefined) payload.gujarati_name = product.gujaratiName;
    if (product.category !== undefined) payload.category = product.category;
    if (product.description !== undefined) payload.description = product.description;
    if (product.ingredients !== undefined) payload.ingredients = product.ingredients;
    if (product.imageUrl !== undefined) {
      payload.image_url = resolveProductImage(
        product.imageUrl,
        product.category || existing?.category
      );
    }
    if (product.isBestSeller !== undefined) payload.is_bestseller = product.isBestSeller;
    if (product.flavors !== undefined) payload.flavors = product.flavors;

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (!error) {
      const updated = data
        ? mapSupabaseProduct(data)
        : ({
            ...(existing || {}),
            ...product,
            id,
            price: mergedPrice,
            stockQuantity: mergedStock,
            offer: mergedOffer,
            inStock: mergedInStock,
            options: optionsPayload,
          } as Product);

      if (cached.length > 0) {
        setCachedProducts(cached.map((p) => (p.id === id ? updated : p)));
      }
      notifyLocalListeners('products');
      safeApiCall(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      return updated;
    }
  }

  const apiData = await safeApiCall<{ product: Product }>(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...product,
      price: mergedPrice,
      stockQuantity: mergedStock,
      offer: mergedOffer,
      inStock: mergedInStock,
      options: optionsPayload,
    }),
  });
  notifyLocalListeners('products');
  return apiData?.product
    ? mapSupabaseProduct(apiData.product)
    : ({
        ...(existing || {}),
        ...product,
        id,
        price: mergedPrice,
        stockQuantity: mergedStock,
        offer: mergedOffer,
        inStock: mergedInStock,
      } as Product);
}

// 4. Delete Product (Admin)
export async function deleteProduct(id: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from('products').delete().eq('id', id);
  }
  const cached = getCachedProducts();
  if (cached) {
    setCachedProducts(cached.filter((p) => p.id !== id));
  }
  notifyLocalListeners('products');
  await safeApiCall(`/api/products/${id}`, { method: 'DELETE' });
}

// ================= COUPONS MANAGEMENT & VALIDATION =================

function mapSupabaseCoupon(c: any): Coupon {
  return {
    id: c.id || `coup-${Date.now()}`,
    code: String(c.code || '').trim().toUpperCase(),
    discountType: c.discount_type === 'percentage' || c.discountType === 'percentage' ? 'percentage' : 'flat',
    discountValue: Math.max(0, Number(c.discount_value ?? c.discountValue ?? 0)),
    minCartValue: Math.max(0, Number(c.min_cart_value ?? c.minCartValue ?? 0)),
    maxUses: Math.max(1, Number(c.max_uses ?? c.maxUses ?? 10)),
    usedCount: Math.max(0, Number(c.used_count ?? c.usedCount ?? 0)),
    isActive:
      c.is_active !== undefined
        ? Boolean(c.is_active)
        : c.isActive !== undefined
        ? Boolean(c.isActive)
        : true,
    createdAt: c.created_at ?? c.createdAt ?? new Date().toISOString(),
  };
}

async function saveCouponsToSystemRow(coupons: Coupon[]) {
  setCachedCoupons(coupons);
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('bulk_inquiries').upsert({
      id: SYSTEM_COUPONS_ROW_ID,
      name: 'SYSTEM_COUPONS',
      phone: '0000000000',
      email: null,
      business_or_event: 'SYSTEM_COUPONS_STORE',
      event_date: null,
      expected_quantity: 'SYSTEM',
      products_interested: coupons,
      message: 'Internal storage for store promo coupons',
      status: 'system_internal',
      created_at: new Date().toISOString(),
    });
  } catch {
    // ignore
  }
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const supabase = getSupabase();
  if (supabase) {
    // 1. Try dedicated coupons table first
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map(mapSupabaseCoupon);
        setCachedCoupons(mapped);
        return mapped;
      }
    } catch {
      // Fallback to system store row
    }

    // 2. Zero-config fallback: Read from SYSTEM_COUPONS_STORE in bulk_inquiries
    try {
      const { data, error } = await supabase
        .from('bulk_inquiries')
        .select('*')
        .eq('id', SYSTEM_COUPONS_ROW_ID)
        .maybeSingle();

      if (!error && data && data.products_interested) {
        const parsed = safeJsonParse(data.products_interested, []);
        if (Array.isArray(parsed)) {
          const mapped = parsed.map(mapSupabaseCoupon);
          setCachedCoupons(mapped);
          return mapped;
        }
      } else if (!error && !data) {
        // Seed initial coupons into system row once
        await saveCouponsToSystemRow(INITIAL_COUPONS);
        return INITIAL_COUPONS;
      }
    } catch {
      // fallback
    }
  }

  const cached = getCachedCoupons();
  if (cached !== null) return cached;
  setCachedCoupons(INITIAL_COUPONS);
  return INITIAL_COUPONS;
}

export async function createCoupon(payload: Partial<Coupon>): Promise<Coupon> {
  const cleanCode = String(payload.code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  const newCoupon: Coupon = {
    id: payload.id || `coup-${Date.now()}`,
    code: cleanCode || `GIRIRAJ${Math.floor(10 + Math.random() * 90)}`,
    discountType: payload.discountType === 'percentage' ? 'percentage' : 'flat',
    discountValue: Math.max(1, Number(payload.discountValue) || 50),
    minCartValue: Math.max(0, Number(payload.minCartValue) || 0),
    maxUses: Math.max(1, Number(payload.maxUses) || 20),
    usedCount: Math.max(0, Number(payload.usedCount) || 0),
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    createdAt: new Date().toISOString(),
  };

  const current = await fetchCoupons();
  const updatedList = [
    newCoupon,
    ...current.filter((c) => c.id !== newCoupon.id && c.code !== newCoupon.code),
  ];

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('coupons').upsert({
        id: newCoupon.id,
        code: newCoupon.code,
        discount_type: newCoupon.discountType,
        discount_value: newCoupon.discountValue,
        min_cart_value: newCoupon.minCartValue,
        max_uses: newCoupon.maxUses,
        used_count: newCoupon.usedCount,
        is_active: newCoupon.isActive,
        created_at: newCoupon.createdAt,
      });
    } catch {
      // Fallback handled by saveCouponsToSystemRow below
    }
  }

  await saveCouponsToSystemRow(updatedList);
  notifyLocalListeners('coupons');
  return newCoupon;
}

export async function updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
  const current = await fetchCoupons();
  let updatedItem: Coupon | null = null;

  const updatedList = current.map((c) => {
    if (c.id === id || (updates.code && c.code === updates.code)) {
      updatedItem = {
        ...c,
        ...updates,
        code: updates.code ? updates.code.trim().toUpperCase() : c.code,
      };
      return updatedItem;
    }
    return c;
  });

  if (updatedItem) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const u = updatedItem as Coupon;
        await supabase
          .from('coupons')
          .update({
            code: u.code,
            discount_type: u.discountType,
            discount_value: u.discountValue,
            min_cart_value: u.minCartValue,
            max_uses: u.maxUses,
            used_count: u.usedCount,
            is_active: u.isActive,
          })
          .eq('id', u.id);
      } catch {
        // Fallback handled below
      }
    }
    await saveCouponsToSystemRow(updatedList);
    notifyLocalListeners('coupons');
    return updatedItem;
  }

  return { id, ...updates } as Coupon;
}

export async function deleteCoupon(id: string): Promise<void> {
  const current = await fetchCoupons();
  const updatedList = current.filter((c) => c.id !== id);
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('coupons').delete().eq('id', id);
    } catch {
      // ignore
    }
  }
  await saveCouponsToSystemRow(updatedList);
  notifyLocalListeners('coupons');
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message: string;
}

export async function validateCouponCode(
  rawCode: string,
  cartSubtotal: number
): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { valid: false, discountAmount: 0, message: 'Please enter a coupon code.' };
  }

  const coupons = await fetchCoupons();
  const matched = coupons.find((c) => c.code.toUpperCase() === code);

  if (!matched) {
    return { valid: false, discountAmount: 0, message: `Invalid coupon code "${code}".` };
  }

  if (!matched.isActive) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Coupon "${code}" is currently inactive.`,
    };
  }

  if (matched.usedCount >= matched.maxUses) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Coupon limit reached! "${code}" was valid only for the first ${matched.maxUses} customers.`,
    };
  }

  if (cartSubtotal < matched.minCartValue) {
    const needed = matched.minCartValue - cartSubtotal;
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum cart value of ₹${matched.minCartValue} required for "${code}". Add ₹${needed} more to apply!`,
    };
  }

  const rawDiscount =
    matched.discountType === 'flat'
      ? matched.discountValue
      : Math.round((cartSubtotal * matched.discountValue) / 100);

  const discountAmount = Math.max(0, Math.min(cartSubtotal, rawDiscount));

  return {
    valid: true,
    coupon: matched,
    discountAmount,
    message: `Coupon "${code}" applied! You saved ₹${discountAmount}.`,
  };
}

// Generate collision-safe Order ID
function generateOrderId(): string {
  const timePart = Date.now().toString().slice(-4);
  const randPart = Math.floor(10 + Math.random() * 90).toString();
  return `GRJ-${timePart}${randPart}`;
}

// 5. Create Order (Deducts Stock, Offer Units, and Coupon Uses Immediately)
export async function createOrder(orderPayload: Partial<Order>): Promise<Order> {
  const rawItems = orderPayload.items || [];
  const couponCode = orderPayload.couponCode ? orderPayload.couponCode.trim().toUpperCase() : undefined;
  const couponDiscount = Math.max(0, Number(orderPayload.couponDiscount) || 0);

  const items: OrderItem[] = rawItems.map((it, idx) => ({
    ...it,
    ...(idx === 0 && couponCode
      ? { orderCouponCode: couponCode, orderCouponDiscount: couponDiscount }
      : {}),
  }));

  const { subtotal, deliveryFee, totalAmount } = computeOrderAmounts(
    items,
    orderPayload.subtotal,
    orderPayload.deliveryFee,
    orderPayload.totalAmount,
    couponDiscount
  );

  const newOrder: Order = {
    id: orderPayload.id || generateOrderId(),
    customerName: orderPayload.customerName || '',
    phone: orderPayload.phone || '',
    address: orderPayload.address || '',
    city: orderPayload.city || 'Ahmedabad',
    pincode: orderPayload.pincode || '',
    email: orderPayload.email || '',
    items,
    subtotal,
    couponCode,
    couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
    deliveryFee,
    totalAmount,
    status: 'pending_confirmation',
    adminNotes: '',
    notes: orderPayload.notes || '',
    createdAt: new Date().toISOString(),
  };

  // 1. Deduct stock & increment offer units sold for each ordered product
  try {
    const currentProducts = await fetchProducts();
    for (const item of items) {
      const prod = currentProducts.find((p) => p.id === item.productId);
      if (prod) {
        const newStock = Math.max(0, prod.stockQuantity - item.quantity);
        let updatedOffer = prod.offer ? { ...prod.offer } : undefined;
        if (updatedOffer && item.offerUnitsApplied && item.offerUnitsApplied > 0) {
          updatedOffer.unitsSold = Math.min(
            updatedOffer.unitLimit,
            (updatedOffer.unitsSold || 0) + item.offerUnitsApplied
          );
        }
        await updateProduct(prod.id, {
          stockQuantity: newStock,
          inStock: newStock > 0,
          offer: updatedOffer,
        });
      }
    }
  } catch (err) {
    console.warn('Stock/offer deduction warning:', err);
  }

  // 2. Increment coupon usedCount if a coupon was applied
  if (couponCode) {
    try {
      const coupons = await fetchCoupons();
      const matched = coupons.find((c) => c.code.toUpperCase() === couponCode);
      if (matched) {
        await updateCoupon(matched.id, {
          usedCount: (matched.usedCount || 0) + 1,
        });
      }
    } catch (err) {
      console.warn('Coupon usage increment warning:', err);
    }
  }

  // 3. Insert Order into Supabase
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('orders').insert({
      id: newOrder.id,
      customer_name: newOrder.customerName,
      phone: newOrder.phone,
      address: newOrder.address,
      city: newOrder.city || null,
      pincode: newOrder.pincode || null,
      email: newOrder.email || null,
      items: newOrder.items,
      subtotal: newOrder.subtotal,
      delivery_fee: newOrder.deliveryFee,
      total_amount: newOrder.totalAmount,
      status: newOrder.status,
      admin_notes: null,
      notes: newOrder.notes || null,
      created_at: newOrder.createdAt,
    });

    if (!error) {
      notifyLocalListeners('orders');
      return newOrder;
    }
  }

  const apiData = await safeApiCall<{ order: Order }>('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newOrder),
  });
  notifyLocalListeners('orders');
  if (apiData?.order) {
    return mapSupabaseOrder(apiData.order);
  }

  return newOrder;
}

// 6. Fetch Orders (Admin)
export async function fetchOrders(): Promise<Order[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(mapSupabaseOrder);
      }
    } catch (err) {
      console.warn('Direct Supabase orders fetch failed, falling back to API:', err);
    }
  }

  const apiData = await safeApiCall<{ orders: Order[] }>('/api/orders');
  if (apiData?.orders && Array.isArray(apiData.orders)) {
    return apiData.orders.map(mapSupabaseOrder);
  }

  return [];
}

// 7. Track Order (Customer modal)
export async function trackOrder(query: string): Promise<Order[]> {
  const clean = query.trim().replace(/^#/, '');
  if (!clean) return [];

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`id.ilike.%${clean}%,phone.ilike.%${clean}%,customer_name.ilike.%${clean}%`)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(mapSupabaseOrder);
      }
    } catch (err) {
      console.warn('Direct Supabase trackOrder failed, falling back to API:', err);
    }
  }

  const apiData = await safeApiCall<{ orders: Order[] }>(
    `/api/orders/track?query=${encodeURIComponent(clean)}`
  );
  if (apiData?.orders && Array.isArray(apiData.orders)) {
    return apiData.orders.map(mapSupabaseOrder);
  }

  return [];
}

// 8. Update Order Status (Admin Confirm / Dispatch / Cancel — Restores Stock & Offer Units on Cancel!)
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  adminNotes?: string
): Promise<Order> {
  const supabase = getSupabase();

  // Check if transitioning to 'cancelled' so we can restore stock, offer units, and coupon uses
  if (status === 'cancelled') {
    try {
      const allOrders = await fetchOrders();
      const targetOrder = allOrders.find((o) => o.id === id);

      if (targetOrder && targetOrder.status !== 'cancelled' && !targetOrder.stockRestored) {
        const currentProducts = await fetchProducts();
        for (const item of targetOrder.items) {
          const prod = currentProducts.find((p) => p.id === item.productId);
          if (prod) {
            const restoredStock = prod.stockQuantity + item.quantity;
            let updatedOffer = prod.offer ? { ...prod.offer } : undefined;
            if (updatedOffer && item.offerUnitsApplied && item.offerUnitsApplied > 0) {
              updatedOffer.unitsSold = Math.max(
                0,
                (updatedOffer.unitsSold || 0) - item.offerUnitsApplied
              );
            }
            await updateProduct(prod.id, {
              stockQuantity: restoredStock,
              inStock: restoredStock > 0,
              offer: updatedOffer,
            });
          }
        }

        if (targetOrder.couponCode) {
          const coupons = await fetchCoupons();
          const matched = coupons.find(
            (c) => c.code.toUpperCase() === targetOrder.couponCode?.toUpperCase()
          );
          if (matched && matched.usedCount > 0) {
            await updateCoupon(matched.id, {
              usedCount: Math.max(0, matched.usedCount - 1),
            });
          }
        }

        // Mark stockRestored on first item so repeated cancel calls never double-restore
        const updatedItems = targetOrder.items.map((it, idx) =>
          idx === 0 ? { ...it, stockRestored: true } : it
        );
        if (supabase) {
          await supabase
            .from('orders')
            .update({ items: updatedItems, status: 'cancelled' })
            .eq('id', id);
        }
      }
    } catch (err) {
      console.warn('Error restoring stock on order cancellation:', err);
    }
  }

  if (supabase) {
    const updatePayload: any = { status };
    if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (!error) {
      notifyLocalListeners('orders');
      safeApiCall(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (data) return mapSupabaseOrder(data);
    }
  }

  const apiData = await safeApiCall<{ order: Order }>(`/api/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, adminNotes }),
  });
  notifyLocalListeners('orders');
  if (apiData?.order) {
    return mapSupabaseOrder(apiData.order);
  }

  return { id, status, adminNotes } as unknown as Order;
}

// 9. Fetch Reviews
export async function fetchReviews(productId?: string): Promise<Review[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      let query = supabase.from('reviews').select('*').order('date', { ascending: false });
      if (productId) {
        query = query.eq('product_id', productId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          productId: r.product_id,
          productName: r.product_name,
          customerName: r.customer_name,
          rating: Number(r.rating || 5),
          comment: r.comment,
          date: r.date,
          isVerifiedPurchase: Boolean(r.is_verified_purchase),
        }));
      }
    } catch {
      // fallback
    }
  }

  const url = productId ? `/api/reviews?productId=${encodeURIComponent(productId)}` : '/api/reviews';
  const apiData = await safeApiCall<{ reviews: Review[] }>(url);
  if (apiData?.reviews && Array.isArray(apiData.reviews) && apiData.reviews.length > 0) {
    return apiData.reviews;
  }

  if (productId) {
    return INITIAL_REVIEWS.filter((r) => r.productId === productId);
  }
  return INITIAL_REVIEWS;
}

// 10. Submit Review
export async function submitReview(reviewPayload: Partial<Review>): Promise<Review> {
  const newReview: Review = {
    id: `rev-${Date.now()}`,
    productId: reviewPayload.productId || 'storewide',
    productName: reviewPayload.productName || 'Store Experience',
    customerName: reviewPayload.customerName || 'Verified Patron',
    rating: Number(reviewPayload.rating || 5),
    comment: reviewPayload.comment || '',
    date: new Date().toISOString().split('T')[0],
    isVerifiedPurchase: true,
  };

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('reviews').insert({
      id: newReview.id,
      product_id: newReview.productId,
      product_name: newReview.productName,
      customer_name: newReview.customerName,
      rating: newReview.rating,
      comment: newReview.comment,
      date: newReview.date,
      is_verified_purchase: newReview.isVerifiedPurchase,
    });
    if (!error) {
      notifyLocalListeners('reviews');
      return newReview;
    }
  }

  const apiData = await safeApiCall<{ review: Review }>('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newReview),
  });
  notifyLocalListeners('reviews');
  return apiData?.review || newReview;
}

// 11. Fetch Bulk Inquiries (Excludes Internal System Coupons Store Row)
export async function fetchBulkInquiries(): Promise<BulkInquiry[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bulk_inquiries')
        .select('*')
        .neq('id', SYSTEM_COUPONS_ROW_ID)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data
          .filter((b: any) => b.id !== SYSTEM_COUPONS_ROW_ID && b.status !== 'system_internal')
          .map((b: any) => ({
            id: b.id,
            name: b.name,
            phone: b.phone,
            email: b.email || '',
            businessOrEvent: b.business_or_event || '',
            eventDate: b.event_date || '',
            expectedQuantity: b.expected_quantity,
            productsInterested: safeJsonParse(b.products_interested, []),
            message: b.message || '',
            status: b.status || 'new',
            createdAt: b.created_at,
          }));
      }
    } catch {
      // fallback
    }
  }

  const apiData = await safeApiCall<{ inquiries: BulkInquiry[] }>('/api/bulk-inquiries');
  if (apiData?.inquiries && Array.isArray(apiData.inquiries)) {
    return apiData.inquiries.filter(
      (b) => b.id !== SYSTEM_COUPONS_ROW_ID && b.status !== 'system_internal'
    );
  }

  return [];
}

// 12. Submit Bulk Inquiry
export async function submitBulkInquiry(payload: Partial<BulkInquiry>): Promise<BulkInquiry> {
  const timePart = Date.now().toString().slice(-3);
  const randPart = Math.floor(10 + Math.random() * 90).toString();
  const newInquiry: BulkInquiry = {
    id: `BULK-${timePart}${randPart}`,
    name: payload.name || '',
    phone: payload.phone || '',
    email: payload.email || '',
    businessOrEvent: payload.businessOrEvent || 'Special Event / Catering',
    eventDate: payload.eventDate || '',
    expectedQuantity: payload.expectedQuantity || '10kg+',
    productsInterested: payload.productsInterested || [],
    message: payload.message || '',
    status: 'new',
    createdAt: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('bulk_inquiries').insert({
      id: newInquiry.id,
      name: newInquiry.name,
      phone: newInquiry.phone,
      email: newInquiry.email || null,
      business_or_event: newInquiry.businessOrEvent || null,
      event_date: newInquiry.eventDate || null,
      expected_quantity: newInquiry.expectedQuantity,
      products_interested: newInquiry.productsInterested,
      message: newInquiry.message || null,
      status: newInquiry.status,
      created_at: newInquiry.createdAt,
    });
    if (!error) {
      notifyLocalListeners('inquiries');
      return newInquiry;
    }
  }

  const apiData = await safeApiCall<{ inquiry: BulkInquiry }>('/api/bulk-inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newInquiry),
  });
  notifyLocalListeners('inquiries');
  return apiData?.inquiry || newInquiry;
}

// 13. Update Bulk Inquiry Status
export async function updateBulkInquiryStatus(id: string, status: string): Promise<BulkInquiry> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('bulk_inquiries').update({ status }).eq('id', id);
    if (!error) {
      notifyLocalListeners('inquiries');
      safeApiCall(`/api/bulk-inquiries/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return { id, status } as unknown as BulkInquiry;
    }
  }

  const apiData = await safeApiCall<{ inquiry: BulkInquiry }>(`/api/bulk-inquiries/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  notifyLocalListeners('inquiries');
  return apiData?.inquiry || ({ id, status } as unknown as BulkInquiry);
}

// 14. Compute Admin Overview Stats in Memory
export function calculateStatsFromData(
  orders: Order[],
  products: Product[],
  inquiries: BulkInquiry[]
) {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending_confirmation').length;
  const confirmedOrders = orders.filter(
    (o) => o.status === 'confirmed' || o.status === 'dispatched'
  ).length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  return {
    totalOrders,
    pendingOrders,
    confirmedOrders,
    totalRevenue,
    totalProducts: products.length,
    totalBulkInquiries: inquiries.length,
  };
}

export async function fetchStats() {
  const [orders, products, inquiries] = await Promise.all([
    fetchOrders(),
    fetchProducts(),
    fetchBulkInquiries(),
  ]);
  return calculateStatsFromData(orders, products, inquiries);
}

// 15. Live Realtime WebSocket + Cross-Tab Broadcast Subscription
export interface StoreRealtimeCallbacks {
  onProductsChange?: () => void;
  onOrdersChange?: (payload?: any) => void;
  onInquiriesChange?: () => void;
  onReviewsChange?: () => void;
  onCouponsChange?: () => void;
}

export function subscribeToStoreChanges(callbacks: StoreRealtimeCallbacks): () => void {
  const supabase = getSupabase();
  let channel: any = null;

  if (supabase) {
    try {
      channel = supabase.channel(`giriraj-realtime-${Math.random().toString(36).slice(2, 8)}`);

      if (callbacks.onProductsChange) {
        channel = channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => callbacks.onProductsChange?.()
        );
      }
      if (callbacks.onOrdersChange) {
        channel = channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload: any) => callbacks.onOrdersChange?.(payload)
        );
      }
      if (callbacks.onInquiriesChange || callbacks.onCouponsChange) {
        channel = channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bulk_inquiries' },
          () => {
            callbacks.onInquiriesChange?.();
            callbacks.onCouponsChange?.();
          }
        );
      }
      if (callbacks.onCouponsChange) {
        channel = channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'coupons' },
          () => callbacks.onCouponsChange?.()
        );
      }
      if (callbacks.onReviewsChange) {
        channel = channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reviews' },
          () => callbacks.onReviewsChange?.()
        );
      }

      channel.subscribe();
    } catch (err) {
      console.warn('Supabase Realtime subscription warning:', err);
    }
  }

  let bc: BroadcastChannel | null = null;
  const handleEntityEvent = (entity?: string) => {
    if (entity === 'products') callbacks.onProductsChange?.();
    if (entity === 'orders') callbacks.onOrdersChange?.();
    if (entity === 'inquiries') callbacks.onInquiriesChange?.();
    if (entity === 'reviews') callbacks.onReviewsChange?.();
    if (entity === 'coupons') callbacks.onCouponsChange?.();
  };

  const handleWindowEvent = (e: any) => {
    handleEntityEvent(e?.detail?.entity);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('giriraj_store_sync', handleWindowEvent);
    if ('BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('giriraj_store_sync');
        bc.onmessage = (ev) => handleEntityEvent(ev?.data?.entity);
      } catch {
        // ignore
      }
    }
  }

  return () => {
    if (channel && supabase) {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('giriraj_store_sync', handleWindowEvent);
    }
    if (bc) {
      try {
        bc.close();
      } catch {
        // ignore
      }
    }
  };
}
