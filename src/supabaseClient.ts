import { createClient } from '@supabase/supabase-js';

// Supports both Vite (VITE_*) and Next.js (NEXT_PUBLIC_*) env vars
const supabaseUrl =
  (import.meta as any)?.env?.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  (import.meta as any)?.env?.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (Vite) or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (Next.js).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);