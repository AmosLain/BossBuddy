// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// DEBUG: verify that your env vars are loaded
console.log(
  '➜ SUPA_URL:', import.meta.env.VITE_SUPABASE_URL,
  '➜ KEY_LEN:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length
);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// initialize the client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Track a rewrite in your “usage” table.
 */
export async function trackRewrite(userId, original, rewritten, tone) {
  const { error } = await supabase
    .from('usage')
    .insert([{ user_id: userId, original, rewritten, tone, created_at: new Date() }]);
  if (error) console.error('trackRewrite failed:', error);
}

/**
 * Count how many rewrites this user has done today.
 */
export async function checkDailyUsage(userId) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfToday);

  if (error) {
    console.error('checkDailyUsage failed:', error);
    return 0;
  }
  return count;
}
