// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// DEBUG: Verify that env vars are loaded
console.log(
  '➜ SUPA_URL:', import.meta.env.VITE_SUPABASE_URL,
  '➜ KEY_LEN:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length
);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Insert a minimal usage record into the 'usage' table.
 */
export async function trackRewrite(userId) {
  try {
    const { error } = await supabase
      .from('usage')
      .insert({ user_id: userId, created_at: new Date().toISOString() });
    if (error) {
      console.error('trackRewrite error:', error);
    } else {
      console.log('trackRewrite: inserted usage for', userId);
    }
  } catch (e) {
    console.error('trackRewrite threw:', e);
  }
}

/**
 * Count how many rewrites the user has done today.
 */
export async function checkDailyUsage(userId) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  try {
    const { count, error } = await supabase
      .from('usage')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', startOfToday.toISOString());
    if (error) {
      console.error('checkDailyUsage error:', error);
      return 0;
    }
    console.log('checkDailyUsage:', count);
    return count;
  } catch (e) {
    console.error('checkDailyUsage threw:', e);
    return 0;
  }
}
