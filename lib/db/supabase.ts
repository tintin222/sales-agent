import { createClient } from '@supabase/supabase-js';

// Handle both Next.js and Node.js environments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  throw new Error('Supabase URL is not configured. Please set NEXT_PUBLIC_SUPABASE_URL in your environment variables.');
}

if (!supabaseServiceKey) {
  throw new Error('Supabase service key is not configured. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables.');
}

// Server-side client with service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Client-side client for public operations
export const supabase = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);