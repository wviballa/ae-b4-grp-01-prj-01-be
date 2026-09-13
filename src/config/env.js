import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || '',
  SERVER_URL: process.env.SERVER_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''),
  VERCEL_URL: process.env.VERCEL_URL || '',

  SUPABASE_URL: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-service-key',

  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_jwt_key_toy_store_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_toy_store_2026',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 300,

  /**
   * Helper to resolve the correct base public URL for links (email verification, password reset)
   * Prioritizes explicit CLIENT_URL -> SERVER_URL -> VERCEL_URL -> Localhost
   */
  getPublicBaseUrl() {
    let base = process.env.CLIENT_URL || process.env.SERVER_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
    if (!base) {
      base = `http://localhost:${this.PORT}/api/v1/auth`;
    }
    if (base && !base.startsWith('http://') && !base.startsWith('https://')) {
      base = `https://${base}`;
    }
    // Remove trailing slashes
    return base.replace(/\/+$/, '');
  },
};

