import { createClient, SupabaseClient } from '@supabase/supabase-js';

let customSupabaseUrl: string | null = null;
let customSupabaseKey: string | null = null;
let supabaseClient: SupabaseClient | null = null;

export function setCustomSupabaseCredentials(url: string, key: string) {
  customSupabaseUrl = url;
  customSupabaseKey = key;
  supabaseClient = null; // reset cached client
}

export function getSupabaseCredentials(): { url: string; key: string } | null {
  const rawUrl = customSupabaseUrl ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL;

  const rawKey = customSupabaseKey ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_API_KEY ||
    process.env.SUPABASE_ANON ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let url = rawUrl ? rawUrl.trim().replace(/^["']|["']$/g, '') : '';
  const key = rawKey ? rawKey.trim().replace(/^["']|["']$/g, '') : '';

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
        supabaseClient = createClient(creds.url, creds.key);
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
        supabaseClient = null;
      }
    }
  }
  return supabaseClient;
}

export const SUPABASE_SQL_SCHEMA = `
-- Execute this SQL script in your Supabase SQL Editor to set up all tables:

CREATE TABLE IF NOT EXISTS products (
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

CREATE TABLE IF NOT EXISTS orders (
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

CREATE TABLE IF NOT EXISTS reviews (
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

CREATE TABLE IF NOT EXISTS bulk_inquiries (
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
`;
