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
  // 1. Check in-memory custom credentials
  let rawUrl = customSupabaseUrl;
  let rawKey = customSupabaseKey;

  // 2. Check localStorage (for browser environments on Vercel or preview)
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

  // 3. Check Vite import.meta.env
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

  // 4. Check Node.js process.env safely
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

  // 5. Default fallback to the project credentials
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
