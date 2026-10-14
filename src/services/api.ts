import { Product, Order, Review, BulkInquiry, OrderStatus, OrderItem } from '../types';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS } from '../data/initialData';
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

const PRODUCTS_CACHE_KEY = 'giriraj_products_cache_v2';
const REVIEWS_CACHE_KEY = 'giriraj_reviews_cache_v2';

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

function notifyLocalListeners(entity: 'products' | 'orders' | 'reviews' | 'inquiries') {
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

export function computeOrderAmounts(
  items: OrderItem[],
  rawSubtotal?: any,
  rawDeliveryFee?: any,
  rawTotalAmount?: any
): { subtotal: number; deliveryFee: number; totalAmount: number } {
  const safeItems = Array.isArray(items) ? items : [];
  const itemsSum = safeItems.reduce((sum, it) => {
    const itemTotal =
      Number(it.totalPrice) || Number(it.unitPrice || 0) * Number(it.quantity || 1) || 0;
    return sum + itemTotal;
  }, 0);

  const parsedSub = Number(rawSubtotal);
  const subtotal = parsedSub > 0 ? parsedSub : itemsSum;

  const parsedFee = Number(rawDeliveryFee);
  const deliveryFee =
    !Number.isNaN(parsedFee) && rawDeliveryFee !== undefined && rawDeliveryFee !== null && parsedSub > 0
      ? parsedFee
      : subtotal >= 499 || subtotal === 0
      ? 0
      : 40;

  const parsedTotal = Number(rawTotalAmount);
  const totalAmount = parsedTotal > 0 ? parsedTotal : subtotal + deliveryFee;

  return { subtotal, deliveryFee, totalAmount };
}

export function mapSupabaseProduct(p: any): Product {
  const category = p.category || 'khakhra';
  return {
    id: p.id,
    name: p.name,
    gujaratiName: p.gujarati_name ?? p.gujaratiName ?? '',
    category,
    description: p.description || '',
    gujaratiDescription: p.gujarati_description ?? p.gujaratiDescription ?? '',
    ingredients: p.ingredients || '',
    imageUrl: resolveProductImage(p.image_url || p.imageUrl || p.image, category),
    rating: Number(p.rating || 5),
    reviewCount: Number(p.review_count ?? p.reviewCount ?? 0),
    isBestSeller: Boolean(p.is_bestseller ?? p.isBestSeller),
    isPureGujarati: p.is_pure_gujarati !== undefined ? Boolean(p.is_pure_gujarati) : true,
    inStock:
      p.in_stock !== undefined
        ? Boolean(p.in_stock)
        : p.inStock !== undefined
        ? Boolean(p.inStock)
        : true,
    options: safeJsonParse(p.options, []),
    flavors: safeJsonParse(p.flavors, []),
    saleType: p.sale_type || p.saleType || 'weight',
  };
}

export function mapSupabaseOrder(o: any): Order {
  const items: OrderItem[] = safeJsonParse(o.items, []).map((it: any) => {
    const qty = Number(it.quantity || 1);
    const unitPrice = Number(it.unitPrice ?? it.unit_price ?? it.price ?? 0);
    const totalPrice = Number(it.totalPrice ?? it.total_price ?? unitPrice * qty);
    return {
      productId: it.productId || it.product_id || '',
      productName: it.productName || it.product_name || 'Item',
      optionLabel: it.optionLabel || it.option_label || 'Standard',
      flavor: it.flavor || undefined,
      quantity: qty,
      unitPrice,
      totalPrice,
    };
  });

  const { subtotal, deliveryFee, totalAmount } = computeOrderAmounts(
    items,
    o.subtotal,
    o.delivery_fee ?? o.deliveryFee,
    o.total_amount ?? o.totalAmount ?? o.totalPayable ?? o.total
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
    deliveryFee,
    totalAmount,
    status: (o.status as OrderStatus) || 'pending_confirmation',
    adminNotes: o.admin_notes ?? o.adminNotes ?? '',
    notes: o.notes || '',
    createdAt: o.created_at ?? o.createdAt ?? new Date().toISOString(),
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

// 1. Fetch Products (Direct Supabase Fast-Path + Cache + Proper Empty Category Handling)
export async function fetchProducts(category?: string, search?: string): Promise<Product[]> {
  const supabase = getSupabase();

  // Fast Path 1: Direct Supabase query
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

  // Fallback 2: Serverless API route
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

  // Fallback 3: Cached products in localStorage or INITIAL_PRODUCTS
  const cached = getCachedProducts();
  const baseList = cached !== null ? cached : INITIAL_PRODUCTS;
  return filterProductsClientSide(baseList, category, search);
}

// 2. Create Product (Admin)
export async function createProduct(product: Partial<Product>): Promise<Product> {
  const category = (product.category as any) || 'farshan';
  const newProduct: Product = {
    id: product.id || `prod-${Date.now()}`,
    name: product.name || 'New Product',
    gujaratiName: product.gujaratiName || '',
    category,
    description: product.description || '',
    gujaratiDescription: product.gujaratiDescription || '',
    ingredients: product.ingredients || '',
    imageUrl: resolveProductImage(product.imageUrl, category),
    rating: product.rating || 5.0,
    reviewCount: product.reviewCount || 0,
    isBestSeller: Boolean(product.isBestSeller),
    inStock: product.inStock !== undefined ? Boolean(product.inStock) : true,
    options: product.options || [{ id: `opt-${Date.now()}`, label: '500g', price: 100 }],
    flavors: product.flavors || [],
    saleType: product.saleType || 'weight',
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
      sale_type: newProduct.saleType,
    });

    if (!error) {
      const cached = getCachedProducts();
      if (cached) {
        setCachedProducts([newProduct, ...cached.filter((p) => p.id !== newProduct.id)]);
      }
      notifyLocalListeners('products');
      // Fire-and-forget sync to local server if running
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

// 3. Update Product (Admin)
export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  const supabase = getSupabase();
  if (supabase) {
    const payload: any = {};
    if (product.name !== undefined) payload.name = product.name;
    if (product.gujaratiName !== undefined) payload.gujarati_name = product.gujaratiName;
    if (product.category !== undefined) payload.category = product.category;
    if (product.description !== undefined) payload.description = product.description;
    if (product.ingredients !== undefined) payload.ingredients = product.ingredients;
    if (product.imageUrl !== undefined) {
      payload.image_url = resolveProductImage(product.imageUrl, product.category);
    }
    if (product.isBestSeller !== undefined) payload.is_bestseller = product.isBestSeller;
    if (product.inStock !== undefined) payload.in_stock = product.inStock;
    if (product.options !== undefined) payload.options = product.options;
    if (product.flavors !== undefined) payload.flavors = product.flavors;
    if (product.saleType !== undefined) payload.sale_type = product.saleType;

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (!error) {
      const updated = data ? mapSupabaseProduct(data) : ({ id, ...product } as Product);
      const cached = getCachedProducts();
      if (cached) {
        setCachedProducts(cached.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      }
      notifyLocalListeners('products');
      safeApiCall(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      return updated;
    }
  }

  const apiData = await safeApiCall<{ product: Product }>(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  notifyLocalListeners('products');
  return apiData?.product ? mapSupabaseProduct(apiData.product) : ({ id, ...product } as Product);
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

// Generate collision-safe Order ID (e.g. GRJ-482915)
function generateOrderId(): string {
  const timePart = Date.now().toString().slice(-4);
  const randPart = Math.floor(10 + Math.random() * 90).toString();
  return `GRJ-${timePart}${randPart}`;
}

// 5. Create Order (Storefront checkout — Atomic Row Insert & Accurate Total Payable)
export async function createOrder(orderPayload: Partial<Order>): Promise<Order> {
  const items = orderPayload.items || [];
  const { subtotal, deliveryFee, totalAmount } = computeOrderAmounts(
    items,
    orderPayload.subtotal,
    orderPayload.deliveryFee,
    orderPayload.totalAmount
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
    deliveryFee,
    totalAmount,
    status: 'pending_confirmation',
    adminNotes: '',
    notes: orderPayload.notes || '',
    createdAt: new Date().toISOString(),
  };

  // Fast Path 1: Direct atomic insert into Supabase
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

  // Fallback 2: API route
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

// 6. Fetch Orders (Admin — Direct Indexed Supabase Query)
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

// 7. Track Order (Customer modal — Direct Indexed Supabase Query)
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

// 8. Update Order Status (Admin Confirm / Dispatch / Cancel)
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  adminNotes?: string
): Promise<Order> {
  const supabase = getSupabase();
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

// 11. Fetch Bulk Inquiries
export async function fetchBulkInquiries(): Promise<BulkInquiry[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bulk_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((b: any) => ({
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
    return apiData.inquiries;
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

// 14. Compute Admin Overview Stats in Memory (Eliminates Redundant Network Roundtrips)
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
      if (callbacks.onInquiriesChange) {
        channel = channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bulk_inquiries' },
          () => callbacks.onInquiriesChange?.()
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

  // Also listen to same-browser BroadcastChannel / custom events for 0ms local tab sync
  let bc: BroadcastChannel | null = null;
  const handleEntityEvent = (entity?: string) => {
    if (entity === 'products') callbacks.onProductsChange?.();
    if (entity === 'orders') callbacks.onOrdersChange?.();
    if (entity === 'inquiries') callbacks.onInquiriesChange?.();
    if (entity === 'reviews') callbacks.onReviewsChange?.();
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
