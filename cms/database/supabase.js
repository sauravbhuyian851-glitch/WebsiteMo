/**
 * WebsiteMo CMS — Supabase Database Integration Module
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[SUPABASE] Supabase client initialized for:', supabaseUrl);
  } catch (err) {
    console.error('[SUPABASE] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('[SUPABASE] No SUPABASE_URL / SUPABASE_KEY set in .env (Using local SQLite database fallback)');
}

function getSupabaseClient() {
  return supabase;
}

function isSupabaseConfigured() {
  return !!supabase;
}

/**
 * Health check connection to Supabase
 */
async function testSupabaseConnection() {
  if (!supabase) return { connected: false, reason: 'Credentials missing in .env' };

  try {
    const { data, error } = await supabase.from('options').select('option_name').limit(1);
    if (error) {
      return { connected: false, reason: error.message };
    }
    return { connected: true, data };
  } catch (err) {
    return { connected: false, reason: err.message };
  }
}

module.exports = {
  getSupabaseClient,
  isSupabaseConfigured,
  testSupabaseConnection
};
