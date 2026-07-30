import { Product, Order, Review, BulkInquiry, OrderStatus } from '../types';

export async function fetchProducts(category?: string, search?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (search) params.append('search', search);

  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  return data.products;
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error('Failed to create product');
  const data = await res.json();
  return data.product;
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error('Failed to update product');
  const data = await res.json();
  return data.product;
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete product');
}

export async function createOrder(orderPayload: Partial<Order>): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });
  if (!res.ok) throw new Error('Failed to place order');
  const data = await res.json();
  return data.order;
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders');
  if (!res.ok) throw new Error('Failed to fetch orders');
  const data = await res.json();
  return data.orders;
}

export async function trackOrder(query: string): Promise<Order[]> {
  const res = await fetch(`/api/orders/track?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to track order');
  const data = await res.json();
  return data.orders;
}

export async function updateOrderStatus(id: string, status: OrderStatus, adminNotes?: string): Promise<Order> {
  const res = await fetch(`/api/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, adminNotes })
  });
  if (!res.ok) throw new Error('Failed to update order status');
  const data = await res.json();
  return data.order;
}

export async function fetchReviews(productId?: string): Promise<Review[]> {
  const url = productId ? `/api/reviews?productId=${encodeURIComponent(productId)}` : '/api/reviews';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  const data = await res.json();
  return data.reviews;
}

export async function submitReview(reviewPayload: Partial<Review>): Promise<Review> {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewPayload)
  });
  if (!res.ok) throw new Error('Failed to submit review');
  const data = await res.json();
  return data.review;
}

export async function fetchBulkInquiries(): Promise<BulkInquiry[]> {
  const res = await fetch('/api/bulk-inquiries');
  if (!res.ok) throw new Error('Failed to fetch bulk inquiries');
  const data = await res.json();
  return data.inquiries;
}

export async function submitBulkInquiry(payload: Partial<BulkInquiry>): Promise<BulkInquiry> {
  const res = await fetch('/api/bulk-inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to submit bulk inquiry');
  const data = await res.json();
  return data.inquiry;
}

export async function updateBulkInquiryStatus(id: string, status: string): Promise<BulkInquiry> {
  const res = await fetch(`/api/bulk-inquiries/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update inquiry status');
  const data = await res.json();
  return data.inquiry;
}

export async function fetchStats() {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
