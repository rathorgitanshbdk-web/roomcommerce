import express from 'express';
import path from 'path';
import fs from 'fs';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS } from './src/data/initialData.ts';
import type { Product, Order, Review, BulkInquiry, OrderItem } from './src/types.ts';
import { getSupabase, setCustomSupabaseCredentials, getSupabaseCredentials, SUPABASE_SQL_SCHEMA } from './src/lib/supabase.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req: any, _res: any, next: any) => {
  if (req.body && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // Ignore invalid json string
    }
  }
  next();
});

const STORE_FILE = process.env.VERCEL
  ? path.join('/tmp', 'data_store.json')
  : path.join(process.cwd(), 'data_store.json');

interface StoreData {
  products: Product[];
  orders: Order[];
  reviews: Review[];
  bulkInquiries: BulkInquiry[];
  supabaseConfig?: {
    url: string;
    key: string;
  };
}

let store: StoreData = {
  products: [...INITIAL_PRODUCTS],
  orders: [],
  reviews: [...INITIAL_REVIEWS],
  bulkInquiries: [],
};

function safeJsonParse(val: any, fallback: any) {
  if (val === null || val === undefined) return fallback;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function computeServerOrderAmounts(
  items: OrderItem[],
  rawSubtotal?: any,
  rawDeliveryFee?: any,
  rawTotalAmount?: any
) {
  const safeItems = Array.isArray(items) ? items : [];
  const itemsSum = safeItems.reduce((sum, it: any) => {
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

let lastSyncTimestamp = 0;
let activeSyncPromise: Promise<void> | null = null;

async function ensureSupabaseSynced(force = false) {
  const supabase = getSupabase();
  if (!supabase) return;

  const now = Date.now();
  if (force || now - lastSyncTimestamp > 2000) {
    if (activeSyncPromise) {
      await activeSyncPromise;
      return;
    }
    activeSyncPromise = syncFromSupabase()
      .then(() => {
        lastSyncTimestamp = Date.now();
      })
      .catch((err) => {
        console.error('Error in ensureSupabaseSynced:', err);
      })
      .finally(() => {
        activeSyncPromise = null;
      });
    await activeSyncPromise;
  }
}

async function syncFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const [pRes, oRes, rRes, bRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').order('date', { ascending: false }),
      supabase.from('bulk_inquiries').select('*').order('created_at', { ascending: false }),
    ]);

    if (!pRes.error && Array.isArray(pRes.data)) {
      store.products = pRes.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        gujaratiName: p.gujarati_name,
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
        saleType: p.sale_type || 'weight',
      }));
    }

    if (!oRes.error && Array.isArray(oRes.data)) {
      store.orders = oRes.data.map((o: any) => {
        const items = safeJsonParse(o.items, []);
        const { subtotal, deliveryFee, totalAmount } = computeServerOrderAmounts(
          items,
          o.subtotal,
          o.delivery_fee,
          o.total_amount
        );
        return {
          id: o.id,
          customerName: o.customer_name,
          phone: o.phone,
          address: o.address,
          city: o.city || '',
          pincode: o.pincode || '',
          email: o.email || '',
          items,
          subtotal,
          deliveryFee,
          totalAmount,
          status: o.status || 'pending_confirmation',
          adminNotes: o.admin_notes || '',
          notes: o.notes || '',
          createdAt: o.created_at,
        };
      });
    }

    if (!rRes.error && Array.isArray(rRes.data) && rRes.data.length > 0) {
      store.reviews = rRes.data.map((r: any) => ({
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

    if (!bRes.error && Array.isArray(bRes.data)) {
      store.bulkInquiries = bRes.data.map((b: any) => ({
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

    saveStoreAsync();
  } catch (err) {
    console.error('Supabase sync warning:', err);
  }
}

function saveStoreAsync() {
  if (process.env.VERCEL) return; // Skip unnecessary disk I/O in ephemeral serverless functions
  const payload = JSON.stringify(store, null, 2);
  fs.promises.writeFile(STORE_FILE, payload, 'utf-8').catch((err) => {
    console.error('Failed to save store file:', err);
  });
}

async function saveProductToSupabase(product: Product) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('products').upsert({
      id: product.id,
      name: product.name,
      gujarati_name: product.gujaratiName || null,
      category: product.category,
      description: product.description || null,
      ingredients: product.ingredients || null,
      image_url: product.imageUrl,
      rating: product.rating,
      review_count: product.reviewCount,
      is_bestseller: product.isBestSeller || false,
      in_stock: product.inStock ?? true,
      options: product.options,
      flavors: product.flavors || [],
      sale_type: product.saleType || 'weight',
    });
    if (error) {
      console.error('Failed to upsert product to Supabase:', error.message || error);
    }
  } catch (err) {
    console.error('Failed to upsert product to Supabase:', err);
  }
}

async function deleteProductFromSupabase(id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete product from Supabase:', error.message || error);
    }
  } catch (err) {
    console.error('Failed to delete product from Supabase:', err);
  }
}

async function saveOrderToSupabase(order: Order) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('orders').upsert({
      id: order.id,
      customer_name: order.customerName,
      phone: order.phone,
      address: order.address,
      city: order.city || null,
      pincode: order.pincode || null,
      email: order.email || null,
      items: order.items,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      total_amount: order.totalAmount,
      status: order.status,
      admin_notes: order.adminNotes || null,
      notes: order.notes || null,
      created_at: order.createdAt,
    });
    if (error) {
      console.error('Failed to upsert order to Supabase:', error.message || error);
    }
  } catch (err) {
    console.error('Failed to upsert order to Supabase:', err);
  }
}

async function saveReviewToSupabase(review: Review) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('reviews').upsert({
      id: review.id,
      product_id: review.productId,
      product_name: review.productName,
      customer_name: review.customerName,
      rating: review.rating,
      comment: review.comment,
      date: review.date,
      is_verified_purchase: review.isVerifiedPurchase ?? true,
    });
    if (error) {
      console.error('Failed to upsert review to Supabase:', error.message || error);
    }
  } catch (err) {
    console.error('Failed to upsert review to Supabase:', err);
  }
}

async function saveBulkInquiryToSupabase(inquiry: BulkInquiry) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('bulk_inquiries').upsert({
      id: inquiry.id,
      name: inquiry.name,
      phone: inquiry.phone,
      email: inquiry.email || null,
      business_or_event: inquiry.businessOrEvent || null,
      event_date: inquiry.eventDate || null,
      expected_quantity: inquiry.expectedQuantity,
      products_interested: inquiry.productsInterested || [],
      message: inquiry.message || null,
      status: inquiry.status,
      created_at: inquiry.createdAt,
    });
    if (error) {
      console.error('Failed to upsert bulk inquiry to Supabase:', error.message || error);
    }
  } catch (err) {
    console.error('Failed to upsert bulk inquiry to Supabase:', err);
  }
}

function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.products)) {
        store = parsed;
        if (store.supabaseConfig?.url && store.supabaseConfig?.key) {
          setCustomSupabaseCredentials(store.supabaseConfig.url, store.supabaseConfig.key);
        }
      }
    }
  } catch (err) {
    console.error('Failed to load store file, using default data:', err);
  }
}

loadStore();
if (getSupabase()) {
  ensureSupabaseSynced(true).catch((err) => {
    console.error('Initial Supabase sync error:', err);
  });
}

// ================= API ROUTES =================
const apiRouter = express.Router();

apiRouter.get('/supabase/status', async (_req, res) => {
  try {
    const supabase = getSupabase();
    const creds = getSupabaseCredentials();
    let pingSuccess = false;
    let pingError: string | null = null;

    if (supabase) {
      try {
        const { error } = await supabase.from('products').select('id').limit(1);
        if (error) {
          pingError = error.message;
        } else {
          pingSuccess = true;
        }
      } catch (err: any) {
        pingError = err?.message || 'Network error pinging Supabase';
      }
    }

    res.json({
      configured: Boolean(supabase),
      supabaseUrl: creds?.url || null,
      pingSuccess,
      pingError,
      sqlSchema: SUPABASE_SQL_SCHEMA,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to check status' });
  }
});

apiRouter.post('/supabase/connect', async (req, res) => {
  try {
    const body = typeof req.body === 'string' ? safeJsonParse(req.body, {}) : req.body || {};
    const { supabaseUrl, supabaseKey } = body;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({ error: 'Both Supabase URL and Key are required.' });
    }

    let cleanUrl = String(supabaseUrl).trim().replace(/^["']|["']$/g, '');
    const cleanKey = String(supabaseKey).trim().replace(/^["']|["']$/g, '');

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    setCustomSupabaseCredentials(cleanUrl, cleanKey);
    store.supabaseConfig = { url: cleanUrl, key: cleanKey };
    saveStoreAsync();

    const supabase = getSupabase();
    let pingSuccess = false;
    let pingError: string | null = null;

    if (supabase) {
      try {
        const { error } = await supabase.from('products').select('id').limit(1);
        if (error) {
          pingError = error.message;
        } else {
          pingSuccess = true;
        }
      } catch (e: any) {
        pingError = e?.message || 'Failed to connect';
      }
    }

    await ensureSupabaseSynced(true);

    res.json({
      success: true,
      configured: Boolean(supabase),
      supabaseUrl: cleanUrl,
      pingSuccess,
      pingError,
      message: pingSuccess
        ? 'Successfully connected & verified Supabase!'
        : pingError
        ? `Client created, but test query returned: ${pingError}. Make sure SQL schema is executed!`
        : 'Supabase credentials saved!',
    });
  } catch (err: any) {
    console.error('Supabase connect handler error:', err);
    res.status(500).json({ error: err?.message || 'Failed to connect to Supabase' });
  }
});

// 1. Get All Products
apiRouter.get('/products', async (req, res) => {
  try {
    await ensureSupabaseSynced();
    const { category, search } = req.query;
    let list = store.products;

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

    res.json({ products: list });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch products' });
  }
});

// 2. Add Product (Admin)
apiRouter.post('/products', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name || !body.category) {
      return res.status(400).json({ error: 'Product name and category are required' });
    }

    const newProduct: Product = {
      ...body,
      id: body.id || `prod-${Date.now()}`,
      name: body.name,
      category: body.category,
      description: body.description || '',
      imageUrl:
        body.imageUrl ||
        'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800',
      rating: Number(body.rating) || 5.0,
      reviewCount: Number(body.reviewCount) || 0,
      inStock: body.inStock ?? true,
      isBestSeller: Boolean(body.isBestSeller),
      saleType: body.saleType || 'weight',
      options: body.options || [],
    };

    store.products = [newProduct, ...store.products.filter((p) => p.id !== newProduct.id)];
    saveStoreAsync();
    await saveProductToSupabase(newProduct);
    return res.status(201).json({ product: newProduct });
  } catch (err: any) {
    console.error('Error creating product:', err);
    return res.status(500).json({ error: err?.message || 'Failed to create product' });
  }
});

// 3. Update Product (Admin)
apiRouter.put('/products/:id', async (req, res) => {
  try {
    await ensureSupabaseSynced();
    const { id } = req.params;
    const body = req.body || {};
    const index = store.products.findIndex((p) => p.id === id);

    const updatedProduct: Product =
      index !== -1
        ? { ...store.products[index], ...body, id }
        : ({ id, ...body } as Product);

    if (index !== -1) {
      store.products[index] = updatedProduct;
    } else {
      store.products.unshift(updatedProduct);
    }

    saveStoreAsync();
    await saveProductToSupabase(updatedProduct);
    return res.json({ product: updatedProduct });
  } catch (err: any) {
    console.error('Error updating product:', err);
    return res.status(500).json({ error: err?.message || 'Failed to update product' });
  }
});

// 4. Delete Product (Admin)
apiRouter.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    store.products = store.products.filter((p) => p.id !== id);
    saveStoreAsync();
    await deleteProductFromSupabase(id);
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting product:', err);
    return res.status(500).json({ error: err?.message || 'Failed to delete product' });
  }
});

// 5. Get All Orders (Admin)
apiRouter.get('/orders', async (_req, res) => {
  try {
    await ensureSupabaseSynced();
    res.json({ orders: store.orders });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch orders' });
  }
});

// 6. Create Order (Customer)
apiRouter.post('/orders', async (req, res) => {
  try {
    const {
      id,
      customerName,
      phone,
      address,
      city,
      pincode,
      email,
      items,
      subtotal: rawSubtotal,
      deliveryFee: rawDeliveryFee,
      totalAmount: rawTotalAmount,
      notes,
    } = req.body;

    if (!customerName || !phone || !address || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required customer details or items' });
    }

    const { subtotal, deliveryFee, totalAmount } = computeServerOrderAmounts(
      items,
      rawSubtotal,
      rawDeliveryFee,
      rawTotalAmount
    );

    const timePart = Date.now().toString().slice(-4);
    const randPart = Math.floor(10 + Math.random() * 90).toString();
    const newOrder: Order = {
      id: id || `GRJ-${timePart}${randPart}`,
      customerName,
      phone,
      address,
      city: city || 'Ahmedabad',
      pincode: pincode || '',
      email: email || '',
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      status: 'pending_confirmation',
      createdAt: new Date().toISOString(),
      notes: notes || '',
    };

    store.orders = [newOrder, ...store.orders.filter((o) => o.id !== newOrder.id)];
    saveStoreAsync();
    await saveOrderToSupabase(newOrder);

    res.status(201).json({ order: newOrder });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create order' });
  }
});

// 7. Track Order by Phone or Order ID
apiRouter.get('/orders/track', async (req, res) => {
  try {
    await ensureSupabaseSynced();
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Please provide phone number or order ID' });
    }

    const cleanQuery = query.trim().replace(/^#/, '').toLowerCase();
    const matched = store.orders.filter(
      (o) =>
        o.id.toLowerCase().includes(cleanQuery) ||
        o.phone.includes(cleanQuery) ||
        o.customerName.toLowerCase().includes(cleanQuery)
    );

    res.json({ orders: matched });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to track order' });
  }
});

// 8. Update Order Status (Admin Confirm / Dispatch / Cancel)
apiRouter.put('/orders/:id/status', async (req, res) => {
  try {
    await ensureSupabaseSynced();
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const supabase = getSupabase();
    if (supabase) {
      const payload: any = { status };
      if (adminNotes !== undefined) payload.admin_notes = adminNotes;
      await supabase.from('orders').update(payload).eq('id', id);
    }

    const order = store.orders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      if (adminNotes !== undefined) {
        order.adminNotes = adminNotes;
      }
      saveStoreAsync();
      return res.json({ order });
    }

    return res.json({ order: { id, status, adminNotes } });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update order status' });
  }
});

// 9. Get Reviews
apiRouter.get('/reviews', async (req, res) => {
  try {
    await ensureSupabaseSynced();
    const { productId } = req.query;
    let list = store.reviews;
    if (productId && typeof productId === 'string') {
      list = list.filter((r) => r.productId === productId);
    }
    res.json({ reviews: list });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch reviews' });
  }
});

// 10. Post Review
apiRouter.post('/reviews', async (req, res) => {
  try {
    const { id, productId, productName, customerName, rating, comment } = req.body;

    if (!customerName || !rating || !comment) {
      return res.status(400).json({ error: 'Name, rating, and comment are required' });
    }

    const newReview: Review = {
      id: id || `rev-${Date.now()}`,
      productId: productId || 'storewide',
      productName: productName || 'Store Experience',
      customerName,
      rating: Number(rating),
      comment,
      date: new Date().toISOString().split('T')[0],
      isVerifiedPurchase: true,
    };

    store.reviews.unshift(newReview);
    await saveReviewToSupabase(newReview);

    if (productId) {
      const prod = store.products.find((p) => p.id === productId);
      if (prod) {
        const prodReviews = store.reviews.filter((r) => r.productId === productId);
        const sum = prodReviews.reduce((acc, curr) => acc + curr.rating, 0);
        prod.reviewCount = prodReviews.length;
        prod.rating = Number((sum / prodReviews.length).toFixed(1));
        await saveProductToSupabase(prod);
      }
    }

    saveStoreAsync();
    res.status(201).json({ review: newReview });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to post review' });
  }
});

// 11. Get Bulk Inquiries
apiRouter.get('/bulk-inquiries', async (_req, res) => {
  try {
    await ensureSupabaseSynced();
    res.json({ inquiries: store.bulkInquiries });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch bulk inquiries' });
  }
});

// 12. Submit Bulk Inquiry
apiRouter.post('/bulk-inquiries', async (req, res) => {
  try {
    const {
      id,
      name,
      phone,
      email,
      businessOrEvent,
      eventDate,
      expectedQuantity,
      productsInterested,
      message,
    } = req.body;

    if (!name || !phone || !expectedQuantity) {
      return res.status(400).json({ error: 'Name, Phone and Expected Quantity are required' });
    }

    const newInquiry: BulkInquiry = {
      id: id || `BULK-${Date.now().toString().slice(-3)}${Math.floor(10 + Math.random() * 90)}`,
      name,
      phone,
      email: email || '',
      businessOrEvent: businessOrEvent || 'General Bulk Inquiry',
      eventDate: eventDate || '',
      expectedQuantity,
      productsInterested: productsInterested || [],
      message: message || '',
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    store.bulkInquiries.unshift(newInquiry);
    saveStoreAsync();
    await saveBulkInquiryToSupabase(newInquiry);
    res.status(201).json({ inquiry: newInquiry });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to submit bulk inquiry' });
  }
});

// 13. Update Bulk Inquiry Status (Admin)
apiRouter.put('/bulk-inquiries/:id/status', async (req, res) => {
  try {
    await ensureSupabaseSynced();
    const { id } = req.params;
    const { status } = req.body;

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('bulk_inquiries').update({ status }).eq('id', id);
    }

    const inquiry = store.bulkInquiries.find((b) => b.id === id);
    if (inquiry) {
      inquiry.status = status;
      saveStoreAsync();
      return res.json({ inquiry });
    }

    return res.json({ inquiry: { id, status } });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update bulk inquiry status' });
  }
});

// 14. Admin Overview Stats
apiRouter.get('/stats', async (_req, res) => {
  try {
    await ensureSupabaseSynced();
    const totalOrders = store.orders.length;
    const pendingOrders = store.orders.filter((o) => o.status === 'pending_confirmation').length;
    const confirmedOrders = store.orders.filter(
      (o) => o.status === 'confirmed' || o.status === 'dispatched'
    ).length;
    const totalRevenue = store.orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalProducts = store.products.length;
    const totalBulkInquiries = store.bulkInquiries.length;

    res.json({
      totalOrders,
      pendingOrders,
      confirmedOrders,
      totalRevenue,
      totalProducts,
      totalBulkInquiries,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch admin stats' });
  }
});

app.use('/api', apiRouter);
app.use('/', apiRouter);

async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (hasDist || process.env.NODE_ENV === 'production') {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else if (!process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Swagatam Gujarati Farshan & Hing Store server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
