import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

function sanitizeUrl(url: any): string {
  if (typeof url !== 'string') return 'https://ykpqavvgubizcjighhmo.supabase.co';
  const cleaned = url.trim().replace(/^['"]|['"]$/g, '');
  if (!cleaned || cleaned === 'YOUR_SUPABASE_URL' || (!cleaned.startsWith('http://') && !cleaned.startsWith('https://'))) {
    return 'https://ykpqavvgubizcjighhmo.supabase.co';
  }
  return cleaned;
}

function sanitizeKey(key: any): string {
  if (typeof key !== 'string') return '';
  const cleaned = key.trim().replace(/^['"]|['"]$/g, '');
  if (cleaned === 'YOUR_SUPABASE_ANON_KEY' || cleaned === 'placeholder-anon-key') {
    return '';
  }
  return cleaned;
}

const supabaseUrl = sanitizeUrl(env.VITE_SUPABASE_URL);
const supabaseAnonKey = sanitizeKey(env.VITE_SUPABASE_ANON_KEY);

// Check if variables are missing and warn the developer cleanly
const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder-project.supabase.co'
);

if (!supabaseAnonKey) {
  console.warn(
    "Supabase VITE_SUPABASE_ANON_KEY is missing or invalid. " +
    "Please add active keys to your environment secrets to save data permanently."
  );
}

// Instantiate client - fallback on placeholder anon key if none is found to avoid initialization failure
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'placeholder-anon-key'
);

export const isSupabaseConfigured = isConfigured;

