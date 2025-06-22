// test-user-creation.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://wqjjijlhvlapmecioubn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamppamxodmxhcG1lY2lvdWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTYxMzgsImV4cCI6MjA2NTY3MjEzOH0.F0csA_SBcrPuhQ33SiYwrGnUsPE6SDuJ2HQ0JLUcapY'
);

async function createUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'user94559@testmail.dev',
    password: 'SecurePass123!'
  });

  if (error) {
    console.error('Signup error:', error.message);
  } else {
    console.log('User created:', data.user);

    if (data.session) {
      fs.writeFileSync('session.json', JSON.stringify(data.session, null, 2));
      console.log('Session saved to session.json');
    } else {
      console.warn('User created, but no session returned.');
    }
  }
}

createUser();
