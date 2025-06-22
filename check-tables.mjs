// check-tables.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wqjjijlhvlapmecioubn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamppamxodmxhcG1lY2lvdWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTYxMzgsImV4cCI6MjA2NTY3MjEzOH0.F0csA_SBcrPuhQ33SiYwrGnUsPE6SDuJ2HQ0JLUcapY'
);

console.log('🔍 Checking Supabase Tables...\n');

const requiredTables = [
  'users',
  'subscriptions',
  'usage_logs',
  'referrals',
  'referral_rewards',
  'ab_tests',
  'payment_events'
];

let missingTables = [];
let existingTables = [];

for (const table of requiredTables) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .limit(1);
    
  if (error && error.message.includes('does not exist')) {
    console.log(`❌ ${table} - NOT FOUND`);
    missingTables.push(table);
  } else if (error) {
    console.log(`⚠️  ${table} - Error: ${error.message}`);
  } else {
    console.log(`✅ ${table} - EXISTS (${data.length} rows)`);
    existingTables.push(table);
  }
}

console.log('\n📊 Summary:');
console.log(`✅ Existing tables: ${existingTables.length}`);
console.log(`❌ Missing tables: ${missingTables.length}`);

if (missingTables.length > 0) {
  console.log('\n⚠️  To create missing tables:');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Run the CREATE TABLE commands for:', missingTables.join(', '));
  console.log('\nNeed the SQL commands? Let me know!');
}

// Check if auth user exists in database
console.log('\n🔍 Checking Auth-Database Sync...');
const { data: authUser } = await supabase.auth.getUser();
if (authUser?.user) {
  const { data: dbUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.user.id)
    .single();
    
  if (error && error.code === 'PGRST116') {
    console.log('❌ User exists in Auth but NOT in users table');
    console.log('   → Run the Auth-to-Database sync trigger');
  } else if (dbUser) {
    console.log('✅ User synced to database');
    console.log(`   Email: ${dbUser.email}`);
    console.log(`   Plan: ${dbUser.plan}`);
  }
}