-- Execute this SQL script in your Supabase SQL Editor (https://supabase.com/dashboard/project/jjwhouebcwwajrkjhvfk/sql/new):

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
