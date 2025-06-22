// check-auth-sync.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://wqjjijlhvlapmecioubn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamppamxodmxhcG1lY2lvdWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTYxMzgsImV4cCI6MjA2NTY3MjEzOH0.F0csA_SBcrPuhQ33SiYwrGnUsPE6SDuJ2HQ0JLUcapY'
);

console.log('🔍 Checking Auth-Database Sync...\n');

// First, let's see all users in the database
const { data: dbUsers, error: dbError } = await supabase
  .from('users')
  .select('*');

console.log('📊 Database users table:');
if (dbError) {
  console.log('❌ Error:', dbError.message);
} else {
  console.log(`Found ${dbUsers.length} users in database`);
  if (dbUsers.length > 0) {
    dbUsers.forEach(user => {
      console.log(`  - ${user.email} (Plan: ${user.plan})`);
    });
  }
}

// Now check if we have a session
if (fs.existsSync('session.json')) {
  console.log('\n🔐 Checking logged-in user...');
  
  const session = JSON.parse(fs.readFileSync('session.json', 'utf-8'));
  
  // Create authenticated client
  const authSupabase = createClient(
    'https://wqjjijlhvlapmecioubn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamppamxodmxhcG1lY2lvdWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTYxMzgsImV4cCI6MjA2NTY3MjEzOH0.F0csA_SBcrPuhQ33SiYwrGnUsPE6SDuJ2HQ0JLUcapY',
    {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    }
  );
  
  const { data: { user }, error: authError } = await authSupabase.auth.getUser();
  
  if (user) {
    console.log(`Auth user: ${user.email} (ID: ${user.id})`);
    
    // Check if this user exists in the database
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error && error.code === 'PGRST116') {
      console.log('\n❌ SYNC ISSUE: User exists in Auth but NOT in database!');
      console.log('\n🔧 Fix: Let me create this user in the database...');
      
      // Try to insert the user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          plan: 'free',
          created_at: user.created_at,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (insertError) {
        console.log('❌ Failed to create user:', insertError.message);
      } else {
        console.log('✅ User created in database successfully!');
        console.log(`   Email: ${newUser.email}`);
        console.log(`   Plan: ${newUser.plan}`);
      }
    } else if (dbUser) {
      console.log('\n✅ User is synced properly!');
      console.log(`   Database ID: ${dbUser.id}`);
      console.log(`   Email: ${dbUser.email}`);
      console.log(`   Plan: ${dbUser.plan}`);
      console.log(`   Created: ${new Date(dbUser.created_at).toLocaleDateString()}`);
    }
  }
} else {
  console.log('\n⚠️  No session.json found. Run test-user-creation.mjs first.');
}

console.log('\n💡 Next Steps:');
console.log('1. If sync is missing, run the auth trigger SQL in Supabase');
console.log('2. Set up Row Level Security (RLS) policies');
console.log('3. Start building your app features!');