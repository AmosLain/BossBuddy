// test-new-user.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://wqjjijlhvlapmecioubn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamppamxodmxhcG1lY2lvdWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTYxMzgsImV4cCI6MjA2NTY3MjEzOH0.F0csA_SBcrPuhQ33SiYwrGnUsPE6SDuJ2HQ0JLUcapY'
);

async function createNewUser() {
  console.log('🚀 Creating a New Test User\n');
  
  // Generate unique email
  const timestamp = Date.now();
  const email = `testuser${timestamp}@example.com`;
  const password = 'TestPassword123!';
  
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}\n`);
  
  // Step 1: Sign up
  console.log('1️⃣ Signing up...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (signUpError) {
    console.error('❌ Signup error:', signUpError.message);
    return;
  }
  
  console.log('✅ Auth user created!');
  console.log(`   ID: ${signUpData.user.id}`);
  
  // Step 2: Sign in
  console.log('\n2️⃣ Signing in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (signInError) {
    console.error('❌ Sign in error:', signInError.message);
    return;
  }
  
  console.log('✅ Signed in successfully!');
  
  // Save session for other scripts
  if (signInData.session) {
    fs.writeFileSync('session.json', JSON.stringify(signInData.session, null, 2));
    console.log('💾 Session saved to session.json');
  }
  
  // Step 3: Add to database
  console.log('\n3️⃣ Adding to database...');
  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .insert({
      id: signInData.user.id,
      email: signInData.user.email,
      plan: 'free'
    })
    .select()
    .single();
    
  if (dbError) {
    console.error('❌ Database error:', dbError.message);
    
    // Check if user already exists
    if (dbError.code === '23505') {
      console.log('ℹ️  User already exists in database');
      
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', signInData.user.id)
        .single();
        
      if (existingUser) {
        console.log('✅ Found existing user:', existingUser.email);
      }
    }
  } else {
    console.log('✅ User added to database!');
  }
  
  // Step 4: Verify everything
  console.log('\n4️⃣ Final verification...');
  const { data: allUsers } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
    
  console.log(`\n📊 Total users in database: ${allUsers?.length || 0}`);
  if (allUsers && allUsers.length > 0) {
    console.log('Recent users:');
    allUsers.slice(0, 3).forEach(user => {
      console.log(`  - ${user.email} (${user.plan})`);
    });
  }
  
  console.log('\n✅ Test complete!');
  console.log('📝 You can now run: node check-auth-sync.mjs');
}

createNewUser().catch(console.error);