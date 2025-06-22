// quick-test.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://wqjjijlhvlapmecioubn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamppamxodmxhcG1lY2lvdWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTYxMzgsImV4cCI6MjA2NTY3MjEzOH0.F0csA_SBcrPuhQ33SiYwrGnUsPE6SDuJ2HQ0JLUcapY'
);

// Sign in with existing user
console.log('🔐 Signing in with existing user...\n');

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user94559@testmail.dev',
  password: 'SecurePass123!'
});

if (error) {
  console.error('❌ Sign in failed:', error.message);
  console.log('\nTrying to create a new test user instead...\n');
  
  // Create new user
  const email = `test${Date.now()}@example.com`;
  const password = 'TestPass123!';
  
  console.log(`Creating: ${email}`);
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (!signUpError && signUpData.user) {
    // Sign in with new user
    const { data: newSignIn, error: newSignInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (newSignIn?.session) {
      fs.writeFileSync('session.json', JSON.stringify(newSignIn.session, null, 2));
      console.log('✅ New user created and session saved!');
      
      // Add to database
      await supabase.from('users').insert({
        id: newSignIn.user.id,
        email: newSignIn.user.email,
        plan: 'free'
      });
      
      console.log('✅ User added to database!');
    }
  }
} else {
  console.log('✅ Signed in successfully!');
  fs.writeFileSync('session.json', JSON.stringify(data.session, null, 2));
  console.log('💾 Session saved to session.json');
}

console.log('\n📝 Now run: node check-auth-sync.mjs');