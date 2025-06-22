// test-supabase.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wqjjijlhvlapmecioubn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamppamxodmxhcG1lY2lvdWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTYxMzgsImV4cCI6MjA2NTY3MjEzOH0.F0csA_SBcrPuhQ33SiYwrGnUsPE6SDuJ2HQ0JLUcapY';

console.log('Testing Supabase connection...');

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test the connection
try {
  const { data, error } = await supabase
    .from('users')
    .select('*');
    
  if (error) {
    console.error('❌ Error:', error);
    
    // If tables don't exist, show helpful message
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n📝 It looks like your tables haven\'t been created yet.');
      console.log('Go to your Supabase dashboard > SQL Editor and run the CREATE TABLE commands.');
    }
  } else {
    console.log('✅ Success! Connected to Supabase');
    console.log('📊 Number of users:', data.length);
    console.log('📄 Data:', data);
  }
} catch (err) {
  console.error('❌ Connection failed:', err);
}

// Test auth functionality
console.log('\nTesting Auth...');
const { data: authData, error: authError } = await supabase.auth.getSession();
console.log('Auth session:', authData?.session ? '✅ Active' : '❌ No session');

process.exit(0);