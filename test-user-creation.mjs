// create-user-manually.mjs
import { createClient } from '@supabase/supabase-js';

// Initialize with service role key for admin access
// Get this from Supabase Dashboard > Settings > API > service_role key

const supabase = createClient(
  'https://wqjjijlhvlapmecioubn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamppamxodmxhcG1lY2lvdWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTYxMzgsImV4cCI6MjA2NTY3MjEzOH0.F0csA_SBcrPuhQ33SiYwrGnUsPE6SDuJ2HQ0JLUcapY'
);

async function createUserManually() {
  console.log('🔧 Manual User Creation\n');
  
  // First, let's check if RLS is enabled
  const { data: tables, error: tablesError } = await supabase
    .from('users')
    .select('*')
    .limit(1);
    
  if (tablesError && tablesError.message.includes('row-level security')) {
    console.log('❌ RLS is blocking access. Using service role key...');
  }
  
  // Create a test user in the database
  const testUser = {
    id: '82137b91-a234-41d1-98c7-7ab9f9045f71', // Your auth user ID
    email: 'user94559@testmail.dev',
    plan: 'free',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log('Creating user:', testUser.email);
  
  const { data, error } = await supabase
    .from('users')
    .insert(testUser)
    .select()
    .single();
    
  if (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === '23505') {
      console.log('ℹ️  User already exists, trying to fetch...');
      
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', testUser.id)
        .single();
        
      if (existingUser) {
        console.log('✅ Found existing user:', existingUser);
      }
    }
  } else {
    console.log('✅ User created successfully!');
    console.log(data);
  }
  
  // List all users
  console.log('\n📊 All users in database:');
  const { data: allUsers, error: listError } = await supabase
    .from('users')
    .select('*');
    
  if (allUsers) {
    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.plan})`);
    });
  }
}

// If using anon key, let's try a different approach
async function createWithAnonKey() {
  const supabaseAnon = createClient(
    'https://wqjjijlhvlapmecioubn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamppamxodmxhcG1lY2lvdWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTYxMzgsImV4cCI6MjA2NTY3MjEzOH0.F0csA_SBcrPuhQ33SiYwrGnUsPE6SDuJ2HQ0JLUcapY'
  );
  
  console.log('\n🔧 Trying with SQL...\n');
  
  // Use raw SQL to bypass RLS
  const { data, error } = await supabaseAnon.rpc('create_user_bypassing_rls', {
    user_id: '82137b91-a234-41d1-98c7-7ab9f9045f71',
    user_email: 'user94559@testmail.dev',
    user_plan: 'free'
  });
  
  if (error) {
    console.log('❌ RPC not available. You need to:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Either disable RLS temporarily or use service role key');
  }
}

// Try the manual creation
createUserManually().catch(console.error);

console.log('\n💡 If this fails, you have 3 options:');
console.log('1. Use service_role key (replace in the script above)');
console.log('2. Temporarily disable RLS in SQL Editor:');
console.log('   ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
console.log('3. Run this SQL directly in Supabase:');
console.log(`   INSERT INTO users (id, email, plan) VALUES ('82137b91-a234-41d1-98c7-7ab9f9045f71', 'user94559@testmail.dev', 'free');`);