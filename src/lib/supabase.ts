import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project credentials for the Swagatam Gujarati Store
export const DEFAULT_SUPABASE_URL = 'https://jjwhouebcwwajrkjhvfk.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqd2hvdWViY3d3YWpya2podmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzOTEwMzgsImV4cCI6MjEwMDk2NzAzOH0.uQq-7H_v7YWdr8sEOy6o6pjAFfXrwZmHdbZUk0fmjRE';

let customSupabaseUrl: string | null = null;
let customSupabaseKey: string | null = null;
let supabaseClient: SupabaseClient | null = null;

export function setCustomSupabaseCredentials(url: string, key: string) {
  customSupabaseUrl = url;
  customSupabaseKey = key;
  supabaseClient = null; // reset cached client
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(
        'swagatam_supabase_config',
        JSON.stringify({ url, key })
      );
    } catch {
      // Ignore localStorage errors
    }
  }
}

export function getSupabaseCredentials(): { url: string; key: string } | null {
  let rawUrl = customSupabaseUrl;
  let rawKey = customSupabaseKey;

  if ((!rawUrl || !rawKey) && typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem('swagatam_supabase_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.url && parsed?.key) {
          rawUrl = parsed.url;
          rawKey = parsed.key;
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }

  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      if (!rawUrl) {
        rawUrl =
          metaEnv.VITE_SUPABASE_URL ||
          metaEnv.SUPABASE_URL ||
          metaEnv.NEXT_PUBLIC_SUPABASE_URL;
      }
      if (!rawKey) {
        rawKey =
          metaEnv.VITE_SUPABASE_ANON_KEY ||
          metaEnv.VITE_SUPABASE_KEY ||
          metaEnv.SUPABASE_ANON_KEY ||
          metaEnv.SUPABASE_KEY;
      }
    }
  } catch {
    // import.meta not available
  }

  if (typeof process !== 'undefined' && process.env) {
    if (!rawUrl) {
      rawUrl =
        process.env.SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.REACT_APP_SUPABASE_URL;
    }
    if (!rawKey) {
      rawKey =
        process.env.SUPABASE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.SUPABSE_ANON_KEY ||
        process.env.SUPABSE_KEY ||
        process.env.SUPABASE_SERVICE_KEY ||
        process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_API_KEY ||
        process.env.SUPABASE_ANON ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  }

  if (!rawUrl) rawUrl = DEFAULT_SUPABASE_URL;
  if (!rawKey) rawKey = DEFAULT_SUPABASE_ANON_KEY;

  let url = rawUrl ? String(rawUrl).trim().replace(/^["']|["']$/g, '') : '';
  const key = rawKey ? String(rawKey).trim().replace(/^["']|["']$/g, '') : '';

  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  if (url && key) {
    return { url, key };
  }
  return null;
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseClient) {
    const creds = getSupabaseCredentials();
    if (creds) {
      try {
        supabaseClient = createClient(creds.url, creds.key, {
          realtime: {
            params: {
              eventsPerSecond: 20,
            },
          },
        });
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
        supabaseClient = null;
      }
    }
  }
  return supabaseClient;
}

export const SUPABASE_SQL_SCHEMA = `-- Execute this SQL script in your Supabase SQL Editor (https://supabase.com/dashboard/project/jjwhouebcwwajrkjhvfk/sql/new):

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gujarati_name TEXT,
  category TEXT NOT NULL,
  description TEXT,
  ingredients TEXT,
  image_url TEXT,
  rating NUMERIC DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  is_bestseller BOOLEAN DEFAULT false,
  in_stock BOOLEAN DEFAULT true,
  options JSONB NOT NULL,
  flavors JSONB,
  sale_type TEXT DEFAULT 'weight',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  pincode TEXT,
  email TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  delivery_fee NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending_confirmation',
  admin_notes TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL,
  min_cart_value NUMERIC DEFAULT 0,
  max_uses INTEGER NOT NULL,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  date TEXT NOT NULL,
  is_verified_purchase BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bulk_inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  business_or_event TEXT,
  event_date TEXT,
  expected_quantity TEXT NOT NULL,
  products_interested JSONB,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. High-Speed B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders (phone);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);

-- 2. Backfill / Repair Existing Orders & Broken Hing Image URL
UPDATE public.orders
SET total_amount = COALESCE(subtotal, 0) + COALESCE(delivery_fee, 0)
WHERE COALESCE(total_amount, 0) = 0 AND COALESCE(subtotal, 0) > 0;

UPDATE public.products
SET image_url = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800'
WHERE image_url = 'https://i.ibb.co/r2SJgHWB/Gemini-Generated-Image-1.png' OR COALESCE(image_url, '') = '';

-- 3. Enable Supabase Realtime WebSockets
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'coupons') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reviews') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bulk_inquiries') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bulk_inquiries;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Publication update notice: %', SQLERRM;
END $$;

-- 4. Explicit Table Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products, public.orders, public.coupons, public.reviews, public.bulk_inquiries TO anon, authenticated, service_role;

-- 5. Enable Row-Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to products" ON public.products;
CREATE POLICY "Allow public access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to orders" ON public.orders;
CREATE POLICY "Allow public access to orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to coupons" ON public.coupons;
CREATE POLICY "Allow public access to coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to reviews" ON public.reviews;
CREATE POLICY "Allow public access to reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to bulk_inquiries" ON public.bulk_inquiries;
CREATE POLICY "Allow public access to bulk_inquiries" ON public.bulk_inquiries FOR ALL USING (true) WITH CHECK (true);
`;
