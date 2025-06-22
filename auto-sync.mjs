// test-auto-sync.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wqjjijlhvlapmecioubn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamppamxodmxhcG1lY2lvdWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTYxMzgsImV4cCI6MjA2NTY3MjEzOH0.F0csA_SBcrPuhQ33SiYwrGnUsPE6SDuJ2HQ0JLUcapY'
);

console.log('🧪 Testing Automatic User Sync\n');

// Create a brand new user
const email = `autotest${Date.now()}@example.com`;
const password = 'AutoTest123!';

console.log(`Creating user: ${email}`);

// Sign up - this should trigger our function
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email,
  password
});

if (signUpError) {
  console.error('❌ Signup error:', signUpError.message);
  process.exit(1);
}

console.log('✅ User created in Auth');
console.log(`   ID: ${signUpData.user.id}`);

// Wait a moment for the trigger to run
console.log('\n⏳ Waiting for trigger to sync...');
await new Promise(resolve => setTimeout(resolve, 2000));

// Check if user was automatically added to database
console.log('\n🔍 Checking database...');
const { data: dbUser, error: dbError } = await supabase
  .from('users')
  .select('*')
  .eq('id', signUpData.user.id)
  .single();

if (dbError) {
  console.error('❌ User NOT found in database:', dbError.message);
  console.log('   The trigger might not be working properly');
} else {
  console.log('✅ SUCCESS! User automatically synced to database!');
  console.log(`   Email: ${dbUser.email}`);
  console.log(`   Plan: ${dbUser.plan}`);
  console.log(`   Created: ${new Date(dbUser.created_at).toLocaleString()}`);
}

// Show all users
console.log('\n📊 All users in database:');
const { data: allUsers } = await supabase
  .from('users')
  .select('*')
  .order('created_at', { ascending: false });

console.log(`Found ${allUsers?.length || 0} users total`);
allUsers?.slice(0, 5).forEach(user => {
  console.log(`  - ${user.email}`);
});