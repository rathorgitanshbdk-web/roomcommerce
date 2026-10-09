import { Product, Order, Review, BulkInquiry, OrderStatus } from '../types';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS } from '../data/initialData';
import { getSupabase } from '../lib/supabase';

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

function mapSupabaseProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    gujaratiName: p.gujarati_name || '',
    category: p.category,
    description: p.description || '',
    ingredients: p.ingredients || '',
    imageUrl: p.image_url || p.image || '',
    rating: Number(p.rating || 5),
    reviewCount: Number(p.review_count || 0),
    isBestSeller: Boolean(p.is_bestseller),
    inStock: p.in_stock !== undefined ? Boolean(p.in_stock) : true,
    options: safeJsonParse(p.options, []),
    flavors: safeJsonParse(p.flavors, []),
    saleType: p.sale_type || 'weight'
  };
}

function mapSupabaseOrder(o: any): Order {
  return {
    id: o.id,
    customerName: o.customer_name,
    phone: o.phone,
    address: o.address,
    city: o.city || '',
    pincode: o.pincode || '',
    email: o.email || '',
    items: safeJsonParse(o.items, []),
    subtotal: Number(o.subtotal || 0),
    deliveryFee: Number(o.delivery_fee || 0),
    totalAmount: Number(o.total_amount || 0),
    status: (o.status as OrderStatus) || 'pending_confirmation',
    adminNotes: o.admin_notes || '',
    notes: o.notes || '',
    createdAt: o.created_at
  };
}

// 1. Fetch Products
export async function fetchProducts(category?: string, search?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (search) params.append('search', search);

  // 1. Try API route first
  const apiData = await safeApiCall<{ products: Product[] }>(`/api/products?${params.toString()}`);
  if (apiData?.products && Array.isArray(apiData.products) && apiData.products.length > 0) {
    return apiData.products;
  }

  // 2. Direct Supabase Query fallback
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data && data.length > 0) {
        let list = data.map(mapSupabaseProduct);
        if (category && category !== 'all') {
          list = list.filter((p) => p.category === category);
        }
        if (search && typeof search === 'string') {
          const query = search.toLowerCase();
          list = list.filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              (p.gujaratiName && p.gujaratiName.toLowerCase().includes(query)) ||
              p.description.toLowerCase().includes(query)
          );
        }
        return list;
      } else if (!error && data && data.length === 0) {
        // Automatically seed Supabase with initial products if table is empty
        for (const p of INITIAL_PRODUCTS) {
          await supabase.from('products').upsert({
            id: p.id,
            name: p.name,
            gujarati_name: p.gujaratiName || null,
            category: p.category,
            description: p.description || null,
            ingredients: p.ingredients || null,
            image_url: p.imageUrl,
            rating: p.rating,
            review_count: p.reviewCount,
            is_bestseller: p.isBestSeller || false,
            in_stock: p.inStock ?? true,
            options: p.options,
            flavors: p.flavors || [],
            sale_type: p.saleType || 'weight'
          });
        }
      }
    } catch (err) {
      console.warn('Supabase products fetch failed, using fallback:', err);
    }
  }

  // 3. Fallback to initial products
  let list = [...INITIAL_PRODUCTS];
  if (category && category !== 'all') {
    list = list.filter((p) => p.category === category);
  }
  if (search && typeof search === 'string') {
    const query = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.gujaratiName && p.gujaratiName.toLowerCase().includes(query)) ||
        p.description.toLowerCase().includes(query)
    );
  }
  return list;
}

// 2. Create Product (Admin)
export async function createProduct(product: Partial<Product>): Promise<Product> {
  const newProduct: Product = {
    id: product.id || `prod-${Date.now()}`,
    name: product.name || 'New Product',
    gujaratiName: product.gujaratiName || '',
    category: (product.category as any) || 'farshan',
    description: product.description || '',
    ingredients: product.ingredients || '',
    imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800',
    rating: product.rating || 5.0,
    reviewCount: product.reviewCount || 0,
    isBestSeller: Boolean(product.isBestSeller),
    inStock: product.inStock !== undefined ? Boolean(product.inStock) : true,
    options: product.options || [{ id: `opt-${Date.now()}`, label: '500g', price: 100 }],
    flavors: product.flavors || [],
    saleType: product.saleType || 'weight'
  };

  // 1. Try API route
  const apiData = await safeApiCall<{ product: Product }>('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newProduct)
  });
  if (apiData?.product) {
    return apiData.product;
  }

  // 2. Direct Supabase save
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from('products').upsert({
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
      sale_type: newProduct.saleType
    });
  }

  return newProduct;
}

// 3. Update Product (Admin)
export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  const apiData = await safeApiCall<{ product: Product }>(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (apiData?.product) {
    return apiData.product;
  }

  const supabase = getSupabase();
  if (supabase) {
    const payload: any = {};
    if (product.name !== undefined) payload.name = product.name;
    if (product.gujaratiName !== undefined) payload.gujarati_name = product.gujaratiName;
    if (product.category !== undefined) payload.category = product.category;
    if (product.description !== undefined) payload.description = product.description;
    if (product.ingredients !== undefined) payload.ingredients = product.ingredients;
    if (product.imageUrl !== undefined) payload.image_url = product.imageUrl;
    if (product.isBestSeller !== undefined) payload.is_bestseller = product.isBestSeller;
    if (product.inStock !== undefined) payload.in_stock = product.inStock;
    if (product.options !== undefined) payload.options = product.options;
    if (product.flavors !== undefined) payload.flavors = product.flavors;
    if (product.saleType !== undefined) payload.sale_type = product.saleType;

    await supabase.from('products').update(payload).eq('id', id);
  }

  return { id, ...product } as Product;
}

// 4. Delete Product (Admin)
export async function deleteProduct(id: string): Promise<void> {
  await safeApiCall(`/api/products/${id}`, { method: 'DELETE' });

  const supabase = getSupabase();
  if (supabase) {
    await supabase.from('products').delete().eq('id', id);
  }
}

// 5. Create Order (Storefront checkout)
export async function createOrder(orderPayload: Partial<Order>): Promise<Order> {
  const newOrder: Order = {
    id: `GRJ-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: orderPayload.customerName || '',
    phone: orderPayload.phone || '',
    address: orderPayload.address || '',
    city: orderPayload.city || 'Ahmedabad',
    pincode: orderPayload.pincode || '',
    email: orderPayload.email || '',
    items: orderPayload.items || [],
    subtotal: orderPayload.subtotal || 0,
    deliveryFee: orderPayload.deliveryFee || 0,
    totalAmount: orderPayload.totalAmount || 0,
    status: 'pending_confirmation',
    adminNotes: '',
    notes: orderPayload.notes || '',
    createdAt: new Date().toISOString()
  };

  // 1. Try API
  const apiData = await safeApiCall<{ order: Order }>('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newOrder)
  });
  if (apiData?.order) {
    return apiData.order;
  }

  // 2. Direct Supabase save
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from('orders').upsert({
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
      created_at: newOrder.createdAt
    });
  }

  return newOrder;
}

// 6. Fetch Orders (Admin)
export async function fetchOrders(): Promise<Order[]> {
  const apiData = await safeApiCall<{ orders: Order[] }>('/api/orders');
  if (apiData?.orders && Array.isArray(apiData.orders)) {
    return apiData.orders;
  }

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      return data.map(mapSupabaseOrder);
    }
  }

  return [];
}

// 7. Track Order (Customer modal)
export async function trackOrder(query: string): Promise<Order[]> {
  const apiData = await safeApiCall<{ orders: Order[] }>(
    `/api/orders/track?query=${encodeURIComponent(query)}`
  );
  if (apiData?.orders && Array.isArray(apiData.orders)) {
    return apiData.orders;
  }

  const supabase = getSupabase();
  if (supabase) {
    const clean = query.trim();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`id.ilike.%${clean}%,phone.ilike.%${clean}%`);
    if (!error && data) {
      return data.map(mapSupabaseOrder);
    }
  }

  return [];
}

// 8. Update Order Status (Admin accept / dispatch / deliver / cancel)
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  adminNotes?: string
): Promise<Order> {
  const apiData = await safeApiCall<{ order: Order }>(`/api/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, adminNotes })
  });
  if (apiData?.order) {
    return apiData.order;
  }

  const supabase = getSupabase();
  if (supabase) {
    const updatePayload: any = { status };
    if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;
    await supabase.from('orders').update(updatePayload).eq('id', id);
  }

  return { id, status, adminNotes } as unknown as Order;
}

// 9. Fetch Reviews
export async function fetchReviews(productId?: string): Promise<Review[]> {
  const url = productId ? `/api/reviews?productId=${encodeURIComponent(productId)}` : '/api/reviews';
  const apiData = await safeApiCall<{ reviews: Review[] }>(url);
  if (apiData?.reviews && Array.isArray(apiData.reviews) && apiData.reviews.length > 0) {
    return apiData.reviews;
  }

  const supabase = getSupabase();
  if (supabase) {
    let query = supabase.from('reviews').select('*').order('date', { ascending: false });
    if (productId) {
      query = query.eq('product_id', productId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((r: any) => ({
        id: r.id,
        productId: r.product_id,
        productName: r.product_name,
        customerName: r.customer_name,
        rating: Number(r.rating || 5),
        comment: r.comment,
        date: r.date,
        isVerifiedPurchase: Boolean(r.is_verified_purchase)
      }));
    }
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
    productId: reviewPayload.productId || '',
    productName: reviewPayload.productName || '',
    customerName: reviewPayload.customerName || 'Verified Patron',
    rating: reviewPayload.rating || 5,
    comment: reviewPayload.comment || '',
    date: new Date().toISOString().split('T')[0],
    isVerifiedPurchase: true
  };

  const apiData = await safeApiCall<{ review: Review }>('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newReview)
  });
  if (apiData?.review) {
    return apiData.review;
  }

  const supabase = getSupabase();
  if (supabase) {
    await supabase.from('reviews').upsert({
      id: newReview.id,
      product_id: newReview.productId,
      product_name: newReview.productName,
      customer_name: newReview.customerName,
      rating: newReview.rating,
      comment: newReview.comment,
      date: newReview.date,
      is_verified_purchase: newReview.isVerifiedPurchase
    });
  }

  return newReview;
}

// 11. Fetch Bulk Inquiries
export async function fetchBulkInquiries(): Promise<BulkInquiry[]> {
  const apiData = await safeApiCall<{ inquiries: BulkInquiry[] }>('/api/bulk-inquiries');
  if (apiData?.inquiries && Array.isArray(apiData.inquiries)) {
    return apiData.inquiries;
  }

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('bulk_inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
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
        createdAt: b.created_at
      }));
    }
  }

  return [];
}

// 12. Submit Bulk Inquiry
export async function submitBulkInquiry(payload: Partial<BulkInquiry>): Promise<BulkInquiry> {
  const newInquiry: BulkInquiry = {
    id: `BULK-${Math.floor(100 + Math.random() * 900)}`,
    name: payload.name || '',
    phone: payload.phone || '',
    email: payload.email || '',
    businessOrEvent: payload.businessOrEvent || 'Special Event / Catering',
    eventDate: payload.eventDate || '',
    expectedQuantity: payload.expectedQuantity || '10kg+',
    productsInterested: payload.productsInterested || [],
    message: payload.message || '',
    status: 'new',
    createdAt: new Date().toISOString()
  };

  const apiData = await safeApiCall<{ inquiry: BulkInquiry }>('/api/bulk-inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newInquiry)
  });
  if (apiData?.inquiry) {
    return apiData.inquiry;
  }

  const supabase = getSupabase();
  if (supabase) {
    await supabase.from('bulk_inquiries').upsert({
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
      created_at: newInquiry.createdAt
    });
  }

  return newInquiry;
}

// 13. Update Bulk Inquiry Status
export async function updateBulkInquiryStatus(id: string, status: string): Promise<BulkInquiry> {
  const apiData = await safeApiCall<{ inquiry: BulkInquiry }>(`/api/bulk-inquiries/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (apiData?.inquiry) {
    return apiData.inquiry;
  }

  const supabase = getSupabase();
  if (supabase) {
    await supabase.from('bulk_inquiries').update({ status }).eq('id', id);
  }

  return { id, status } as unknown as BulkInquiry;
}

// 14. Fetch Overview Stats
export async function fetchStats() {
  const apiData = await safeApiCall<any>('/api/stats');
  if (apiData && apiData.totalProducts !== undefined) {
    return apiData;
  }

  // Calculate stats from direct Supabase or fallbacks
  const orders = await fetchOrders();
  const products = await fetchProducts();
  const inquiries = await fetchBulkInquiries();

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending_confirmation').length;
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed' || o.status === 'dispatched').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return {
    totalOrders,
    pendingOrders,
    confirmedOrders,
    totalRevenue,
    totalProducts: products.length,
    totalBulkInquiries: inquiries.length
  };
}
