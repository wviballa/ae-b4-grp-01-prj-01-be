import { createClient } from '@supabase/supabase-js';
import { ENV } from './env.js';

const isPlaceholder = !ENV.SUPABASE_URL || ENV.SUPABASE_URL.includes('placeholder') || !ENV.SUPABASE_ANON_KEY || ENV.SUPABASE_ANON_KEY.includes('placeholder');

if (isPlaceholder) {
  console.warn('⚠️ [Supabase] SUPABASE_URL or keys are currently placeholder values. Database queries will require valid credentials in .env.');
}

// Client with service role key for administrative/backend queries
export const supabaseAdmin = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Standard client for public or scoped operations
export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY
);
